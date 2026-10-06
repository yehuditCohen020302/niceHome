import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BeforeAfterSlider } from '../components/design/BeforeAfterSlider';
import { BottomSheet } from '../components/design/BottomSheet';
import { InteractiveImage } from '../components/design/InteractiveImage';
import { ProductCard } from '../components/design/ProductCard';
import { ShoppingList } from '../components/design/ShoppingList';
import { buttonClasses } from '../components/buttonStyles';
import { buildEntries } from '../features/design/designEntries';
import { useDesign, type LoadedDesign } from '../features/design/useDesign';
import { DESKTOP_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { useI18n } from '../i18n';

/** Grace period so moving the pointer from a hotspot onto its card does not close the card. */
const HOVER_CLOSE_DELAY_MS = 150;

export function DesignPage() {
  const { designId = '' } = useParams();
  const { t } = useI18n();
  const state = useDesign(designId);

  if (state.status === 'loading') {
    return (
      <div className="flex justify-center px-4 py-24 text-ink-muted" role="status">
        <span className="me-3 size-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" aria-hidden />
        {t('design.loading')}
      </div>
    );
  }

  if (state.status !== 'ready') {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <p className="text-lg">{t(state.status === 'not-found' ? 'design.notFound' : 'design.loadError')}</p>
        <Link to="/upload" className={`${buttonClasses('primary')} mt-6`}>
          {t('configure.goUpload')}
        </Link>
      </section>
    );
  }

  return <DesignView data={state.data} />;
}

function DesignView({ data }: { data: LoadedDesign }) {
  const { t, formatPrice } = useI18n();
  const { design, room } = data;
  const entries = useMemo(() => buildEntries(data), [data]);
  const desktop = useMediaQuery(DESKTOP_QUERY);

  // A card is open when pinned by a click/tap, or (desktop only) while hovering a hotspot.
  const [pinned, setPinned] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [view, setView] = useState<'interactive' | 'compare'>('interactive');
  const activeNumber = pinned ?? (desktop ? hovered : null);
  const active = entries.find((entry) => entry.number === activeNumber);

  const figureRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const close = useCallback(() => {
    setPinned(null);
    setHovered(null);
  }, []);

  const hover = (number: number | null) => {
    window.clearTimeout(closeTimer.current);
    if (number !== null) setHovered(number);
    else closeTimer.current = window.setTimeout(() => setHovered(null), HOVER_CLOSE_DELAY_MS);
  };

  const togglePinned = (number: number) => {
    setHovered(null);
    setPinned((current) => (current === number ? null : number));
  };

  const selectFromList = (number: number) => {
    setView('interactive');
    setPinned(number);
    if (desktop) figureRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const step = (direction: 1 | -1) => {
    if (activeNumber === null || entries.length === 0) return;
    const index = entries.findIndex((entry) => entry.number === activeNumber);
    setPinned(entries[(index + direction + entries.length) % entries.length]!.number);
  };

  // Desktop: Escape or a click outside the image closes a pinned card.
  useEffect(() => {
    if (!desktop || activeNumber === null) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close();
    const onPointerDown = (event: PointerEvent) => {
      if (!figureRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [desktop, activeNumber, close]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const closeButton = (
    <button
      type="button"
      onClick={close}
      aria-label={t('card.close')}
      className="-me-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-ink/5"
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
      </svg>
    </button>
  );

  const usesRules = design.pipeline.planner === 'rules' || design.pipeline.ranker === 'rules';
  const mockProducts = entries.some((entry) => entry.product.mock);
  const isEmpty = entries.length === 0 && design.unmatchedSpecs.length === 0;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('design.title')}</h1>
        <p className="mt-1 text-ink-muted" dir="auto">
          {t('design.style', { style: t(`style.${design.style}`) })}
        </p>
      </header>

      {(design.mock || !design.generatedImageUrl) && (
        <aside className="mb-6 rounded-2xl bg-notice px-5 py-4 text-sm text-notice-ink">
          <p className="font-semibold">{t('design.notice.title')}</p>
          <ul className="mt-1 list-disc space-y-0.5 ps-5">
            {!design.generatedImageUrl && <li>{t('design.notice.noImage')}</li>}
            {entries.length > 0 && <li>{t(mockProducts ? 'design.notice.mockProducts' : 'design.notice.realProducts')}</li>}
            {usesRules && <li>{t('design.notice.rules')}</li>}
          </ul>
        </aside>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          {design.generatedImageUrl && (
            <div role="tablist" className="flex gap-1 self-center rounded-full bg-ink/5 p-1 text-sm">
              {(['interactive', 'compare'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={view === mode}
                  onClick={() => setView(mode)}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${view === mode ? 'bg-surface shadow-sm' : 'text-ink-muted'}`}
                >
                  {mode === 'interactive' ? t('beforeAfter.after') : `${t('beforeAfter.before')} / ${t('beforeAfter.after')}`}
                </button>
              ))}
            </div>
          )}

          {view === 'compare' && design.generatedImageUrl ? (
            <BeforeAfterSlider beforeUrl={room.imageUrl} afterUrl={design.generatedImageUrl} />
          ) : (
            <InteractiveImage
              ref={figureRef}
              imageUrl={design.generatedImageUrl ?? room.imageUrl}
              entries={entries}
              activeNumber={activeNumber}
              onHotspotClick={togglePinned}
              {...(desktop
                ? {
                    onHotspotHover: hover,
                    onPopoverHover: (inside: boolean) => hover(inside ? activeNumber : null),
                    popover: active && <ProductCard entry={active} controls={closeButton} />,
                  }
                : {})}
            />
          )}

          {entries.length > 0 && view === 'interactive' && (
            <p className="text-center text-sm text-ink-muted">{t('design.tapHint')}</p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {isEmpty ? (
            <div className="rounded-3xl border border-line bg-surface p-6">
              <h2 className="font-semibold">{t('design.empty.title')}</h2>
              <p className="mt-2 text-sm text-ink-muted">{t('design.empty.body')}</p>
            </div>
          ) : (
            entries.length > 0 && (
              <ShoppingList
                entries={entries}
                totalPrice={design.totalPrice}
                budget={design.budget}
                activeNumber={activeNumber}
                onSelect={selectFromList}
              />
            )
          )}

          {design.unmatchedSpecs.length > 0 && (
            <div className="rounded-3xl border border-line bg-surface p-5">
              <h2 className="font-semibold">{t('design.unmatched.title')}</h2>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                {design.unmatchedSpecs.map((spec) => {
                  const category = t(`category.${spec.category}`);
                  return (
                    <li key={spec.id}>
                      {spec.maxPrice !== undefined
                        ? t('design.unmatched.item', { category, amount: formatPrice(spec.maxPrice) })
                        : t('design.unmatched.itemNoCap', { category })}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-ink-muted">{t('design.unmatched.hint')}</p>
            </div>
          )}

          <Link to="/configure" className={buttonClasses('secondary')}>
            {t('design.editChoices')}
          </Link>
        </div>
      </div>

      <BottomSheet open={!desktop && active !== undefined} label={active?.product.name ?? ''} onClose={close}>
        {active && (
          <>
            <ProductCard entry={active} controls={closeButton} />
            {entries.length > 1 && (
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => step(-1)} className={`${buttonClasses('secondary')} flex-1`}>
                  {t('card.prev')}
                </button>
                <button type="button" onClick={() => step(1)} className={`${buttonClasses('secondary')} flex-1`}>
                  {t('card.next')}
                </button>
              </div>
            )}
          </>
        )}
      </BottomSheet>
    </section>
  );
}
