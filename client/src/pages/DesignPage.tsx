import { Link, useParams } from 'react-router-dom';
import { buttonClasses } from '../components/buttonStyles';
import { useDesign, type LoadedDesign } from '../features/design/useDesign';
import { useI18n } from '../i18n';

/**
 * Interim result page for M4: shows the pipeline output plainly.
 * M5 replaces it with the interactive image, product cards and before/after.
 */
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
  const { design, room, products, stores } = data;

  const usesRules = design.pipeline.planner === 'rules' || design.pipeline.ranker === 'rules';
  const isEmpty = design.items.length === 0 && design.unmatchedSpecs.length === 0;

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
            {design.mock && <li>{t('design.notice.mockProducts')}</li>}
            {usesRules && <li>{t('design.notice.rules')}</li>}
          </ul>
        </aside>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <figure className="relative mx-auto w-fit self-start">
          <img
            src={design.generatedImageUrl ?? room.imageUrl}
            alt={t('design.imageAlt')}
            className="block max-h-[70vh] w-auto max-w-full rounded-3xl bg-ink/5 shadow-sm"
          />
          {design.items.map((item, index) => {
            const product = products.get(item.productId);
            return (
              <span
                key={item.specId}
                role="img"
                aria-label={t('design.hotspot', { number: index + 1, name: product?.name ?? '' })}
                className="absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink shadow-md ring-4 ring-surface/50"
                // Image coordinates are physical (left/top) regardless of text direction.
                style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}
              >
                {index + 1}
              </span>
            );
          })}
        </figure>

        <div className="flex flex-col gap-4">
          {isEmpty ? (
            <div className="rounded-3xl border border-line bg-surface p-6">
              <h2 className="font-semibold">{t('design.empty.title')}</h2>
              <p className="mt-2 text-sm text-ink-muted">{t('design.empty.body')}</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-line bg-surface">
              <h2 className="px-5 pt-5 text-lg font-semibold">{t('design.items.title')}</h2>
              <ol className="divide-y divide-line">
                {design.items.map((item, index) => {
                  const product = products.get(item.productId);
                  if (!product) return null;
                  const store = stores.get(product.storeId);
                  return (
                    <li key={item.specId} className="flex gap-3 px-5 py-4">
                      <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
                        {index + 1}
                      </span>
                      <img src={product.imageUrl} alt="" className="size-16 shrink-0 rounded-xl bg-canvas object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{product.name}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {store?.name ?? product.storeId}
                          {product.mock && (
                            <span className="ms-2 rounded-full bg-notice px-2 py-0.5 text-[11px] font-medium text-notice-ink">
                              {t('design.item.mock')}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs">
                          {product.mock ? (
                            <span className="text-ink-muted">{t('design.item.noLink')}</span>
                          ) : (
                            <a
                              href={product.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-accent-strong underline-offset-2 hover:underline"
                            >
                              {t('design.item.open')}
                            </a>
                          )}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">{formatPrice(product.price, product.currency)}</p>
                    </li>
                  );
                })}
              </ol>
              <div className="flex items-baseline justify-between gap-3 border-t border-line px-5 py-4">
                <span className="font-semibold">{t('design.total')}</span>
                <div className="text-end">
                  <p className="text-xl font-bold">{formatPrice(design.totalPrice)}</p>
                  <p className="text-xs text-ink-muted">
                    {design.budget === null
                      ? t('design.noBudget')
                      : t('design.remaining', { amount: formatPrice(design.budget - design.totalPrice) })}
                  </p>
                </div>
              </div>
            </div>
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
    </section>
  );
}
