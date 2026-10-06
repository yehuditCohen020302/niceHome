import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Room } from '@nice-home/shared';
import { ApiError } from '../api/client';
import { getRoom } from '../api/rooms';
import { buttonClasses } from '../components/buttonStyles';
import { useGenerateDesign } from '../features/design/useGenerateDesign';
import { useI18n } from '../i18n';

type RoomState =
  | { status: 'loading' }
  | { status: 'ready'; room: Room }
  | { status: 'not-found' }
  | { status: 'error' };

export function RoomPage() {
  const { roomId = '' } = useParams();
  const { t } = useI18n();
  const [state, setState] = useState<RoomState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    getRoom(roomId, controller.signal)
      .then((room) => setState({ status: 'ready', room }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: error instanceof ApiError && error.status === 404 ? 'not-found' : 'error' });
      });
    return () => controller.abort();
  }, [roomId]);

  if (state.status === 'loading') {
    return (
      <div className="flex justify-center px-4 py-24 text-ink-muted" role="status">
        <span className="me-3 size-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" aria-hidden />
        {t('room.loading')}
      </div>
    );
  }

  if (state.status !== 'ready') {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <p className="text-lg">{t(state.status === 'not-found' ? 'room.notFound' : 'room.loadError')}</p>
        <Link to="/upload" className={`${buttonClasses('primary')} mt-6`}>
          {t('configure.goUpload')}
        </Link>
      </section>
    );
  }

  return <RoomSummary room={state.room} />;
}

function RoomSummary({ room }: { room: Room }) {
  const { t, formatPrice } = useI18n();
  const { generate, starting, error } = useGenerateDesign();
  const none =<span className="text-ink-muted">{t('room.none')}</span>;
  const list = (items: string[]) => (items.length > 0 ? items.join(' · ') : none);

  const rows: { label: string; value: ReactNode }[] = [
    { label: t('configure.room.title'), value: t(`roomType.${room.roomType}`) },
    { label: t('configure.goals.title'), value: list(room.goals.map((goal) => t(`goal.${goal}`))) },
    {
      label: t('configure.constraints.title'),
      value: list(room.constraints.map((constraint) => t(`constraint.${constraint}`))),
    },
    {
      label: t('configure.budget.title'),
      value:
        room.budget === null
          ? t('configure.budget.unlimited')
          : t('room.budgetValue', { amount: formatPrice(room.budget) }),
    },
    { label: t('configure.style.title'), value: <span dir="auto">{t(`style.${room.style}`)}</span> },
    { label: t('configure.location.city'), value: room.location?.city ?? none },
    { label: t('configure.notes.title'), value: room.notes ?? none },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('room.title')}</h1>
        <p className="mt-1 text-ink-muted">{t('room.subtitle')}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <img
          src={room.imageUrl}
          alt={t('upload.previewAlt')}
          className="w-full rounded-3xl bg-ink/5 object-contain shadow-sm lg:max-h-[32rem]"
        />

        <div className="flex flex-col gap-4">
          <dl className="divide-y divide-line rounded-3xl border border-line bg-surface px-5">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[7rem_1fr] gap-3 py-3 text-sm">
                <dt className="text-ink-muted">{row.label}</dt>
                <dd className="font-medium break-words">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => generate(room.id)}
              disabled={starting}
              className={buttonClasses('primary', 'lg')}
            >
              {starting && (
                <span className="size-4 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" aria-hidden />
              )}
              {starting ? t('room.generating') : t('room.generate')}
            </button>
            {error && (
              <p role="alert" className="rounded-2xl bg-danger px-4 py-3 text-sm text-danger-ink">
                {t(error)}
              </p>
            )}
            <Link to="/configure" className={buttonClasses('secondary')}>
              {t('room.edit')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
