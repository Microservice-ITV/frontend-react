import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadReceiptPdf, downloadThermalInvoicePdf, invoiceClient } from './invoiceClient'

describe('thermal PDF API paths', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each(['58mm', '80mm'] as const)('requests the thermal invoice route at %s', async (width) => {
    const get = vi.spyOn(invoiceClient, 'get').mockResolvedValue({ data: new Blob(['pdf']) } as never)
    await downloadThermalInvoicePdf('invoice-123', width)
    expect(get).toHaveBeenCalledWith('/invoices/invoice-123/thermal-pdf', {
      params: { width }, responseType: 'blob',
    })
    const requestUrl = new URL(invoiceClient.getUri({ url: '/invoices/invoice-123/thermal-pdf', params: { width } }))
    expect(requestUrl.pathname).toBe('/api/v1/invoices/invoice-123/thermal-pdf')
    expect(requestUrl.searchParams.get('width')).toBe(width)
  })

  it.each(['58mm', '80mm'] as const)('requests the authorized receipt PDF route at %s', async (width) => {
    const get = vi.spyOn(invoiceClient, 'get').mockResolvedValue({ data: new Blob(['pdf']) } as never)
    await downloadReceiptPdf('invoice-123', { asCustomer: true, width })
    expect(get).toHaveBeenCalledWith('/invoices/invoice-123/receipt/pdf', {
      responseType: 'blob', params: { width }, headers: { 'x-user-role': 'customer' },
    })
    const requestUrl = new URL(invoiceClient.getUri({ url: '/invoices/invoice-123/receipt/pdf', params: { width } }))
    expect(requestUrl.pathname).toBe('/api/v1/invoices/invoice-123/receipt/pdf')
    expect(requestUrl.searchParams.get('width')).toBe(width)
  })
})
