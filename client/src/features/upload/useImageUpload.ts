import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  type UploadedImage,
} from '@nice-home/shared';
import { ApiError } from '../../api/client';
import { uploadImage } from '../../api/uploads';
import type { MessageKey } from '../../i18n';

export const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

export type UploadErrorKey = Extract<MessageKey, `upload.error.${string}`>;

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; previewUrl: string }
  | { status: 'uploaded'; image: UploadedImage }
  | { status: 'error'; error: UploadErrorKey; previewUrl?: string; canRetry: boolean };

/** Client-side check before uploading. The server re-validates the actual file bytes. */
export function validateImageFile(file: File): UploadErrorKey | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'upload.error.type';
  if (file.size > MAX_UPLOAD_BYTES) return 'upload.error.size';
  return null;
}

function errorKeyFor(error: unknown): UploadErrorKey {
  if (error instanceof ApiError) {
    if (error.isServerUnreachable) return 'upload.error.serverDown';
    if (error.code === 'unsupported_image_type') return 'upload.error.type';
    if (error.code === 'file_too_large') return 'upload.error.size';
  }
  return 'upload.error.generic';
}

export function useImageUpload(options: {
  initialImage?: UploadedImage;
  onUploaded: (image: UploadedImage) => void;
}) {
  const { initialImage, onUploaded } = options;
  const [state, setState] = useState<UploadState>(
    initialImage ? { status: 'uploaded', image: initialImage } : { status: 'idle' },
  );

  const fileRef = useRef<File | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      releasePreview();
    },
    [releasePreview],
  );

  const upload = useCallback(
    async (file: File, previewUrl: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ status: 'uploading', previewUrl });
      try {
        const image = await uploadImage(file, controller.signal);
        if (controller.signal.aborted) return;
        releasePreview();
        fileRef.current = null;
        setState({ status: 'uploaded', image });
        onUploadedRef.current(image);
      } catch (error) {
        if (controller.signal.aborted) return;
        const key = errorKeyFor(error);
        // A file the server rejected will be rejected again; only transient failures are retryable.
        const canRetry = key === 'upload.error.serverDown' || key === 'upload.error.generic';
        setState({ status: 'error', error: key, previewUrl, canRetry });
      }
    },
    [releasePreview],
  );

  const selectFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      if (list.length > 1) {
        setState({ status: 'error', error: 'upload.error.multiple', canRetry: false });
        return;
      }
      const file = list[0]!;
      const invalid = validateImageFile(file);
      if (invalid) {
        setState({ status: 'error', error: invalid, canRetry: false });
        return;
      }

      releasePreview();
      const previewUrl = URL.createObjectURL(file);
      previewUrlRef.current = previewUrl;
      fileRef.current = file;
      void upload(file, previewUrl);
    },
    [releasePreview, upload],
  );

  const retry = useCallback(() => {
    if (fileRef.current && previewUrlRef.current) {
      void upload(fileRef.current, previewUrlRef.current);
    }
  }, [upload]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    releasePreview();
    fileRef.current = null;
    setState({ status: 'idle' });
  }, [releasePreview]);

  return { state, selectFiles, retry, reset };
}
