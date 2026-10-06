import { Link } from 'react-router-dom';
import { HeroIllustration } from '../components/HeroIllustration';
import { buttonClasses } from '../components/buttonStyles';
import { useI18n, type MessageKey } from '../i18n';

const STEPS: { title: MessageKey; body: MessageKey }[] = [
  { title: 'landing.step1.title', body: 'landing.step1.body' },
  { title: 'landing.step2.title', body: 'landing.step2.body' },
  { title: 'landing.step3.title', body: 'landing.step3.body' },
];

export function LandingPage() {
  const { t, locale } = useI18n();
  const numberFormat = new Intl.NumberFormat(locale.intl);

  return (
    <>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-14 pb-10 text-center sm:pt-20">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
          {t('landing.title')}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-muted text-balance sm:text-xl">
          {t('landing.subtitle')}
        </p>
        <Link to="/upload" className={`${buttonClasses('primary', 'lg')} mt-8`}>
          {t('landing.cta')}
        </Link>
      </section>

      <div className="px-4 sm:px-6">
        <HeroIllustration />
      </div>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-sm font-semibold tracking-widest text-accent-strong">
          {t('landing.howItWorks')}
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-3xl border border-line bg-surface p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-strong">
                {numberFormat.format(index + 1)}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t(step.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t(step.body)}</p>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-10 max-w-xl text-center text-sm text-ink-muted text-balance">
          {t('landing.promise')}
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/upload" className={buttonClasses('secondary', 'lg')}>
            {t('landing.cta')}
          </Link>
        </div>
      </section>
    </>
  );
}
