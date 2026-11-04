import { describe, expect, it } from 'vitest'
import { resolvePostLoginPath } from './navigation'

describe('finance manager navigation', () => {
  it('allows the dedicated AR/AP page within the existing finance route scope', () => {
    expect(resolvePostLoginPath('FINANCE_MANAGER', '/seller/accounting/receivables-payables')).toBe('/seller/accounting/receivables-payables')
  })

  it('allows the dedicated Inventory Valuation page within the finance route scope', () => {
    expect(resolvePostLoginPath('FINANCE_MANAGER', '/seller/accounting/inventory-valuation')).toBe('/seller/accounting/inventory-valuation')
  })

  it('continues redirecting finance managers away from unrelated seller routes', () => {
    expect(resolvePostLoginPath('FINANCE_MANAGER', '/seller/orders')).toBe('/seller/finance')
  })
})
