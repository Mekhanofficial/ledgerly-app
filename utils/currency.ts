const DEFAULT_LOCALE = 'en-US';

export const resolveCurrencyCode = (user?: {
  business?: { currency?: string };
  currencyCode?: string;
  currency?: string;
}): string => {
  const code = user?.business?.currency || user?.currencyCode || user?.currency || 'USD';
  return String(code || 'USD').toUpperCase();
};

export const formatCurrency = (
  value: number | string,
  currency: string = 'USD',
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeCurrency = String(currency || 'USD').toUpperCase();
  const {
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(safeAmount);
  } catch (error) {
    return `${safeCurrency} ${safeAmount.toFixed(minimumFractionDigits)}`;
  }
};

export const getCurrencySymbol = (currency: string = 'USD', locale: string = DEFAULT_LOCALE): string => {
  const safeCurrency = String(currency || 'USD').toUpperCase();
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: safeCurrency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
    const symbol = formatted.replace(/[\d\s.,]/g, '').trim();
    return symbol || safeCurrency;
  } catch (error) {
    return safeCurrency;
  }
};
