
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
