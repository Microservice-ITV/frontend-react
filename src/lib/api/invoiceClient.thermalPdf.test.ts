import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadReceiptPdf, downloadThermalInvoicePdf, invoiceClient, pollThermalPdf } from './invoiceClient'

describe('thermal PDF API paths', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each(['58mm', '80mm'] as const)('requests the thermal invoice route at %s', async (width) => {
    const get = vi.spyOn(invoiceClient, 'get').mockResolvedValue({ data: new Blob(['pdf']) } as never)
    await expect(downloadThermalInvoicePdf('invoice-123', width)).resolves.toMatchObject({ state: 'ready' })
    expect(get).toHaveBeenCalledWith('/invoices/invoice-123/thermal-pdf', {
      params: { width }, responseType: 'blob',
    })
    const requestUrl = new URL(invoiceClient.getUri({ url: '/invoices/invoice-123/thermal-pdf', params: { width } }))
    expect(requestUrl.pathname).toBe('/api/v1/invoices/invoice-123/thermal-pdf')
    expect(requestUrl.searchParams.get('width')).toBe(width)
  })

  it('parses the Invoice Service 202 processing response from its JSON Blob', async () => {
    const body = new Blob(['{"success":false,"status":"PROCESSING","message":"Thermal PDF is processing","attempts":1,"error":null,"retryAt":null}'], { type: 'application/json' })
    Object.assign(body, { text: async () => '{"success":false,"status":"PROCESSING","message":"Thermal PDF is processing","attempts":1,"error":null,"retryAt":null}' })
    vi.spyOn(invoiceClient, 'get').mockResolvedValue({
      status: 202,
      data: body,
    } as never)
    await expect(downloadThermalInvoicePdf('invoice-123', '58mm')).resolves.toEqual({
      state: 'processing', status: 'PROCESSING', attempts: 1, error: null, retryAt: null,
    })
  })

  it('polls pending artifacts with bounded backoff until ready', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ state: 'processing', status: 'PENDING', attempts: 0, error: null, retryAt: null })
      .mockResolvedValueOnce({ state: 'ready', pdf: new Blob(['ready']) })
    const wait = vi.fn(async () => undefined)
    const result = await pollThermalPdf(request, { delaysMs: [10, 20], wait })
    expect(request).toHaveBeenCalledTimes(2)
    expect(wait).toHaveBeenCalledWith(10)
    expect(result).toBeInstanceOf(Blob)
    expect(result?.size).toBe(5)
  })

  it('stops polling after the configured attempts and reports a failed artifact', async () => {
    const request = vi.fn().mockResolvedValue({ state: 'failed', status: 'FAILED', attempts: 2, error: 'storage unavailable', retryAt: null })
    await expect(pollThermalPdf(request, { delaysMs: [5, 10], wait: async () => undefined }))
      .rejects.toThrow('Thermal PDF generation failed: storage unavailable')
    expect(request).toHaveBeenCalledTimes(3)
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
