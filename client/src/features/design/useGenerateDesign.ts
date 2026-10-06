import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { startDesignJob } from '../../api/designs';
import type { MessageKey } from '../../i18n';

export type GenerateErrorKey = Extract<MessageKey, `room.error.${string}`>;

/** Starts building a design for a room and opens the progress screen. */
export function useGenerateDesign() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<GenerateErrorKey | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(
    async (roomId: string, options?: { replace?: boolean }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStarting(true);
      setError(null);
      try {
        const job = await startDesignJob(roomId, controller.signal);
        navigate(`/generating/${job.id}`, { replace: options?.replace ?? false });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof ApiError && cause.isServerUnreachable ? 'room.error.serverDown' : 'room.error.generic');
        setStarting(false);
      }
    },
    [navigate],
  );

  return { generate, starting, error };
}
