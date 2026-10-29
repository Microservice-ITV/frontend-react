export const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatMoney = (
  value?: string | number | null,
  currency?: string | null,
): string => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currency ? `${formatted} ${currency}` : formatted
}

export const formatRange = (
  min?: string | number | null,
  max?: string | number | null,
  currency?: string | null,
): string => {
  const hasMin = min !== null && min !== undefined && min !== ''
  const hasMax = max !== null && max !== undefined && max !== ''
  if (!hasMin && !hasMax) return '—'
  if (hasMin && hasMax) {
    return `${formatMoney(min, null)} – ${formatMoney(max, currency)}`
  }
  return formatMoney(hasMin ? min : max, currency)
}
