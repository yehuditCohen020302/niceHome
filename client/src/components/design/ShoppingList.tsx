import type { DesignEntry } from '../../features/design/designEntries';
import { groupByStore } from '../../features/design/designEntries';
import { useI18n } from '../../i18n';

interface ShoppingListProps {
  entries: DesignEntry[];
  totalPrice: number;
  budget: number | null;
  activeNumber: number | null;
  onSelect: (number: number) => void;
}

/** "מה צריך לקנות?" — items grouped by store, with the total and what is left of the budget. */
export function ShoppingList({ entries, totalPrice, budget, activeNumber, onSelect }: ShoppingListProps) {
  const { t, formatPrice } = useI18n();
  const groups = groupByStore(entries);
  const overBudget = budget !== null && totalPrice > budget;

  return (
    <section className="rounded-3xl border border-line bg-surface" aria-labelledby="shopping-list-title">
      <header className="flex items-baseline justify-between gap-3 px-5 pt-5">
        <h2 id="shopping-list-title" className="text-lg font-semibold">
          {t('design.items.title')}
        </h2>
        <p className="text-xs text-ink-muted">
          {t('design.itemsCount', { count: entries.length })} ·{' '}
          {groups.length === 1 ? t('design.oneStore') : t('design.byStore', { count: groups.length })}
        </p>
      </header>

      <div className="mt-3 divide-y divide-line">
        {groups.map((group) => (
          <div key={group.storeId} className="py-2">
            <div className="flex items-center justify-between gap-3 px-5 py-1.5">
              <p className="text-xs font-semibold tracking-wide text-ink-muted">
                {group.store?.name ?? t('card.noInfo')}
              </p>
              {group.store?.website && !group.store.mock && (
                <a
                  href={group.store.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-accent-strong underline-offset-2 hover:underline"
                >
                  {t('design.goToStore')}
                </a>
              )}
            </div>
            <ul>
              {group.entries.map((entry) => {
                const isActive = entry.number === activeNumber;
                return (
                  <li key={entry.item.specId}>
                    <button
                      type="button"
                      onClick={() => onSelect(entry.number)}
                      aria-pressed={isActive}
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-start transition hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none ${
                        isActive ? 'bg-accent-soft/60' : ''
                      }`}
                    >
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          isActive ? 'bg-ink text-canvas' : 'bg-accent-soft text-accent-strong'
                        }`}
                      >
                        {entry.number}
                      </span>
                      <img src={entry.product.imageUrl} alt="" className="size-12 shrink-0 rounded-xl bg-canvas object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-medium leading-snug">{entry.product.name}</span>
                        <span className="text-xs text-ink-muted">{t(`category.${entry.product.category}`)}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold">
                        {entry.product.priceIsFrom && <span className="text-xs font-normal text-ink-muted">{t('card.priceFrom')}</span>}
                        {formatPrice(entry.product.price, entry.product.currency)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <footer className="flex items-end justify-between gap-3 border-t border-line px-5 py-4">
        <div>
          <p className="font-semibold">{t('design.total')}</p>
          {budget !== null && <p className="text-xs text-ink-muted">{t('design.budgetOf', { amount: formatPrice(budget) })}</p>}
        </div>
        <div className="text-end">
          <p className="text-2xl font-bold">{formatPrice(totalPrice)}</p>
          <p className={`text-xs font-medium ${overBudget ? 'text-danger-ink' : 'text-ink-muted'}`}>
            {budget === null
              ? t('design.noBudget')
              : overBudget
                ? t('design.over', { amount: formatPrice(totalPrice - budget) })
                : t('design.remaining', { amount: formatPrice(budget - totalPrice) })}
          </p>
        </div>
      </footer>
    </section>
  );
}
