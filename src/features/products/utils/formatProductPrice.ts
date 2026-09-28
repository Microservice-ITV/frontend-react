/** Default storefront currency (Myanmar Kyat). */
export const STORE_CURRENCY = 'MMK'

/**
 * Format a product price for display (MMK by default — no $).
 */
export function formatProductPrice(
  amount: number,
  currency: string = STORE_CURRENCY,
): string {
  const code = (currency || STORE_CURRENCY).toUpperCase()
  const n = Number(amount) || 0
  const fractionDigits = code === 'MMK' ? 0 : 2

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'code',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(n)
  } catch {
    return `${code} ${n.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`
  }
}

export const formatKsPrice = (amount: number, currency?: string) =>
  formatProductPrice(amount, currency).replace('MMK', 'Ks')
