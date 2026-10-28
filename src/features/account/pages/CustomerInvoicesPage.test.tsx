// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import CustomerInvoicesPage from './CustomerInvoicesPage'

const { authState, getMyInvoicesMock, getShopInvoicesMock, uploadPaymentSlipMock, downloadInvoicePdfMock } = vi.hoisted(() => ({
  authState: { user: null as null | { id: string; role?: string; active_shop_id?: string | null; staff_shop_ids?: string[] } },
  getMyInvoicesMock: vi.fn(),
  getShopInvoicesMock: vi.fn(),
  uploadPaymentSlipMock: vi.fn(),
  downloadInvoicePdfMock: vi.fn(),
}))

vi.mock('@/lib/api/invoiceClient', () => ({
  downloadInvoicePdf: downloadInvoicePdfMock,
  getMyInvoices: getMyInvoicesMock,
  getShopInvoices: getShopInvoicesMock,
  uploadPaymentSlip: uploadPaymentSlipMock,
}))

vi.mock('@/app/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { isAuthenticated: true, user: authState.user },
  }),
}))

const createInvoice = (overrides: Partial<InvoiceDocument> = {}): InvoiceDocument => ({
  id: 'invoice-id',
  invoiceNumber: 'INV-20261007-000001',
  orderId: 'order-id',
  orderReference: 'ORD-20261007-000001',
  shopId: 'shop-id',
  shopName: 'Daily Need Shop',
  shopContactName: null,
  shopContactEmail: null,
  shopContactPhone: null,
  shopAddress: null,
  customerId: 'customer-id',
  customerPhone: null,
  billingAddress: null,
  shippingAddress: null,
  lineItems: [],
  subtotal: '100000.00',
  deliveryFee: '2000.00',
  taxAmount: '0.00',
  discountAmount: '0.00',
  grandTotal: '102000.00',
  currency: 'MMK',
  paymentMethod: 'COD',
  paymentGatewayRef: null,
  paymentSlipUrl: null,
  status: 'UNPAID',
  pdfUrl: null,
  verifiedBy: null,
  verifiedAt: null,
  rejectionReason: null,
  verificationNote: null,
  refundAmount: null,
  refundMethod: null,
  refundReason: null,
  createdAt: '2026-10-07T10:00:00.000Z',
  updatedAt: '2026-10-07T10:00:00.000Z',
  ...overrides,
})

const renderPage = async (invoice: InvoiceDocument) => {
  authState.user = { id: 'customer-id', role: 'USER' }
  getMyInvoicesMock.mockResolvedValue([invoice])
  render(
    <MemoryRouter>
      <CustomerInvoicesPage />
    </MemoryRouter>,
  )
  await screen.findAllByRole('link', { name: invoice.invoiceNumber })
}

describe('CustomerInvoicesPage payment slip actions', () => {
  beforeEach(() => {
    getMyInvoicesMock.mockReset()
    getShopInvoicesMock.mockReset()
    uploadPaymentSlipMock.mockReset()
    downloadInvoicePdfMock.mockReset()
  })

  afterEach(() => cleanup())

  it('does not offer slip submission for an unpaid COD invoice', async () => {
    const invoice = createInvoice()
    await renderPage(invoice)

    expect(screen.queryAllByRole('button', { name: /submit slip/i })).toHaveLength(0)
    expect(screen.getAllByText('Due on delivery').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cash on delivery').length).toBeGreaterThan(0)
    expect(invoice.status).toBe('UNPAID')
  })

  it('does not offer slip submission for a rejected COD invoice', async () => {
    await renderPage(createInvoice({ status: 'REJECTED' }))

    expect(screen.queryAllByRole('button', { name: /submit slip/i })).toHaveLength(0)
  })

  it('keeps slip submission available for a non-COD unpaid invoice', async () => {
    const invoice = createInvoice({ paymentMethod: 'CARD' })
    await renderPage(invoice)

    const submitButtons = screen.getAllByRole('button', { name: /submit slip/i })
    expect(submitButtons).toHaveLength(2)
    submitButtons[0].click()

    await waitFor(() => {
      expect(screen.getByText('Submit payment slip')).toBeTruthy()
    })
  })

  it('omits order references from the invoice history', async () => {
    const invoice = createInvoice()
    await renderPage(invoice)

    expect(screen.queryByRole('columnheader', { name: 'Order reference' })).toBeNull()
    expect(screen.queryByText(invoice.orderReference)).toBeNull()
  })

  it('paginates the invoice history', async () => {
    const invoices = Array.from({ length: 12 }, (_, index) => createInvoice({
      id: `invoice-id-${index + 1}`,
      invoiceNumber: `INV-20261007-${String(index + 1).padStart(6, '0')}`,
    }))
    getMyInvoicesMock.mockResolvedValue(invoices)
    render(
      <MemoryRouter>
        <CustomerInvoicesPage />
      </MemoryRouter>,
    )

    await screen.findAllByRole('link', { name: invoices[9].invoiceNumber })
    expect(screen.queryByRole('link', { name: invoices[10].invoiceNumber })).toBeNull()
    expect(screen.getByText('Showing 1-10 of 12 invoices')).toBeTruthy()

    screen.getByRole('button', { name: 'Next' }).click()

    await screen.findAllByRole('link', { name: invoices[10].invoiceNumber })
    expect(screen.queryByRole('link', { name: invoices[0].invoiceNumber })).toBeNull()
    expect(screen.getByText('Showing 11-12 of 12 invoices')).toBeTruthy()
  })

  it('loads all authorized shop invoices and exposes Thermal POS entry for staff memberships', async () => {
    authState.user = { id: 'staff-user', role: 'USER', staff_shop_ids: ['shop-a', 'shop-b'] }
    getShopInvoicesMock.mockResolvedValue([createInvoice({ status: 'PAID' })])

    render(<MemoryRouter><CustomerInvoicesPage /></MemoryRouter>)

    expect(await screen.findAllByRole('link', { name: /thermal pos actions/i })).toHaveLength(2)
    expect(getShopInvoicesMock).toHaveBeenCalledOnce()
    expect(getMyInvoicesMock).not.toHaveBeenCalled()
    expect(screen.queryAllByRole('button', { name: /submit slip/i })).toHaveLength(0)
  })

  it('uses the staff invoice workflow for a seller account with an active shop', async () => {
    authState.user = { id: 'seller-user', role: 'SHOP_ADMIN', active_shop_id: 'shop-a' }
    getShopInvoicesMock.mockResolvedValue([createInvoice({ status: 'UNPAID' })])

    render(<MemoryRouter><CustomerInvoicesPage /></MemoryRouter>)

    expect(await screen.findAllByRole('link', { name: /thermal pos actions/i })).toHaveLength(2)
    expect(getShopInvoicesMock).toHaveBeenCalledOnce()
    expect(getMyInvoicesMock).not.toHaveBeenCalled()
  })

  it('keeps thermal actions hidden for a customer even if shop IDs are absent', async () => {
    authState.user = { id: 'customer-id', role: 'USER', staff_shop_ids: [] }
    await renderPage(createInvoice({ status: 'PAID' }))

    expect(screen.queryAllByRole('link', { name: /thermal pos actions/i })).toHaveLength(0)
    expect(getMyInvoicesMock).toHaveBeenCalledOnce()
    expect(getShopInvoicesMock).not.toHaveBeenCalled()
  })
})
