export const formatProfitLossValue = (value: number | null) =>
  value === null
    ? 'Not available'
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
