// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { InvoiceDocument, ReceiptDocument } from '@/lib/api/invoiceClient'
import ScopedInvoiceDetailPage from './ScopedInvoiceDetailPage'

const { getInvoiceMock, getReceiptMock, downloadMock, thermalDownloadMock, receiptDownloadMock } = vi.hoisted(() => ({
  getInvoiceMock: vi.fn(),
  getReceiptMock: vi.fn(),
  downloadMock: vi.fn(),
  thermalDownloadMock: vi.fn(),
  receiptDownloadMock: vi.fn(),
}))

vi.mock('@/lib/api/invoiceClient', () => ({
  getInvoiceByNumber: getInvoiceMock,
  getReceiptForInvoice: getReceiptMock,
  downloadInvoicePdf: downloadMock,
  downloadThermalInvoicePdf: thermalDownloadMock,
  downloadReceiptPdf: receiptDownloadMock,
}))
vi.mock('@/app/hooks', () => ({ useAppSelector: () => true }))
vi.mock('@/components/routing/PageTitle', () => ({ usePageTitle: () => undefined }))

const invoice = (status: 'PAID' | 'UNPAID' = 'PAID'): InvoiceDocument => ({
  id: 'invoice-1', invoiceNumber: 'INV-1', orderId: 'order-1', orderReference: 'ORD-1',
  shopId: 'shop-1', shopName: 'Shop', shopContactName: null, shopContactEmail: null,
  shopContactPhone: null, shopAddress: null, customerId: 'customer-1', customerPhone: null, customerEmail: 'customer@example.test',
  billingAddress: null,
  shippingAddress: { address_line_1: 'Sample Street', city: 'Yangon', country: 'Myanmar' },
  lineItems: [{ name: 'Pet Supplies sample', quantity: 1, unitPrice: '190000', total: '190000' }], subtotal: '100', deliveryFee: '0',
  taxAmount: '0', discountAmount: '0', grandTotal: '100', currency: 'MMK', paymentMethod: 'CASH',
  paymentGatewayRef: null, paymentSlipUrl: null, status, pdfUrl: null, verifiedBy: null,
  verifiedAt: null, rejectionReason: null, verificationNote: null, refundAmount: null,
  refundMethod: null, refundReason: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
})

const receipt: ReceiptDocument = {
  id: 'receipt-1', receiptNumber: 'RCP-1', invoiceId: 'invoice-1', invoiceNumber: 'INV-1',
  orderId: 'order-1', orderReference: 'ORD-1', shopId: 'shop-1', shopName: 'Shop',
  customerId: 'customer-1', customerName: 'Customer', customerEmail: 'customer@example.test', currency: 'MMK',
  subtotal: '100', deliveryFee: '0', taxAmount: '0', discountAmount: '0', grandTotal: '100',
  paymentMethod: 'COD', paymentGatewayRef: null, status: 'ISSUED', issuedAt: '2026-01-01T00:00:00Z',
} as ReceiptDocument

const renderPage = (status: 'PAID' | 'UNPAID' = 'PAID') => {
  getInvoiceMock.mockResolvedValue(invoice(status))
  return render(<MemoryRouter initialEntries={['/invoices/INV-1']}><Routes>
    <Route path="/invoices/:invoiceNumber" element={<ScopedInvoiceDetailPage backTo="/invoices" backLabel="Invoices" />} />
  </Routes></MemoryRouter>)
}

