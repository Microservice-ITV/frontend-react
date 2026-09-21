/**
 * Mirrors product-service `src/utils/variant-pricing.ts`:
 * listPrice = base × (1 + profitThresholdPercent/100)
 * effective = list × (1 − discountPercent/100)
 * 
 * Reverse: profitThresholdPercent = (listPrice / basePrice - 1) × 100
 */
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function computeProfitThresholdPercent(
  basePrice: number,
  listPrice: number,
): number {
  if (basePrice <= 0) return 0
  const markup = (listPrice / basePrice - 1) * 100
  return Math.max(0, markup)
}

export function computeEffectiveSellingPrice(
  listPrice: number,
  discountPercent: number,
): number {
  const factor = 1 - discountPercent / 100
  return roundMoney(listPrice * factor)
}

export function parseOptionalPercent(value: string): number {
  if (value === '' || value === undefined) return 0
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}