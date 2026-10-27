/**
 * Formats a number to Vietnamese Dong currency string (e.g. 1.250.000 ₫)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numericAmount);
}
