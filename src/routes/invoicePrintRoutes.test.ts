import { describe, expect, it } from 'vitest'
import { isInvoicePrintRoute } from './invoicePrintRoutes'

describe('isInvoicePrintRoute', () => {
  it.each([
    '/account/invoices/INV-20261008-000039/print',
    '/account/invoices/INV-20261008-000039/receipt/print',
  ])('recognizes print-only route %s', (pathname) => {
    expect(isInvoicePrintRoute(pathname)).toBe(true)
  })

  it('does not classify invoice details as a print-only route', () => {
    expect(isInvoicePrintRoute('/account/invoices/INV-20261008-000039')).toBe(false)
  })
})
