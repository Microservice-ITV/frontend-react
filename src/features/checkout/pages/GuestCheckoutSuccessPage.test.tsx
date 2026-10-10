// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import GuestCheckoutSuccessPage from './GuestCheckoutSuccessPage'

const { getGuestInvoicesByOrderMock, getGuestInvoicesByCheckoutMock } = vi.hoisted(() => ({
  getGuestInvoicesByOrderMock: vi.fn(),
  getGuestInvoicesByCheckoutMock: vi.fn(),
}))

vi.mock('@/lib/api/invoiceClient', () => ({
  getGuestInvoicesByOrder: getGuestInvoicesByOrderMock,
  getGuestInvoicesByCheckout: getGuestInvoicesByCheckoutMock,
}))

const invoice: InvoiceDocument = {
  id: 'guest-invoice-id',
  invoiceNumber: 'INV-20261009-000001',
  orderId: 'guest-order-id',
  orderReference: 'ORD-20261009-000001',
  shopId: 'shop-id',
  shopName: 'Daily Need Shop',
  shopContactName: null,
  shopContactEmail: null,
  shopContactPhone: null,
  shopAddress: null,
  customerId: 'guest-id',
  customerName: 'Guest Customer',
  customerEmail: null,
  customerPhone: '+959123456789',
  billingAddress: null,
  shippingAddress: {
    full_name: 'Guest Customer',
    phone_no: '+959123456789',
    city: 'Yangon',
    address_line_1: '12 Example Street',
  },
  lineItems: [],
  subtotal: '100.00',
  deliveryFee: '5.00',
  taxAmount: '0.00',
  discountAmount: '0.00',
  grandTotal: '105.00',
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
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z',
}

const renderPage = () => render(
  <MemoryRouter initialEntries={[{
    pathname: '/checkout/guest/success',
    state: { checkoutId: 'guest-order-id', phone: '+959123456789' },
  }]}>
    <GuestCheckoutSuccessPage />
  </MemoryRouter>,
)

const renderLookupPage = () => render(
  <MemoryRouter initialEntries={['/checkout/guest/success']}>
    <GuestCheckoutSuccessPage />
  </MemoryRouter>,
)

describe('GuestCheckoutSuccessPage invoices', () => {
  afterEach(() => {
    cleanup()
    getGuestInvoicesByOrderMock.mockReset()
    getGuestInvoicesByCheckoutMock.mockReset()
  })

  it('loads and displays invoices using the guest order ID and phone', async () => {
    getGuestInvoicesByCheckoutMock.mockResolvedValue([invoice])
    renderPage()

    expect(await screen.findByText(`DNI-${invoice.invoiceNumber}`)).toBeTruthy()
    expect(getGuestInvoicesByCheckoutMock).toHaveBeenCalledWith('guest-order-id', '+959123456789')
    expect(screen.getAllByText('Guest Customer').length).toBeGreaterThan(0)
    expect(screen.getAllByText('+959123456789').length).toBeGreaterThan(0)
    expect(screen.getByText(/Yangon/)).toBeTruthy()
  })

  it('allows retrying when invoice generation has not completed yet', async () => {
    getGuestInvoicesByCheckoutMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([invoice])
    renderPage()

    const retryButton = await screen.findByRole('button', { name: 'Retry' })
    retryButton.click()

    expect(await screen.findByText(`DNI-${invoice.invoiceNumber}`)).toBeTruthy()
    expect(getGuestInvoicesByCheckoutMock).toHaveBeenCalledTimes(2)
  })

  it('allows looking up a guest invoice when opened without checkout navigation state', async () => {
    const user = userEvent.setup()
    getGuestInvoicesByOrderMock.mockResolvedValue([invoice])
    renderLookupPage()

    await user.type(screen.getByLabelText('Order ID'), 'guest-order-id')
    await user.type(screen.getByLabelText('Phone number'), '+959123456789')
    await user.click(screen.getByRole('button', { name: 'View invoice' }))

    expect(await screen.findByText(`DNI-${invoice.invoiceNumber}`)).toBeTruthy()
    expect(getGuestInvoicesByOrderMock).toHaveBeenCalledWith('guest-order-id', '+959123456789')
  })
})
