import { Link } from 'react-router-dom';
import { buttonClasses } from '../components/buttonStyles';
import { useRoomDraft } from '../features/room-draft/RoomDraftProvider';
import { useI18n } from '../i18n';

/** Placeholder until M3 adds the upgrade preferences form. */
export function ConfigurePage() {
  const { t } = useI18n();
  const { draft } = useRoomDraft();

  if (!draft.image) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <p className="text-lg">{t('configure.noImage')}</p>
        <Link to="/upload" className={`${buttonClasses('primary')} mt-6`}>
          {t('configure.goUpload')}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-center text-2xl font-bold tracking-tight sm:text-4xl">{t('configure.title')}</h1>
      <img
        src={draft.image.url}
        alt={t('upload.previewAlt')}
        className="mx-auto mt-8 max-h-72 rounded-2xl object-contain shadow-sm"
      />
      <p className="mt-6 text-center text-ink-muted">{t('configure.comingSoon')}</p>
    </section>
  );
}
