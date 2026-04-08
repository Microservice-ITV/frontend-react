/**
 * Mirrors product-service `src/utils/variant-pricing.ts`:
 * listPrice = base × (1 + profitThresholdPercent/100)
 * effective = list × (1 − discountPercent/100)
 */
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function computeListPrice(basePrice: number, profitThresholdPercent: number): number {
  return roundMoney(basePrice * (1 + profitThresholdPercent / 100))
}

export function computeEffectiveSellingPrice(
  basePrice: number,
  profitThresholdPercent: number,
  discountPercent: number,
): number {
  const list = basePrice * (1 + profitThresholdPercent / 100)
  const factor = 1 - discountPercent / 100
  return roundMoney(list * factor)
}

export function parseOptionalPercent(value: string): number {
  if (value === '' || value === undefined) return 0
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}