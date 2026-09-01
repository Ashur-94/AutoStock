/**
 * Currency and Price Utility
 * Enforces USD ($) with 2 decimal places (cents) across the application.
 */

export const formatPrice = (amount: number | string | undefined | null): string => {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num) || num === null || num === undefined) {
    return '$0.00';
  }
  return `$${num.toFixed(2)}`;
};

export const formatPriceNumber = (amount: number | string | undefined | null): string => {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num) || num === null || num === undefined) {
    return '0.00';
  }
  return num.toFixed(2);
};
