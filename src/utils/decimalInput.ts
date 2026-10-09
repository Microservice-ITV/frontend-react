/**
 * Sanitize typed/pasted input to an unsigned decimal string (digits + one `.`).
 * Truncates fractional part to `maxDecimals`. Aligns with product-service using parseFloat.
 */
export function sanitizeUnsignedDecimalInput(raw: string, maxDecimals: number): string {
  const cleaned = raw.replace(/\s/g, '').replace(/[^\d.]/g, '')
  if (cleaned === '') return ''
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) return cleaned
  const intPart = cleaned.slice(0, firstDot)
  const fracPart = cleaned.slice(firstDot + 1).replace(/\./g, '')
  const frac = maxDecimals >= 0 ? fracPart.slice(0, maxDecimals) : fracPart
  return intPart + '.' + frac
}

/** Seller price fields: up to 9999999, with at most 2 decimal places. */
const MAX_MONEY = 9_999_999
const MAX_MONEY_DIGITS = 7

export function sanitizeMoneyInput(raw: string): string {
  let s = sanitizeUnsignedDecimalInput(raw, 2)
  if (s.startsWith('.')) s = `0${s}`
  const dot = s.indexOf('.')
  const intPart = dot === -1 ? s : s.slice(0, dot)
  const frac = dot === -1 ? '' : s.slice(dot)
  s = intPart.slice(0, MAX_MONEY_DIGITS) + frac
  const amount = Number(s)
  if (s !== '' && Number.isFinite(amount) && amount > MAX_MONEY) {
    return String(MAX_MONEY)
  }
  return s
}

/**
 * Markup / discount % — backend uses parseFloat (decimals like 0.5 are valid).
 * 4 fractional digits matches typical percent precision.
 */
export function sanitizePercentInput(raw: string): string {
  let s = sanitizeUnsignedDecimalInput(raw, 4)
  if (s.startsWith('.')) s = `0${s}`
  return s
}

/** Stock: whole units only. */
export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/\s/g, '').replace(/\D/g, '')
}