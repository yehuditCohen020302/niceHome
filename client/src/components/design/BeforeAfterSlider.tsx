import { useState } from 'react';
import { useI18n } from '../../i18n';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
}

/**
 * BEFORE ←→ AFTER comparison. The divider is a native range input, so it works with
 * mouse, touch and keyboard. Geometry is fixed left-to-right: "before" is always on the left.
 */
export function BeforeAfterSlider({ beforeUrl, afterUrl }: BeforeAfterSliderProps) {
  const { t } = useI18n();
  const [position, setPosition] = useState(50);

  return (
    <figure dir="ltr" className="relative mx-auto w-fit max-w-full select-none self-start overflow-hidden rounded-3xl shadow-sm">
      <img src={afterUrl} alt="" className="block max-h-[75vh] w-auto max-w-full" draggable={false} />
      <img
        src={beforeUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-surface shadow" style={{ left: `${position}%` }} aria-hidden>
        <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink shadow-md">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 7-5 5 5 5M15 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-canvas" dir="rtl">
        {t('beforeAfter.before')}
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-canvas" dir="rtl">
        {t('beforeAfter.after')}
      </span>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label={t('beforeAfter.label')}
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </figure>
  );
}
