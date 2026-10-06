import { Link } from 'react-router-dom';
import { ImageDropzone } from '../components/ImageDropzone';
import { buttonClasses } from '../components/buttonStyles';
import { useRoomDraft } from '../features/room-draft/RoomDraftProvider';
import { MAX_UPLOAD_MB, useImageUpload, type UploadState } from '../features/upload/useImageUpload';
import { useI18n, type MessageKey } from '../i18n';

const TIPS: MessageKey[] = ['upload.tips.wide', 'upload.tips.light', 'upload.tips.level'];

function previewUrlOf(state: UploadState): string | undefined {
  switch (state.status) {
    case 'uploading':
      return state.previewUrl;
    case 'uploaded':
      return state.image.url;
    case 'error':
      return state.previewUrl;
    default:
      return undefined;
  }
}

export function UploadPage() {
  const { t } = useI18n();
  const { draft, updateDraft } = useRoomDraft();
  const { state, selectFiles, retry, reset } = useImageUpload({
    initialImage: draft.image,
    onUploaded: (image) => updateDraft({ image }),
  });

  const previewUrl = previewUrlOf(state);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{t('upload.title')}</h1>
        <p className="mt-3 text-ink-muted">{t('upload.subtitle')}</p>
      </header>

      {previewUrl ? (
        <figure className="relative overflow-hidden rounded-3xl bg-ink/5 shadow-sm">
          <img
            src={previewUrl}
            alt={t('upload.previewAlt')}
            // A remembered image may have been deleted from server/data; fall back to the dropzone.
            onError={state.status === 'uploaded' ? reset : undefined}
            className="max-h-[70vh] w-full object-contain"
          />
          {state.status === 'uploading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/40 text-canvas backdrop-blur-[2px]">
              <span className="size-9 animate-spin rounded-full border-3 border-canvas/40 border-t-canvas" aria-hidden />
              <span className="font-medium" role="status">
                {t('upload.uploading')}
              </span>
            </div>
          )}
        </figure>
      ) : (
        <ImageDropzone onFiles={selectFiles} />
      )}

      {state.status === 'error' && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-danger px-4 py-3 text-sm text-danger-ink"
        >
          <span>{t(state.error, { maxMb: MAX_UPLOAD_MB })}</span>
          <div className="flex gap-2">
            {state.canRetry && (
              <button type="button" onClick={retry} className="font-medium underline underline-offset-2">
                {t('upload.retry')}
              </button>
            )}
            {state.previewUrl && (
              <button type="button" onClick={reset} className="font-medium underline underline-offset-2">
                {t('upload.replace')}
              </button>
            )}
          </div>
        </div>
      )}

      {state.status === 'uploaded' && (
        <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <span className="flex items-center gap-1.5 text-sm text-ink-muted">
              <svg viewBox="0 0 20 20" className="size-4 text-accent-strong" fill="currentColor" aria-hidden>
                <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3-4.5 4.5a1 1 0 0 1-1.4 0l-2-2a1 1 0 1 1 1.4-1.4l1.3 1.3 3.8-3.8a1 1 0 0 1 1.4 1.4Z" />
              </svg>
              {t('upload.uploaded')}
            </span>
            <button type="button" onClick={reset} className={buttonClasses('ghost')}>
              {t('upload.replace')}
            </button>
          </div>
          <Link to="/configure" className={buttonClasses('primary', 'lg')}>
            {t('upload.continue')}
          </Link>
        </div>
      )}

      {state.status !== 'uploaded' && (
        <aside className="mt-10 rounded-3xl border border-line bg-surface p-6">
          <h2 className="font-semibold">{t('upload.tips.title')}</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {t(tip)}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
}
