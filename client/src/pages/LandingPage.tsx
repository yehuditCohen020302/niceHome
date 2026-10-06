import { useI18n } from '../i18n';

export function LandingPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <h1 className="text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
        {t('landing.title')}
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink-muted text-balance sm:text-xl">
        {t('landing.subtitle')}
      </p>
    </section>
  );
}
