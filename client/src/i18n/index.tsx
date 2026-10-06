import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { he, type MessageKey, type Messages } from './he';

export type { MessageKey } from './he';

interface LocaleDefinition {
  code: string;
  dir: 'rtl' | 'ltr';
  /** BCP 47 tag for Intl formatting. */
  intl: string;
  messages: Messages;
}

const LOCALES = {
  he: { code: 'he', dir: 'rtl', intl: 'he-IL', messages: he },
} satisfies Record<string, LocaleDefinition>;

export type LocaleCode = keyof typeof LOCALES;

type Params = Record<string, string | number>;

interface I18nContextValue {
  locale: LocaleDefinition;
  t: (key: MessageKey, params?: Params) => string;
  formatPrice: (amount: number, currency?: string) => string;
  /** "לפני 2 שעות" style text for an ISO timestamp. */
  formatRelativeTime: (iso: string) => string;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale: code = 'he',
  children,
}: {
  locale?: LocaleCode;
  children: ReactNode;
}) {
  const locale = LOCALES[code];

  useEffect(() => {
    document.documentElement.lang = locale.code;
    document.documentElement.dir = locale.dir;
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, params?: Params) => {
      const template = locale.messages[key];
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in params ? String(params[name]) : match,
      );
    },
    [locale],
  );

  const formatPrice = useCallback(
    (amount: number, currency = 'ILS') =>
      new Intl.NumberFormat(locale.intl, {
        style: 'currency',
        currency,
        // Whole shekels without decimals; real prices with agorot keep them.
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      }).format(amount),
    [locale],
  );

  const formatRelativeTime = useCallback(
    (iso: string) => {
      const format = new Intl.RelativeTimeFormat(locale.intl, { numeric: 'auto' });
      const diff = new Date(iso).getTime() - Date.now();
      for (const [unit, ms] of RELATIVE_UNITS) {
        if (Math.abs(diff) >= ms) return format.format(Math.round(diff / ms), unit);
      }
      return format.format(0, 'minute');
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, t, formatPrice, formatRelativeTime }),
    [locale, t, formatPrice, formatRelativeTime],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside <I18nProvider>');
  }
  return context;
}
