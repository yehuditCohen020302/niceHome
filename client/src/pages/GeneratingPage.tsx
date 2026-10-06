import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { DesignStageProgress, DesignStageStatus } from '@nice-home/shared';
import { buttonClasses } from '../components/buttonStyles';
import { useDesignJob } from '../features/design/useDesignJob';
import { useGenerateDesign } from '../features/design/useGenerateDesign';
import { useI18n } from '../i18n';

/** Pause on the finished checklist so the user sees every stage complete before the result opens. */
const DONE_PAUSE_MS = 700;

export function GeneratingPage() {
  const { jobId = '' } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const state = useDesignJob(jobId);
  const { generate, starting } = useGenerateDesign();

  const job = state.status === 'tracking' ? state.job : null;

  useEffect(() => {
    if (job?.status !== 'done' || !job.designId) return;
    const timer = window.setTimeout(() => navigate(`/designs/${job.designId}`, { replace: true }), DONE_PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [job?.status, job?.designId, navigate]);

  if (state.status === 'lost' || state.status === 'server-unreachable') {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <p className="text-lg">{t(state.status === 'lost' ? 'generating.jobLost' : 'room.error.serverDown')}</p>
        <Link to="/upload" className={`${buttonClasses('primary')} mt-6`}>
          {t('configure.goUpload')}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-14 sm:py-20">
      <h1 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">{t('generating.title')}</h1>
      <p className="mt-2 text-center text-ink-muted text-balance">{t('generating.subtitle')}</p>

      <ol className="mt-10 space-y-3" aria-live="polite">
        {(job?.stages ?? []).map((stage) => (
          <StageRow key={stage.id} stage={stage} />
        ))}
      </ol>

      {job?.status === 'failed' && (
        <div role="alert" className="mt-8 rounded-2xl bg-danger px-5 py-4 text-sm text-danger-ink">
          <p>
            {t(job.error?.code === 'products_unavailable' ? 'room.error.productsUnavailable' : 'room.error.generic')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={starting}
              onClick={() => generate(job.roomId, { replace: true })}
              className={buttonClasses('primary')}
            >
              {t('generating.retry')}
            </button>
            <Link to={`/rooms/${job.roomId}`} className={buttonClasses('secondary')}>
              {t('generating.backToRoom')}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

const ICON_CLASSES: Record<DesignStageStatus, string> = {
  done: 'bg-ink text-canvas',
  skipped: 'bg-line text-ink-muted',
  active: 'bg-accent-soft text-accent-strong',
  pending: 'border border-line text-transparent',
};

function StageRow({ stage }: { stage: DesignStageProgress }) {
  const { t } = useI18n();

  let detail: string | null = null;
  if (stage.id === 'search' && stage.total !== undefined && stage.status !== 'pending') {
    detail = t('generating.stage.searchProgress', { done: stage.done ?? 0, total: stage.total });
  } else if (stage.id === 'generate' && stage.status === 'skipped') {
    detail = t('generating.stage.generateSkipped');
  }

  return (
    <li
      className={`flex items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3 transition ${
        stage.status === 'pending' ? 'opacity-60' : ''
      }`}
    >
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${ICON_CLASSES[stage.status]}`} aria-hidden>
        {stage.status === 'done' && (
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {stage.status === 'active' && (
          <span className="size-4 animate-spin rounded-full border-2 border-accent-strong/30 border-t-accent-strong" />
        )}
        {stage.status === 'skipped' && <span className="text-lg leading-none">–</span>}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{t(`generating.stage.${stage.id}`)}</p>
        {detail && <p className="text-sm text-ink-muted">{detail}</p>}
      </div>
      <span className="sr-only">{t(`generating.status.${stage.status}`)}</span>
    </li>
  );
}
