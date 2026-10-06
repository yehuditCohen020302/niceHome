import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { startVisualization } from '../../api/designs';
import type { MessageKey } from '../../i18n';

export type VisualizeErrorKey = Extract<MessageKey, `visualize.error.${string}`>;

/** Starts creating the visualization for an existing design and opens the progress screen. */
export function useVisualize() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<VisualizeErrorKey | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const visualize = useCallback(
    async (designId: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStarting(true);
      setError(null);
      try {
        const job = await startVisualization(designId, controller.signal);
        navigate(`/generating/${job.id}`);
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.isServerUnreachable) setError('visualize.error.serverDown');
        else if (cause instanceof ApiError && cause.code === 'no_generator') setError('visualize.error.noGenerator');
        else setError('visualize.error.generic');
        setStarting(false);
      }
    },
    [navigate],
  );

  return { visualize, starting, error };
}
