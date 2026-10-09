/**
 * Markup % is display-only: (selling price / base price − 1) × 100.
 * Customer pays = selling price × (1 − discount% / 100).
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

/** Restores the seller's selling price. Markup % is not applied. */
export function sellingPriceFromStoredSale(
  effectivePrice: number | undefined,
  discountPercent: number,
): number | undefined {
  if (effectivePrice === undefined) return undefined
  if (discountPercent > 0 && discountPercent < 100) {
    return roundMoney(effectivePrice / (1 - discountPercent / 100))
  }
  return effectivePrice
}

export function parseOptionalPercent(value: string): number {
  if (value === '' || value === undefined) return 0
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}