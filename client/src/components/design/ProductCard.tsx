import type { ReactNode } from 'react';
import type { DesignEntry } from '../../features/design/designEntries';
import { useI18n } from '../../i18n';
import { buttonClasses } from '../buttonStyles';

interface ProductCardProps {
  entry: DesignEntry;
  /** Header controls (close, prev/next) supplied by the container. */
  controls?: ReactNode;
}

/**
 * Everything known about one product. Missing data is shown as "אין מידע" —
 * never hidden silently and never filled in.
 */
export function ProductCard({ entry, controls }: ProductCardProps) {
  const { t, formatPrice, formatRelativeTime } = useI18n();
  const { product, store, item } = entry;
  const noInfo = <span className="text-ink-muted">{t('card.noInfo')}</span>;

  const sourceKey = `card.source.${product.providerId}` as const;
  const rows: { label: string; value: ReactNode }[] = [
    { label: t('card.store'), value: store?.name ?? noInfo },
    { label: t('card.availability'), value: t(`card.availability.${product.availability}`) },
    {
      label: t('card.shipping'),
      value:
        product.shippingAvailable === undefined
          ? noInfo
          : t(product.shippingAvailable ? 'card.shipping.yes' : 'card.shipping.no'),
    },
    { label: t('card.location'), value: product.city ?? store?.city ?? noInfo },
    {
      label: t('card.rating'),
      value: product.rating !== undefined ? t('card.ratingValue', { rating: product.rating }) : noInfo,
    },
    { label: t('card.source'), value: isKnownSource(sourceKey) ? t(sourceKey) : product.providerId },
  ];

  return (
    <article className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
          {entry.number}
        </span>
        <h2 className="flex-1 text-base leading-snug font-semibold">{product.name}</h2>
        {controls}
      </div>

      <div className="flex gap-4">
        <img src={product.imageUrl} alt="" className="size-24 shrink-0 rounded-2xl bg-canvas object-cover" />
        <div className="min-w-0">
          <p className="text-2xl font-bold">
            {product.priceIsFrom && <span className="text-sm font-medium text-ink-muted">{t('card.priceFrom')}</span>}
            {formatPrice(product.price, product.currency)}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {t('card.updated', { time: formatRelativeTime(product.lastUpdated) })}
          </p>
          {product.mock && (
            <span className="mt-2 inline-block rounded-full bg-notice px-2 py-0.5 text-[11px] font-medium text-notice-ink">
              {t('design.item.mock')}
            </span>
          )}
        </div>
      </div>

      <dl className="divide-y divide-line rounded-2xl border border-line text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 px-3 py-2">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="text-end font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      {item.alternatives.length > 0 && (
        <p className="text-xs text-ink-muted">{t('card.alternatives', { count: item.alternatives.length })}</p>
      )}

      {product.mock ? (
        <p className="rounded-2xl bg-notice px-3 py-2 text-xs text-notice-ink">{t('card.mockNotice')}</p>
      ) : (
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses('primary')}
        >
          {store ? t('design.item.openAt', { store: store.name }) : t('design.item.open')}
        </a>
      )}
    </article>
  );
}

const KNOWN_SOURCES = ['card.source.shopify', 'card.source.serpapi', 'card.source.mock'] as const;
function isKnownSource(key: string): key is (typeof KNOWN_SOURCES)[number] {
  return (KNOWN_SOURCES as readonly string[]).includes(key);
}
