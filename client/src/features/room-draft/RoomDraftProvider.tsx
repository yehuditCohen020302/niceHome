import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { UploadedImage } from '@nice-home/shared';

/** What the user has entered so far, before a Room is created on the server. */
export interface RoomDraft {
  image?: UploadedImage;
}

interface RoomDraftContextValue {
  draft: RoomDraft;
  updateDraft: (patch: Partial<RoomDraft>) => void;
  resetDraft: () => void;
}

const STORAGE_KEY = 'nice-home:room-draft';

// sessionStorage keeps the draft across a page refresh. It can be unavailable
// (private mode, blocked storage), so every access is guarded.
function loadDraft(): RoomDraft {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RoomDraft) : {};
  } catch {
    return {};
  }
}

function saveDraft(draft: RoomDraft): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Not persisting is acceptable; the in-memory draft still works.
  }
}

const RoomDraftContext = createContext<RoomDraftContextValue | null>(null);

export function RoomDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RoomDraft>(loadDraft);

  const updateDraft = useCallback((patch: Partial<RoomDraft>) => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      saveDraft(next);
      return next;
    });
  }, []);

  const resetDraft = useCallback(() => {
    saveDraft({});
    setDraft({});
  }, []);

  return (
    <RoomDraftContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </RoomDraftContext.Provider>
  );
}

export function useRoomDraft(): RoomDraftContextValue {
  const context = useContext(RoomDraftContext);
  if (!context) {
    throw new Error('useRoomDraft must be used inside <RoomDraftProvider>');
  }
  return context;
}
