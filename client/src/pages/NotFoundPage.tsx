import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
      <Link
        to="/"
        className="mt-6 rounded-full bg-ink px-6 py-3 font-medium text-canvas transition hover:bg-ink/85"
      >
        {t('notFound.back')}
      </Link>
    </section>
  );
}
