import fs from 'node:fs/promises';
import path from 'node:path';
import type { AcceptedImageType } from '@nice-home/shared';
import { config } from '../config';
import { isValidId, newId } from './ids';

const uploadsDir = path.join(config.dataDir, 'uploads');

const EXTENSIONS: Record<AcceptedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Detects the real image type from the file's magic bytes.
 * The browser-reported MIME type and file name are not trusted.
 */
export function detectImageType(buffer: Buffer): AcceptedImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export async function saveUpload(buffer: Buffer, contentType: AcceptedImageType): Promise<string> {
  await fs.mkdir(uploadsDir, { recursive: true });
  const id = newId();
  await fs.writeFile(path.join(uploadsDir, `${id}.${EXTENSIONS[contentType]}`), buffer);
  return id;
}

/** Returns the absolute path of a stored upload, or null if the id is invalid or unknown. */
export async function findUpload(id: string): Promise<string | null> {
  if (!isValidId(id)) return null;
  for (const extension of Object.values(EXTENSIONS)) {
    const filePath = path.join(uploadsDir, `${id}.${extension}`);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // try the next extension
    }
  }
  return null;
}
