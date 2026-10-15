import { describe, expect, it } from 'vitest'
import {
  calculateCashRefund,
  formatCashIncomeDisplay,
  normalizeCashDigits,
  parseCashAmount,
} from './cashTender'

describe('calculateCashRefund', () => {
  it('refunds the overpayment', () => {
    expect(calculateCashRefund(60000, 55000)).toBe(5000)
  })

  it('returns 0 when the customer pays exactly the total', () => {
    expect(calculateCashRefund(55000, 55000)).toBe(0)
  })

  it('returns 0 when the customer underpays', () => {
    expect(calculateCashRefund(50000, 55000)).toBe(0)
  })
})

describe('parseCashAmount', () => {
  it('parses plain, comma, and Ks-formatted amounts', () => {
    expect(parseCashAmount('60000')).toBe(60000)
    expect(parseCashAmount('60,000')).toBe(60000)
    expect(parseCashAmount('Ks 60,000')).toBe(60000)
  })

  it('returns 0 for empty or invalid input', () => {
    expect(parseCashAmount('')).toBe(0)
    expect(parseCashAmount('abc')).toBe(0)
  })
})

describe('formatCashIncomeDisplay', () => {
  it('formats like refund with Ks and thousands separators', () => {
    expect(formatCashIncomeDisplay('60000')).toBe('Ks 60,000')
    expect(formatCashIncomeDisplay(3000)).toBe('Ks 3,000')
  })

  it('returns empty for blank input', () => {
    expect(formatCashIncomeDisplay('')).toBe('')
  })
})

describe('normalizeCashDigits', () => {
  it('keeps at most 10 digits', () => {
    expect(normalizeCashDigits('Ks 12,345,678,901')).toBe('1234567890')
  })
})
