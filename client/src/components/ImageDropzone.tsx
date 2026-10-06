import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ACCEPTED_IMAGE_TYPES } from '@nice-home/shared';
import { useI18n } from '../i18n';
import { buttonClasses } from './buttonStyles';
import { MAX_UPLOAD_MB } from '../features/upload/useImageUpload';

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(',');

function hasTouchCamera(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

interface ImageDropzoneProps {
  onFiles: (files: FileList) => void;
}

export function ImageDropzone({ onFiles }: ImageDropzoneProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave also fire for child elements; count depth to know when the pointer really left.
  const dragDepth = useRef(0);
  const [showCamera] = useState(hasTouchCamera);

  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

  const handleDragEnter = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDrop = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    onFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) onFiles(event.target.files);
    // Allow choosing the same file again after an error.
    event.target.value = '';
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={(event) => hasFiles(event) && event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex aspect-[4/3] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 text-center transition sm:aspect-[16/9] ${
        isDragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
      }`}
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m4 17 5-4.5 3.5 3 2.5-2 5 3.5" strokeLinejoin="round" />
        </svg>
      </div>

      <p className="text-lg font-semibold">
        {isDragging ? t('upload.dropzone.dragActive') : t('upload.dropzone.title')}
      </p>

      {!isDragging && (
        <>
          <p className="my-3 text-sm text-ink-muted">{t('upload.dropzone.or')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {showCamera && (
              <button type="button" onClick={() => cameraInputRef.current?.click()} className={buttonClasses('primary')}>
                {t('upload.dropzone.camera')}
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={buttonClasses(showCamera ? 'secondary' : 'primary')}
            >
              {t('upload.dropzone.choose')}
            </button>
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            {t('upload.dropzone.hint', { maxMb: MAX_UPLOAD_MB })}
          </p>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInputChange}
        tabIndex={-1}
        aria-hidden
        className="hidden"
      />
      {showCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept={ACCEPT}
          capture="environment"
          onChange={handleInputChange}
          tabIndex={-1}
          aria-hidden
          className="hidden"
        />
      )}
    </div>
  );
}
