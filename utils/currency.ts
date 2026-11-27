
import { CURRENCY_RATES_FROM_USD } from '../constants';

export function convertFromUSD(amountUSD: number, targetCurrency: string): number {
  const rate = CURRENCY_RATES_FROM_USD[targetCurrency];
  if (!rate) {
    // Fallback to USD if currency is not supported
    return parseFloat(amountUSD.toFixed(2));
  }
  const convertedAmount = amountUSD * rate;
  return parseFloat(convertedAmount.toFixed(2));
}

export function formatPrice(amountUSD: number, targetCurrency = 'AED'): string {
  const code = (targetCurrency || 'AED').toUpperCase();
  const converted = convertFromUSD(amountUSD, code);
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
    AED: 'AED ',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF ',
  };
  const prefix = symbolMap[code] || `${code} `;
  const formatted = code === 'JPY' ? Math.round(converted).toLocaleString() : converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${prefix}${formatted}`;
}

