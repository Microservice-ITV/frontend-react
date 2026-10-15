/** Keep digits only, capped at 10 (cash income validation). */
export function normalizeCashDigits(value: string, maxDigits = 10): string {
  return value.replace(/[^\d]/g, '').slice(0, maxDigits)
}

/** Parse a cash amount from an input string (digits, commas, or "Ks" prefix). */
export function parseCashAmount(value: string): number {
  const digits = normalizeCashDigits(value)
  if (!digits) return 0
  const amount = Number(digits)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

/** Display income like refund: "Ks 60,000". */
export function formatCashIncomeDisplay(digitsOrAmount: string | number): string {
  const amount =
    typeof digitsOrAmount === 'number'
      ? digitsOrAmount
      : parseCashAmount(digitsOrAmount)
  if (!amount) return ''
  return `Ks ${Math.round(amount).toLocaleString('en-US')}`
}

/** Change to return when the customer pays more than the order total. */
export function calculateCashRefund(income: number, orderTotal: number): number {
  const paid = Math.max(0, Number(income) || 0)
  const due = Math.max(0, Number(orderTotal) || 0)
  return Math.max(0, Math.round((paid - due) * 100) / 100)
}
