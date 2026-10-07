// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import CustomerInvoicesPage from './CustomerInvoicesPage'

const { getMyInvoicesMock, uploadPaymentSlipMock, downloadInvoicePdfMock } = vi.hoisted(() => ({
  getMyInvoicesMock: vi.fn(),
  uploadPaymentSlipMock: vi.fn(),
  downloadInvoicePdfMock: vi.fn(),
}))

vi.mock('@/lib/api/invoiceClient', () => ({
  downloadInvoicePdf: downloadInvoicePdfMock,
  getMyInvoices: getMyInvoicesMock,
  uploadPaymentSlip: uploadPaymentSlipMock,
}))

vi.mock('@/app/hooks', () => ({
  useAppSelector: () => true,
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
})
