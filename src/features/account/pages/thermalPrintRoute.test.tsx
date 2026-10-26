import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CustomerInvoicePrintPage from './CustomerInvoicePrintPage'
import CustomerReceiptPrintPage from './CustomerReceiptPrintPage'
import { getInvoiceForPrint, getReceiptForPrint } from '@/lib/api/invoiceClient'

vi.mock('@/app/hooks', () => ({ useAppSelector: () => true }))
vi.mock('@/features/invoices/components/InvoiceThermalSheet', () => ({ default: (props: any) => <div data-testid="thermal-invoice" data-width={props.width} data-mode={props.mode}>{props.invoice.invoiceNumber}</div> }))
vi.mock('@/features/invoices/components/InvoiceDocumentSheet', () => ({ default: () => <div data-testid="a4-invoice">A4</div> }))
vi.mock('@/features/invoices/components/ReceiptDocumentSheet', () => ({ default: (props: any) => <div data-testid="thermal-receipt" data-width={props.width} data-mode={props.mode}>{props.receipt.receiptNumber}</div> }))
vi.mock('@/lib/api/invoiceClient', () => ({
  getInvoiceForPrint: vi.fn(),
  getReceiptForPrint: vi.fn(),
  getMyInvoices: vi.fn(),
  getCustomerInvoiceByNumber: vi.fn(),
  getReceiptForInvoice: vi.fn(),
}))

afterEach(() => {
  cleanup()
  document.body.classList.remove('thermal-printing')
  vi.clearAllMocks()
})

const invoice = { id: 'invoice-1', invoiceNumber: 'INV-REAL', status: 'PAID', lineItems: [{ name: 'Actual product', quantity: 2, total: '22' }] } as any
const receipt = { id: 'receipt-1', receiptNumber: 'REC-REAL', invoiceNumber: 'INV-REAL', status: 'ISSUED' } as any

const renderRoute = (path: string, element: ReactNode) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/account/invoices/:invoiceNumber/*" element={element} /></Routes>
  </MemoryRouter>,
)

describe('thermal PDF print routes', () => {
  it.each(['58mm', '80mm'])('invoice %s route uses the same thermal invoice sheet and invoice data', async (width) => {
    vi.mocked(getInvoiceForPrint).mockResolvedValue(invoice)
    renderRoute(`/account/invoices/INV-REAL/print?token=short-lived&format=thermal&width=${width}`, <CustomerInvoicePrintPage />)
    const sheet = await screen.findByTestId('thermal-invoice')
    expect(sheet).toHaveAttribute('data-width', width)
    expect(sheet).toHaveAttribute('data-mode', 'print')
    expect(sheet).toHaveTextContent('INV-REAL')
    expect(screen.queryByTestId('a4-invoice')).not.toBeInTheDocument()
    expect([...document.querySelectorAll('style')].some((style) => style.textContent?.includes('size: A4'))).toBe(false)
  })

  it.each(['58mm', '80mm'])('receipt %s route uses the same receipt sheet and token-authorized data', async (width) => {
    vi.mocked(getReceiptForPrint).mockResolvedValue({ invoice, receipt })
    renderRoute(`/account/invoices/INV-REAL/receipt/print?token=short-lived&width=${width}`, <CustomerReceiptPrintPage />)
    await waitFor(() => expect(getReceiptForPrint).toHaveBeenCalledWith('INV-REAL', 'short-lived'))
    const sheet = await screen.findByTestId('thermal-receipt')
    expect(document.body).toHaveClass('thermal-printing')
    expect(sheet).toHaveAttribute('data-width', width)
    expect(sheet).toHaveAttribute('data-mode', 'print')
    expect(sheet).toHaveTextContent('REC-REAL')
  })
})