describe('ScopedInvoiceDetailPage thermal receipt preview', () => {
  beforeEach(() => { getInvoiceMock.mockReset(); getReceiptMock.mockReset(); downloadMock.mockReset(); thermalDownloadMock.mockReset(); receiptDownloadMock.mockReset() })
  afterEach(() => cleanup())

  it.each(['58mm', '80mm'] as const)('renders a real receipt inline at %s', async (width) => {
    getReceiptMock.mockResolvedValue(receipt)
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    expect(document.querySelector('.invoice-document')).toBeInTheDocument()
    expect(document.querySelector('.thermal-receipt')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Print Receipt$/i }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Thermal ${width}`) }))
    expect(await screen.findByText('Thermal Receipt Preview')).toBeInTheDocument()
    expect(document.querySelector('.invoice-document')).not.toBeInTheDocument()
    expect(document.querySelector('[data-receipt-root="screen"]')).toBeInTheDocument()
    expect(screen.getByText('DNI-REC-RCP-1')).toBeInTheDocument()
    expect(screen.queryByText('Sample Street, Yangon, Myanmar')).not.toBeInTheDocument()
    const receiptPolicy = document.querySelector('[data-receipt-root="screen"] .receipt-policy-note')
    expect(receiptPolicy).toBeInTheDocument()
    expect(receiptPolicy).toHaveTextContent('Please keep this receipt for your records.')
    expect(screen.queryByText('Customers may inspect the package before making payment, subject to the delivery provider’s inspection policy.')).not.toBeInTheDocument()
    expect(document.querySelector('[data-receipt-root="screen"]')).not.toHaveTextContent('Payment Details')
    expect(document.querySelector('[data-receipt-root="screen"]')).not.toHaveTextContent('customer@example.test')
    expect(document.querySelector('[data-receipt-root="screen"]')).not.toHaveTextContent('Reference:')
    expect(document.querySelector('[data-receipt-root="screen"]')).not.toHaveTextContent('Status:')
    expect(document.querySelector('[data-receipt-root="screen"] style')?.textContent).toContain('break-after: avoid-page')
    expect(receiptPolicy?.previousElementSibling).toHaveClass('receipt-footer-main')
    expect(document.querySelector('[data-receipt-root="screen"] .receipt-qr-container')).toHaveClass('receipt-qr-footer')
    expect(document.querySelector('[data-receipt-root="screen"] .receipt-qr-container')?.firstElementChild).toHaveClass('receipt-qr-image')
    expect(screen.getByText(`(${width})`)).toBeInTheDocument()
    expect(document.querySelector('[data-receipt-root="screen"]')).toHaveStyle({ width: width === '58mm' ? '52mm' : '70mm' })
    expect(document.querySelector('[data-receipt-root="screen"] .receipt-item-block')).toHaveTextContent('Pet Supplies sample')
    const receiptItems = document.querySelector('[data-receipt-root="screen"]')
    expect(receiptItems?.querySelector('.receipt-item-heading')).toHaveTextContent('ItemQtyAmount')
    expect(receiptItems?.querySelector('.receipt-item-row:not(.receipt-item-heading)')).toHaveTextContent('Pet Supplies sample')
    expect(receiptItems?.querySelector('.receipt-item-row:not(.receipt-item-heading) .receipt-item-qty')).toHaveTextContent('1')
    expect(receiptItems?.querySelector('.receipt-item-row:not(.receipt-item-heading) .receipt-item-price')).toHaveTextContent('MMK 190,000')
    expect(receiptItems?.querySelectorAll('.receipt-item-row')).toHaveLength(2)
    expect(receiptItems?.querySelector('.receipt-item-block')?.children).toHaveLength(1)
    expect(getReceiptMock).toHaveBeenCalledWith('invoice-1')

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`print receipt \\(${width}\\)`, 'i') }))
    expect(printSpy).toHaveBeenCalledOnce()
    expect(document.body).toHaveClass('thermal-printing')
    expect(document.querySelector('.invoice-document')).not.toBeInTheDocument()
    expect(document.querySelector('[data-receipt-root="screen"]')).toBeInTheDocument()
    window.dispatchEvent(new Event('afterprint'))
    expect(document.body).not.toHaveClass('thermal-printing')
    fireEvent.click(screen.getByRole('button', { name: /^A4 Invoice$/i }))
    expect(document.querySelector('.invoice-document')).toBeInTheDocument()
    expect(document.querySelector('.thermal-receipt')).not.toBeInTheDocument()
    expect(printSpy).toHaveBeenCalledTimes(2)
    printSpy.mockRestore()
  })

  it('centers the invoice showcase within the 960px dashboard workspace', async () => {
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })

    const pageSection = document.querySelector('section.min-h-full')
    const showcaseWrapper = document.querySelector('.invoice-document')?.parentElement
    expect(pageSection).toHaveClass('w-full', 'min-w-0')
    expect(pageSection).not.toHaveClass('p-4', 'md:p-6', 'max-w-5xl', 'mx-auto')
    expect(showcaseWrapper).toHaveClass('mx-auto', 'w-full', 'min-w-0', 'max-w-[960px]')
  })

  it('shows receipt loading and errors in the selected receipt view', async () => {
    let resolveReceipt!: (value: ReceiptDocument) => void
    getReceiptMock.mockReturnValue(new Promise((resolve) => { resolveReceipt = resolve }))
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Receipt$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    expect(await screen.findByText(/loading receipt data/i)).toBeInTheDocument()
    resolveReceipt(receipt)
    expect(await screen.findByText('DNI-REC-RCP-1')).toBeInTheDocument()
    expect(document.querySelector('.invoice-document')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close preview/i }))
    getReceiptMock.mockRejectedValueOnce(new Error('Forbidden'))
    fireEvent.click(screen.getByRole('button', { name: /^Print Receipt$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 80mm/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Error loading receipt: Forbidden')
    expect(screen.getByRole('button', { name: /^Print Invoice$/i })).toBeInTheDocument()
    const a4PrintSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: /^A4 Invoice$/i }))
    expect(document.querySelector('.invoice-document')).toBeInTheDocument()
    expect(document.querySelector('.thermal-receipt')).not.toBeInTheDocument()
    expect(a4PrintSpy).toHaveBeenCalledOnce()
    a4PrintSpy.mockRestore()
  })

  it('starts receipt PDF download while the inline receipt preview is still loading', async () => {
    getReceiptMock.mockReturnValue(new Promise(() => undefined))
    receiptDownloadMock.mockResolvedValue(new Blob(['thermal receipt']))
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:receipt'), revokeObjectURL: vi.fn() }))
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Receipt$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    await screen.findByText(/loading receipt data/i)

    const downloadButton = screen.getByRole('button', { name: /Download PDF.*Receipt.*58mm/i })
    expect(downloadButton).toBeEnabled()
    fireEvent.click(downloadButton)
    await vi.waitFor(() => expect(receiptDownloadMock).toHaveBeenCalledWith('invoice-1', { width: '58mm' }))
    expect(anchorClick).toHaveBeenCalledOnce()
    anchorClick.mockRestore()
    vi.unstubAllGlobals()
  })

  it('only offers receipt preview for paid invoices', async () => {
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    expect(screen.queryByRole('button', { name: /^Print Receipt$/i })).not.toBeInTheDocument()
    expect(getReceiptMock).not.toHaveBeenCalled()
    expect(receiptDownloadMock).not.toHaveBeenCalled()
  })

  it.each(['58mm', '80mm'] as const)('shows the A4 design initially and prints a compact thermal invoice inline at %s', async (width) => {
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    expect(screen.queryByText('Thermal Invoice Preview')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`thermal ${width}`, 'i') }))
    expect(await screen.findByText('Thermal Invoice Preview')).toBeInTheDocument()
    expect(document.querySelector('.invoice-document')).not.toBeInTheDocument()
    expect(document.querySelector('[data-invoice-thermal-root="screen"]')).toBeInTheDocument()
    expect(screen.getAllByText('Sample Street, Yangon, Myanmar')).toHaveLength(1)
    const receipt = document.querySelector('[data-invoice-thermal-root="screen"]')
    expect(receipt).toHaveStyle({ width: width === '58mm' ? '52mm' : '70mm' })
    expect(receipt).not.toHaveTextContent('Payment Details')
    expect(receipt).not.toHaveTextContent('customer@example.test')
    expect(receipt).not.toHaveTextContent('Reference:')
    expect(receipt).not.toHaveTextContent('Status:')
    expect(receipt?.querySelector('.receipt-item-block')).toHaveTextContent('Pet Supplies sample')
    expect(receipt?.querySelector('.receipt-item-heading')).toHaveTextContent('ItemQtyAmount')
    expect(receipt?.querySelector('.receipt-item-row:not(.receipt-item-heading) .receipt-item-qty')).toHaveTextContent('1')
    expect(receipt?.querySelector('.receipt-item-row:not(.receipt-item-heading) .receipt-item-price')).toHaveTextContent('MMK 190,000')
    expect(receipt?.querySelectorAll('.receipt-item-row')).toHaveLength(2)
    expect(receipt?.querySelector('.receipt-item-block')?.children).toHaveLength(1)
    expect(receipt?.querySelector('.receipt-qr-image')).toHaveStyle({ width: width === '58mm' ? '12mm' : '15mm' })
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`print invoice \\(${width}\\)`, 'i') }))
    await vi.waitFor(() => expect(printSpy).toHaveBeenCalledOnce())
    expect(document.body).toHaveClass('thermal-printing')
    expect(document.body).toHaveClass('thermal-invoice-printing')
    expect(document.querySelector('[data-invoice-thermal-root="print"]')).toBeInTheDocument()
    window.dispatchEvent(new Event('afterprint'))
    expect(document.body).not.toHaveClass('thermal-printing')
    fireEvent.click(screen.getByRole('button', { name: /^A4 Invoice$/i }))
    expect(document.querySelector('.invoice-document')).toBeInTheDocument()
    expect(document.querySelector('.thermal-receipt')).not.toBeInTheDocument()
    expect(printSpy).toHaveBeenCalledTimes(2)
    printSpy.mockRestore()
  })

  it('prints only the selected A4 invoice when A4 is active', async () => {
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: /^Print A4 Invoice$/i }))
    expect(printSpy).toHaveBeenCalledOnce()
    expect(document.querySelector('.invoice-document')).toBeInTheDocument()
    expect(document.querySelector('.thermal-receipt')).not.toBeInTheDocument()
    expect(document.body).not.toHaveClass('thermal-printing')
    printSpy.mockRestore()
  })

  it('downloads thermal invoice PDFs with the selected width and prevents duplicate clicks', async () => {
    let resolvePdf!: (blob: Blob) => void
    thermalDownloadMock.mockReturnValue(new Promise((resolve) => { resolvePdf = resolve }))
    const createUrl = vi.fn(() => 'blob:thermal')
    const revokeUrl = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl }))
    const clickedFilename = vi.fn()
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { clickedFilename(this.download) })
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 80mm/i }))
    fireEvent.click(screen.getByRole('button', { name: /download pdf · invoice · 80mm/i }))
    expect(await screen.findByRole('button', { name: /downloading/i })).toBeDisabled()
    expect(thermalDownloadMock).toHaveBeenCalledWith('invoice-1', '80mm')
    resolvePdf(new Blob(['pdf']))
    await vi.waitFor(() => expect(createUrl).toHaveBeenCalledOnce())
    expect(anchorClick).toHaveBeenCalledOnce()
    expect(clickedFilename).toHaveBeenCalledWith('INV-1-thermal-80mm.pdf')
    createUrl.mockRestore()
    revokeUrl.mockRestore()
    anchorClick.mockRestore()
    vi.unstubAllGlobals()
  })

  it('downloads paid receipt PDFs at the selected width', async () => {
    getReceiptMock.mockResolvedValue(receipt)
    receiptDownloadMock.mockResolvedValue(new Blob(['receipt pdf']))
    const createUrl = vi.fn(() => 'blob:receipt')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() }))
    const clickedFilename = vi.fn()
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { clickedFilename(this.download) })
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Receipt$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    await screen.findByText('DNI-REC-RCP-1')
    fireEvent.click(screen.getByRole('button', { name: /download pdf · receipt · 58mm/i }))
    await vi.waitFor(() => expect(receiptDownloadMock).toHaveBeenCalledWith('invoice-1', { width: '58mm' }))
    expect(clickedFilename).toHaveBeenCalledWith('INV-1-receipt-58mm.pdf')
    anchorClick.mockRestore()
    vi.unstubAllGlobals()
  })

  it('keeps the A4 download on the existing invoice PDF API', async () => {
    downloadMock.mockResolvedValue(new Blob(['a4 pdf']))
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:a4'), revokeObjectURL: vi.fn() }))
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Download PDF$/i }))
    await vi.waitFor(() => expect(downloadMock).toHaveBeenCalledWith('invoice-1'))
    expect(anchorClick).toHaveBeenCalledOnce()
    anchorClick.mockRestore()
    vi.unstubAllGlobals()
  })

  it.each([
    ['invoice', '58mm'], ['invoice', '80mm'], ['receipt', '58mm'], ['receipt', '80mm'],
  ] as const)('requests the %s thermal PDF at %s', async (kind, width) => {
    if (kind === 'receipt') {
      getReceiptMock.mockResolvedValue(receipt)
      receiptDownloadMock.mockResolvedValue(new Blob(['thermal pdf']))
    } else {
      thermalDownloadMock.mockResolvedValue(new Blob(['thermal pdf']))
    }
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:thermal'), revokeObjectURL: vi.fn() }))
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: kind === 'receipt' ? /^Print Receipt$/i : /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`thermal ${width}`, 'i') }))
    await screen.findByText(kind === 'receipt' ? 'DNI-REC-RCP-1' : 'Thermal Invoice Preview')
    fireEvent.click(screen.getByRole('button', { name: /download pdf/i }))
    if (kind === 'receipt') {
      await vi.waitFor(() => expect(receiptDownloadMock).toHaveBeenCalledWith('invoice-1', { width }))
    } else {
      await vi.waitFor(() => expect(thermalDownloadMock).toHaveBeenCalledWith('invoice-1', width))
    }
    expect(anchorClick).toHaveBeenCalledOnce()
    anchorClick.mockRestore()
    vi.unstubAllGlobals()
  })

  it.each([
    ['invoice', '58mm'], ['invoice', '80mm'], ['receipt', '58mm'], ['receipt', '80mm'],
  ] as const)('A4 Invoice selection from %s %s prints only A4', async (kind, width) => {
    if (kind === 'receipt') getReceiptMock.mockResolvedValue(receipt)
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: kind === 'receipt' ? /^Print Receipt$/i : /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`thermal ${width}`, 'i') }))
    await screen.findByText(kind === 'receipt' ? 'DNI-REC-RCP-1' : 'Thermal Invoice Preview')

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: /^A4 Invoice$/i }))
    await vi.waitFor(() => expect(printSpy).toHaveBeenCalledOnce())
    expect(document.querySelector('.invoice-document')).toBeInTheDocument()
    expect(document.querySelector('.thermal-receipt')).not.toBeInTheDocument()
    expect(document.body).not.toHaveClass('thermal-printing')
    printSpy.mockRestore()
  })
})
