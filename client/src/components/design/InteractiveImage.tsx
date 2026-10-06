import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import type { DesignEntry } from '../../features/design/designEntries';
import { useI18n } from '../../i18n';

interface InteractiveImageProps {
  imageUrl: string;
  entries: DesignEntry[];
  /** Number of the entry whose card is open, if any. */
  activeNumber: number | null;
  /** Desktop only: card shown next to the active hotspot. On mobile the page shows a bottom sheet instead. */
  popover?: ReactNode;
  onHotspotClick: (number: number) => void;
  onHotspotHover?: (number: number | null) => void;
  onPopoverHover?: (inside: boolean) => void;
}

/** Room image with numbered hotspots on every purchasable item. */
export const InteractiveImage = forwardRef<HTMLElement, InteractiveImageProps>(function InteractiveImage(
  { imageUrl, entries, activeNumber, popover, onHotspotClick, onHotspotHover, onPopoverHover },
  ref,
) {
  const { t } = useI18n();
  const active = entries.find((entry) => entry.number === activeNumber);

  return (
    <figure ref={ref} className="relative mx-auto w-fit max-w-full self-start">
      <img
        src={imageUrl}
        alt={t('design.imageAlt')}
        className="block max-h-[75vh] w-auto max-w-full rounded-3xl bg-ink/5 shadow-sm"
      />

      {entries.map((entry) => {
        const isActive = entry.number === activeNumber;
        return (
          <button
            key={entry.item.specId}
            type="button"
            aria-label={t('design.hotspot', { number: entry.number, name: entry.product.name })}
            aria-expanded={isActive}
            onClick={() => onHotspotClick(entry.number)}
            onMouseEnter={onHotspotHover ? () => onHotspotHover(entry.number) : undefined}
            onMouseLeave={onHotspotHover ? () => onHotspotHover(null) : undefined}
            className={
              'absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm font-semibold shadow-md ring-4 transition md:size-9 ' +
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
              (isActive ? 'z-10 scale-110 bg-ink text-canvas ring-ink/25' : 'bg-surface text-ink ring-surface/50 hover:scale-110')
            }
            // Image coordinates are physical (left/top) regardless of text direction.
            style={{ left: `${entry.item.x * 100}%`, top: `${entry.item.y * 100}%` }}
          >
            {entry.number}
          </button>
        );
      })}

      {active && popover && (
        <div
          role="dialog"
          aria-label={active.product.name}
          onMouseEnter={onPopoverHover ? () => onPopoverHover(true) : undefined}
          onMouseLeave={onPopoverHover ? () => onPopoverHover(false) : undefined}
          className="absolute z-20 w-80 rounded-3xl bg-surface p-5 text-start shadow-2xl ring-1 ring-ink/5"
          style={popoverPosition(active.item.x, active.item.y)}
        >
          {popover}
        </div>
      )}
    </figure>
  );
});

/** Places the card beside the hotspot, on the side with more room, and keeps it vertically in view. */
function popoverPosition(x: number, y: number): CSSProperties {
  const gap = '28px';
  const horizontal: CSSProperties =
    x > 0.5 ? { right: `calc(${(1 - x) * 100}% + ${gap})` } : { left: `calc(${x * 100}% + ${gap})` };
  if (y < 0.35) return { ...horizontal, top: `calc(${y * 100}% - 24px)` };
  if (y > 0.65) return { ...horizontal, bottom: `calc(${(1 - y) * 100}% - 24px)` };
  return { ...horizontal, top: `${y * 100}%`, transform: 'translateY(-50%)' };
}
