import { Link, Outlet } from 'react-router-dom';
import { useI18n } from '../i18n';
import { StatusBanner } from './StatusBanner';

export function Layout() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col">
      <StatusBanner />
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span dir="ltr">{t('app.name')}</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
