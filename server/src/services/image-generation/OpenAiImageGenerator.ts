import fs from 'node:fs/promises';
import type { AcceptedImageType } from '@nice-home/shared';
import { saveGenerated } from '../../storage/generated';
import { generationSize, readImageSize } from '../../storage/imageSize';
import { detectImageType, findUpload } from '../../storage/uploads';
import { buildPrompt } from './buildPrompt';
import {
  GenerationError,
  type GenerationItem,
  type GenerationRequest,
  type GenerationResult,
  type ImageGenerator,
} from './ImageGenerator';

/** Room photo + this many products as references (the API accepts up to 16 images). */
const MAX_PRODUCT_REFERENCES = 8;
const PRODUCT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const PRODUCT_IMAGE_TIMEOUT_MS = 20_000;
/** Image edits with several references can take a couple of minutes. */
const GENERATION_TIMEOUT_MS = 240_000;

export interface OpenAiImageOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  quality: string;
}

const EXTENSIONS: Record<AcceptedImageType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * Creates the visualization with OpenAI's image edit API: the user's photo plus the chosen
 * products' real photos as references, so the result shows these exact products in this room.
 */
export class OpenAiImageGenerator implements ImageGenerator {
  readonly id = 'openai';

  constructor(private readonly options: OpenAiImageOptions) {}

  async generate({ room, items }: GenerationRequest): Promise<GenerationResult> {
    if (items.length === 0) return { imageUrl: null };

    const roomPath = await findUpload(room.imageId);
    if (!roomPath) throw new GenerationError('room_image_missing', 'The room photo is no longer on disk');
    const roomImage = await fs.readFile(roomPath);
    const roomType = detectImageType(roomImage);
    if (!roomType) throw new GenerationError('room_image_invalid', 'The room photo is not a supported image');

    // Only products whose real photo we could download go into the prompt — the model must
    // never be asked to draw a product it has not seen.
    const references: { item: GenerationItem; image: Buffer; type: AcceptedImageType }[] = [];
    for (const item of items.slice(0, MAX_PRODUCT_REFERENCES)) {
      const image = await downloadProductImage(item.product.imageUrl);
      if (image) references.push({ item, ...image });
      else console.warn(`[generation] skipped "${item.product.name}": its image could not be downloaded`);
    }
    if (references.length === 0) {
      throw new GenerationError('no_product_images', 'None of the product images could be downloaded');
    }

    const form = new FormData();
    form.append('model', this.options.model);
    form.append('prompt', buildPrompt(references.map((reference) => reference.item), room.constraints));
    form.append('image[]', new Blob([new Uint8Array(roomImage)], { type: roomType }), `room.${EXTENSIONS[roomType]}`);
    references.forEach(({ image, type }, index) => {
      form.append('image[]', new Blob([new Uint8Array(image)], { type }), `product-${index + 1}.${EXTENSIONS[type]}`);
    });
    form.append('size', generationSize(readImageSize(roomImage)));
    form.append('quality', this.options.quality);
    form.append('output_format', 'jpeg');
    form.append('output_compression', '90');
    form.append('n', '1');
    // Newer models ignore input_fidelity; older GPT image models use it to stay close to the photo.
    if (/^gpt-image-1/.test(this.options.model)) form.append('input_fidelity', 'high');

    let response: Response;
    try {
      response = await fetch(`${this.options.baseUrl}/images/edits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.options.apiKey}` },
        body: form,
        signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
      throw new GenerationError(timedOut ? 'timeout' : 'unreachable', timedOut ? 'Image generation timed out' : 'OpenAI is not reachable');
    }

    const body = (await response.json().catch(() => null)) as {
      data?: { b64_json?: string }[];
      error?: { message?: string; code?: string; type?: string };
    } | null;

    if (!response.ok) throw toGenerationError(response.status, body?.error);

    const base64 = body?.data?.[0]?.b64_json;
    const output = base64 ? Buffer.from(base64, 'base64') : null;
    if (!output || !detectImageType(output)) {
      throw new GenerationError('bad_response', 'OpenAI returned no usable image');
    }
    const id = await saveGenerated(output);
    return { imageUrl: `/api/generated/${id}` };
  }
}

async function downloadProductImage(url: string): Promise<{ image: Buffer; type: AcceptedImageType } | null> {
  if (!/^https?:\/\//.test(url)) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(PRODUCT_IMAGE_TIMEOUT_MS) });
    if (!response.ok) return null;
    const image = Buffer.from(await response.arrayBuffer());
    if (image.length > PRODUCT_IMAGE_MAX_BYTES) return null;
    const type = detectImageType(image);
    return type ? { image, type } : null;
  } catch {
    return null;
  }
}

function toGenerationError(status: number, error: { message?: string; code?: string; type?: string } | undefined): GenerationError {
  const message = error?.message ?? `HTTP ${status}`;
  if (status === 401) return new GenerationError('auth', message);
  if (status === 429) {
    // 429 covers both "too many requests" and "no credit left". The code field is not always
    // set for the latter (seen: "You have no credits remaining…"), so the message is checked too.
    const noCredit = /insufficient_quota|billing|credit|quota/i.test(`${error?.code} ${error?.type} ${message}`);
    return new GenerationError(noCredit ? 'quota' : 'rate_limited', message);
  }
  if (status === 400 && /safety|moderation|content_policy/i.test(`${error?.code} ${error?.type} ${message}`)) {
    return new GenerationError('rejected', message);
  }
  return new GenerationError('failed', message);
}
