// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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
vi.mock('@/features/invoices/components/ThermalPdfPreview', async () => {
  const React = await import('react')
  return {
    default: ({ kind, width, pdf }: { kind: string; width: string; pdf: Blob | null }) => React.createElement('div', {
      'data-testid': 'thermal-pdf-preview',
      'data-document-kind': kind,
      'data-paper-width': width,
    }, pdf
      ? React.createElement('span', { 'data-testid': 'backend-pdf-loaded' })
      : React.createElement('p', { role: 'status' }, 'Preparing PDF preview…')),
  }
})
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

const renderPage = (status: 'PAID' | 'UNPAID' = 'PAID', invoiceNumber = 'INV-1') => {
  getInvoiceMock.mockResolvedValue({ ...invoice(status), invoiceNumber })
  return render(<MemoryRouter initialEntries={['/invoices/INV-1']}><Routes>
    <Route path="/invoices/:invoiceNumber" element={<ScopedInvoiceDetailPage backTo="/invoices" backLabel="Invoices" />} />
  </Routes></MemoryRouter>)
}

describe('ScopedInvoiceDetailPage thermal receipt preview', () => {
  beforeEach(() => {
    getInvoiceMock.mockReset()
    getReceiptMock.mockReset()
    downloadMock.mockReset()
    thermalDownloadMock.mockReset().mockResolvedValue(new Blob(['thermal pdf']))
    receiptDownloadMock.mockReset().mockResolvedValue(new Blob(['receipt pdf']))
  })
  afterEach(() => cleanup())

  it('does not prefetch every thermal variant and shares the hovered selection request with preview', async () => {
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    expect(thermalDownloadMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    const option = screen.getByRole('button', { name: /thermal 80mm/i })
    fireEvent.mouseEnter(option)
    expect(thermalDownloadMock).toHaveBeenCalledTimes(1)
    expect(thermalDownloadMock).toHaveBeenCalledWith('invoice-1', '80mm')
    fireEvent.click(option)

    await screen.findByTestId('thermal-pdf-preview')
    expect(thermalDownloadMock).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('thermal-pdf-preview')).toHaveAttribute('data-paper-width', '80mm')
  })

  it('shows a loading state instead of the previous PDF when switching paper widths', async () => {
    let resolve80mm!: (blob: Blob) => void
    thermalDownloadMock.mockImplementation((_invoiceId: string, width: string) => width === '58mm'
      ? Promise.resolve(new Blob(['58mm pdf']))
      : new Promise((resolve) => { resolve80mm = resolve }))
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })

    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    await screen.findByTestId('backend-pdf-loaded')
    fireEvent.click(screen.getByRole('button', { name: /close preview/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 80mm/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Preparing PDF preview…')
    expect(screen.queryByTestId('backend-pdf-loaded')).not.toBeInTheDocument()
    resolve80mm(new Blob(['80mm pdf']))
    await screen.findByTestId('backend-pdf-loaded')
    expect(screen.getByTestId('thermal-pdf-preview')).toHaveAttribute('data-paper-width', '80mm')
  })

  it.each(['58mm', '80mm'] as const)('renders the backend receipt PDF preview at %s without the legacy React sheet', async (width) => {
    getReceiptMock.mockResolvedValue(receipt)
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Receipt$/i }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Thermal ${width}`) }))
    expect(await screen.findByTestId('backend-pdf-loaded')).toBeInTheDocument()
    expect(screen.getByTestId('thermal-pdf-preview')).toHaveAttribute('data-paper-width', width)
    expect(screen.getByTestId('thermal-pdf-preview')).toHaveAttribute('data-document-kind', 'receipt')
    expect(document.querySelector('[data-receipt-root]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-invoice-thermal-root]')).not.toBeInTheDocument()
    expect(document.querySelector('.thermal-print-source')).not.toBeInTheDocument()
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
    expect(await screen.findByTestId('thermal-pdf-preview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /print receipt/i })).toBeDisabled()
    resolveReceipt(receipt)
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /print receipt/i })).toBeEnabled())
    expect(document.querySelector('.invoice-document')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close preview/i }))
    getReceiptMock.mockRejectedValueOnce(new Error('Forbidden'))
    fireEvent.click(screen.getByRole('button', { name: /^Print Receipt$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 80mm/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Error loading receipt: Forbidden')
    expect(screen.queryByRole('button', { name: /^Print Invoice$/i })).not.toBeInTheDocument()
    const a4PrintSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: /close preview/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Print A4 Invoice$/i }))
    expect(document.querySelector('.invoice-document')).toBeInTheDocument()
    expect(document.querySelector('.thermal-receipt')).not.toBeInTheDocument()
    expect(a4PrintSpy).toHaveBeenCalledOnce()
    a4PrintSpy.mockRestore()
  })

  it('starts receipt PDF download while receipt data is still loading', async () => {
    getReceiptMock.mockReturnValue(new Promise(() => undefined))
    receiptDownloadMock.mockResolvedValue(new Blob(['thermal receipt']))
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:receipt'), revokeObjectURL: vi.fn() }))
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Receipt$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    expect(await screen.findByTestId('thermal-pdf-preview')).toBeInTheDocument()
    expect(screen.queryByText(/loading receipt details/i)).not.toBeInTheDocument()

    const downloadButton = screen.getByRole('button', { name: /Download PDF receipt 58mm/i })
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

  it.each(['58mm', '80mm'] as const)('shows the A4 design initially and switches to the backend thermal invoice PDF at %s', async (width) => {
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    expect(document.querySelector('.invoice-document')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`thermal ${width}`, 'i') }))
    expect(await screen.findByTestId('backend-pdf-loaded')).toBeInTheDocument()
    expect(screen.getByTestId('thermal-pdf-preview')).toHaveAttribute('data-paper-width', width)
    expect(screen.getByTestId('thermal-pdf-preview')).toHaveAttribute('data-document-kind', 'invoice')
    expect(document.querySelector('.invoice-document')).not.toBeInTheDocument()
    expect(document.querySelector('[data-invoice-thermal-root]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-receipt-root]')).not.toBeInTheDocument()
    expect(document.querySelector('.thermal-print-source')).not.toBeInTheDocument()
  })

  it.each([
    ['invoice', '58mm'], ['invoice', '80mm'], ['receipt', '58mm'], ['receipt', '80mm'],
  ] as const)('prints the selected backend %s PDF at %s from the current page', async (kind, width) => {
    if (kind === 'receipt') getReceiptMock.mockResolvedValue(receipt)
    const createUrl = vi.fn(() => `blob:${kind}-${width}`)
    const revokeUrl = vi.fn()
    const open = vi.spyOn(window, 'open')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl }))
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: kind === 'receipt' ? /^Print Receipt$/i : /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`thermal ${width}`, 'i') }))
    await screen.findByTestId('backend-pdf-loaded')
    if (kind === 'receipt') await vi.waitFor(() => expect(screen.getByRole('button', { name: new RegExp(`Print Receipt \\(${width}\\)`, 'i') })).toBeEnabled())

    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Print ${kind} \\(${width}\\)`, 'i') }))
    const frame = await screen.findByTitle(`Thermal ${kind} print document`)
    const frameWindow = frame.contentWindow
    if (!frameWindow) throw new Error('Missing thermal print frame window')
    const framePrint = vi.spyOn(frameWindow, 'print').mockImplementation(() => undefined)
    const frameFocus = vi.spyOn(frameWindow, 'focus').mockImplementation(() => undefined)
    const documentLabel = kind === 'invoice' ? 'Invoice' : 'Receipt'
    fireEvent.load(frame)
    await vi.waitFor(() => expect(framePrint).toHaveBeenCalledOnce())
    expect(frameFocus).toHaveBeenCalledOnce()
    await vi.waitFor(() => expect(screen.getByRole('button', { name: `Print ${documentLabel} (${width})` })).toBeEnabled())
    expect(screen.getByTitle(`Thermal ${kind} print document`)).toBeInTheDocument()
    frameWindow.dispatchEvent(new Event('afterprint'))
    expect(screen.queryByTitle(`Thermal ${kind} print document`)).not.toBeInTheDocument()
    expect(open).not.toHaveBeenCalled()
    if (kind === 'invoice') expect(thermalDownloadMock).toHaveBeenCalledWith('invoice-1', width)
    else expect(receiptDownloadMock).toHaveBeenCalledWith('invoice-1', { width })
    expect(kind === 'invoice' ? thermalDownloadMock : receiptDownloadMock).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[data-invoice-thermal-root]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-receipt-root]')).not.toBeInTheDocument()
    expect(document.querySelector('.thermal-print-source')).not.toBeInTheDocument()
    frameWindow.dispatchEvent(new Event('afterprint'))
    expect(screen.queryByTitle(`Thermal ${kind} print document`)).not.toBeInTheDocument()
    expect(revokeUrl).toHaveBeenCalledWith(`blob:${kind}-${width}`)
    open.mockRestore()
    vi.unstubAllGlobals()
  })

  it('reuses the preview in-flight PDF, shows Preparing only while waiting, and prints after it loads', async () => {
    let resolvePdf!: (blob: Blob) => void
    thermalDownloadMock.mockReturnValue(new Promise((resolve) => { resolvePdf = resolve }))
    const frameUrl = vi.fn(() => 'blob:pending')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: frameUrl, revokeObjectURL: vi.fn() }))
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Print Invoice (58mm)' }))
    expect(screen.getByRole('button', { name: 'Preparing…' })).toBeDisabled()
    expect(thermalDownloadMock).toHaveBeenCalledTimes(1)
    resolvePdf(new Blob(['final backend PDF']))
    const frame = await screen.findByTitle('Thermal invoice print document')
    const frameWindow = frame.contentWindow
    if (!frameWindow) throw new Error('Missing thermal print frame window')
    const framePrint = vi.spyOn(frameWindow, 'print').mockImplementation(() => undefined)
    vi.spyOn(frameWindow, 'focus').mockImplementation(() => undefined)
    fireEvent.load(frame)
    await vi.waitFor(() => expect(framePrint).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: 'Print Invoice (58mm)' })).toBeEnabled()
    expect(screen.getByTitle('Thermal invoice print document')).toBeInTheDocument()
    window.dispatchEvent(new Event('afterprint'))
    expect(screen.queryByTitle('Thermal invoice print document')).not.toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('restores print controls immediately after repeated prints and cancellation while switching document and width', async () => {
    getReceiptMock.mockResolvedValue(receipt)
    vi.stubGlobal('URL', Object.assign(URL, {
      createObjectURL: vi.fn(() => `blob:thermal-${Math.random()}`),
      revokeObjectURL: vi.fn(),
    }))
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    await screen.findByTestId('backend-pdf-loaded')

    const printAndClose = async (kind: 'invoice' | 'receipt', width: '58mm' | '80mm', closeWith: 'afterprint' | 'focus') => {
      const action = screen.getByRole('button', { name: `Print ${kind === 'invoice' ? 'Invoice' : 'Receipt'} (${width})` })
      fireEvent.click(action)
      const frame = await screen.findByTitle(`Thermal ${kind} print document`)
      const frameWindow = frame.contentWindow
      if (!frameWindow) throw new Error('Missing thermal print frame window')
      const framePrint = vi.spyOn(frameWindow, 'print').mockImplementation(() => undefined)
      vi.spyOn(frameWindow, 'focus').mockImplementation(() => undefined)
      fireEvent.load(frame)
      await vi.waitFor(() => expect(framePrint).toHaveBeenCalledOnce())
      // The UI is re-enabled as soon as print() returns, without releasing
      // the Blob URL before the PDF viewer reports that its dialog is closed.
      expect(screen.getByRole('button', { name: `Print ${kind === 'invoice' ? 'Invoice' : 'Receipt'} (${width})` })).toBeEnabled()
      expect(screen.getByTitle(`Thermal ${kind} print document`)).toBeInTheDocument()
      if (closeWith === 'afterprint') frameWindow.dispatchEvent(new Event('afterprint'))
      else window.dispatchEvent(new Event('focus'))
      await vi.waitFor(() => expect(screen.queryByTitle(`Thermal ${kind} print document`)).not.toBeInTheDocument())
      expect(screen.queryByTitle(`Thermal ${kind} print document`)).not.toBeInTheDocument()
      framePrint.mockRestore()
    }

    await printAndClose('invoice', '58mm', 'afterprint')
    await printAndClose('invoice', '58mm', 'focus')

    fireEvent.click(screen.getByRole('button', { name: /close preview/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Print Receipt$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 80mm/i }))
    await screen.findByTestId('backend-pdf-loaded')
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Print Receipt (80mm)' })).toBeEnabled())
    await printAndClose('receipt', '80mm', 'afterprint')
    vi.unstubAllGlobals()
  })

  it('restores the print button when the hidden PDF iframe fails to load', async () => {
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    await screen.findByTestId('backend-pdf-loaded')
    fireEvent.click(screen.getByRole('button', { name: 'Print Invoice (58mm)' }))
    const frame = await screen.findByTitle('Thermal invoice print document')
    fireEvent.error(frame)
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Print Invoice (58mm)' })).toBeEnabled())
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load the thermal PDF for printing.')
    expect(screen.queryByTitle('Thermal invoice print document')).not.toBeInTheDocument()
  })

  it('does not print a pending PDF after the selected preview is closed', async () => {
    let resolvePdf!: (blob: Blob) => void
    thermalDownloadMock.mockReturnValue(new Promise((resolve) => { resolvePdf = resolve }))
    const open = vi.spyOn(window, 'open')
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Print Invoice (58mm)' }))
    fireEvent.click(screen.getByRole('button', { name: /close preview/i }))
    resolvePdf(new Blob(['now stale']))
    await vi.waitFor(() => expect(document.querySelector('iframe[title="Thermal invoice print document"]')).not.toBeInTheDocument())
    expect(open).not.toHaveBeenCalled()
    open.mockRestore()
  })

  it('shows a backend failure without opening a new tab or leaving Preparing active', async () => {
    thermalDownloadMock.mockRejectedValue(new Error('PDF service unavailable'))
    const open = vi.spyOn(window, 'open')
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))
    await screen.findByTestId('thermal-pdf-preview')
    fireEvent.click(screen.getByRole('button', { name: 'Print Invoice (58mm)' }))
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Print Invoice (58mm)' })).toBeEnabled())
    expect(screen.getByRole('button', { name: 'Print Invoice (58mm)' })).toBeEnabled()
    expect(open).not.toHaveBeenCalled()
    expect(screen.queryByTitle(/thermal invoice print document/i)).not.toBeInTheDocument()
    open.mockRestore()
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

  it('shows only the PDF loading state until the backend thermal invoice is ready', async () => {
    thermalDownloadMock.mockReturnValue(new Promise(() => undefined))
    renderPage('UNPAID')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 58mm/i }))

    expect(await screen.findByTestId('thermal-pdf-preview')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Preparing PDF preview…')
    expect(document.querySelector('[data-invoice-thermal-root="screen"]')).not.toBeInTheDocument()
    expect(screen.queryByTestId('thermal-preview-fallback')).not.toBeInTheDocument()
  })

  it('downloads thermal invoice PDFs with the selected width and prevents duplicate clicks', async () => {
    let resolvePdf!: (blob: Blob) => void
    thermalDownloadMock.mockReturnValue(new Promise((resolve) => { resolvePdf = resolve }))
    const createUrl = vi.fn(() => 'blob:thermal')
    const revokeUrl = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl }))
    const clickedFilename = vi.fn()
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { clickedFilename(this.download) })
    renderPage('UNPAID', 'DNI-INV-20261008-000039')
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: /thermal 80mm/i }))
    fireEvent.click(screen.getByRole('button', { name: /download pdf invoice 80mm/i }))
    expect(await screen.findByRole('button', { name: /downloading/i })).toBeDisabled()
    expect(thermalDownloadMock).toHaveBeenCalledWith('invoice-1', '80mm')
    resolvePdf(new Blob(['pdf']))
    await vi.waitFor(() => expect(createUrl).toHaveBeenCalledOnce())
    expect(anchorClick).toHaveBeenCalledOnce()
    expect(clickedFilename).toHaveBeenCalledWith('INV-20261008-000039-thermal-80mm.pdf')
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
    await vi.waitFor(() => expect(screen.getByRole('button', { name: /print receipt/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /download pdf receipt 58mm/i }))
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
    await screen.findByTestId('thermal-preview-actions')
    if (kind === 'receipt') await vi.waitFor(() => expect(screen.getByRole('button', { name: new RegExp(`Print Receipt \\(${width}\\)`,'i') })).toBeEnabled())
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
  ] as const)('returning to A4 from %s %s prints only A4', async (kind, width) => {
    if (kind === 'receipt') getReceiptMock.mockResolvedValue(receipt)
    renderPage()
    await screen.findByRole('button', { name: /^Print Invoice$/i })
    fireEvent.click(screen.getByRole('button', { name: kind === 'receipt' ? /^Print Receipt$/i : /^Print Invoice$/i }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`thermal ${width}`, 'i') }))
    await screen.findByTestId('thermal-preview-actions')
    if (kind === 'receipt') await vi.waitFor(() => expect(screen.getByRole('button', { name: new RegExp(`Print Receipt \\(${width}\\)`,'i') })).toBeEnabled())

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: /close preview/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Print A4 Invoice$/i }))
    await vi.waitFor(() => expect(printSpy).toHaveBeenCalledOnce())
    expect(document.querySelector('.invoice-document')).toBeInTheDocument()
    expect(document.querySelector('.thermal-receipt')).not.toBeInTheDocument()
    expect(document.body).not.toHaveClass('thermal-printing')
    printSpy.mockRestore()
  })
})
