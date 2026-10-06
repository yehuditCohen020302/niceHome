import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { generateDesign } from '../../api/designs';
import type { MessageKey } from '../../i18n';

export type GenerateErrorKey = Extract<MessageKey, `room.error.${string}`>;

/** Runs the design pipeline for a room and opens the result. */
export function useGenerateDesign() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<GenerateErrorKey | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(
    async (roomId: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setGenerating(true);
      setError(null);
      try {
        const design = await generateDesign(roomId, controller.signal);
        navigate(`/designs/${design.id}`);
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.isServerUnreachable) setError('room.error.serverDown');
        else if (cause instanceof ApiError && cause.code === 'products_unavailable') setError('room.error.productsUnavailable');
        else setError('room.error.generic');
        setGenerating(false);
      }
    },
    [navigate],
  );

  return { generate, generating, error };
}
