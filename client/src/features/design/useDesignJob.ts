import { useEffect, useState } from 'react';
import type { DesignJob } from '@nice-home/shared';
import { ApiError } from '../../api/client';
import { getDesignJob } from '../../api/designs';

const POLL_INTERVAL_MS = 300;

export type DesignJobState =
  | { status: 'loading' }
  | { status: 'tracking'; job: DesignJob }
  | { status: 'lost' }
  | { status: 'server-unreachable' };

/** Polls a design job until it finishes or fails. */
export function useDesignJob(jobId: string): DesignJobState {
  const [state, setState] = useState<DesignJobState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;

    const poll = async () => {
      try {
        const job = await getDesignJob(jobId, controller.signal);
        setState({ status: 'tracking', job });
        if (job.status === 'running') timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 404) setState({ status: 'lost' });
        else if (error instanceof ApiError && error.isServerUnreachable) setState({ status: 'server-unreachable' });
        else timer = window.setTimeout(poll, POLL_INTERVAL_MS * 3);
      }
    };

    setState({ status: 'loading' });
    void poll();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [jobId]);

  return state;
}
