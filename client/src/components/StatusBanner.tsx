import { useHealth } from '../features/health/HealthProvider';
import { useI18n, type MessageKey } from '../i18n';

type Tone = 'notice' | 'danger';

const toneClasses: Record<Tone, string> = {
  notice: 'bg-notice text-notice-ink',
  danger: 'bg-danger text-danger-ink',
};

/**
 * App-wide status: local server down, no internet, or mock mode.
 * Shown above every page so mock data is never mistaken for real data.
 */
export function StatusBanner() {
  const { state, refresh } = useHealth();
  const { t } = useI18n();

  const banners: { key: MessageKey; tone: Tone; retry?: boolean }[] = [];

  if (state.status === 'server-unreachable' || state.status === 'error') {
    banners.push({ key: 'status.serverDown', tone: 'danger', retry: true });
  } else if (state.status === 'ready') {
    if (!state.health.online) banners.push({ key: 'status.offline', tone: 'danger', retry: true });
    if (state.health.mock) banners.push({ key: 'status.mock', tone: 'notice' });
  }

  if (banners.length === 0) return null;

  return (
    <div role="status" aria-live="polite">
      {banners.map(({ key, tone, retry }) => (
        <div
          key={key}
          className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm ${toneClasses[tone]}`}
        >
          <span>{t(key)}</span>
          {retry && (
            <button
              type="button"
              onClick={refresh}
              className="font-medium underline underline-offset-2 hover:no-underline"
            >
              {t('status.retry')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
