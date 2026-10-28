// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import SellerInvoicesPage from './SellerInvoicesPage'

const { getShopInvoicesMock } = vi.hoisted(() => ({ getShopInvoicesMock: vi.fn() }))

vi.mock('@/lib/api/invoiceClient', () => ({
  getShopInvoices: getShopInvoicesMock,
  downloadInvoicePdf: vi.fn(),
}))
vi.mock('@/app/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({
    auth: {
      isAuthenticated: true,
      user: { id: 'seller-1', active_shop_id: null },
      accessToken: 'seller-token',
    },
  }),
}))

const sellerInvoice = {
  id: 'invoice-1', invoiceNumber: 'INV-1', orderId: 'order-1', orderReference: 'ORD-1',
  shopId: 'shop-1', shopName: 'Seller shop', shopContactName: null, shopContactEmail: null,
  shopContactPhone: null, shopAddress: null, customerId: 'customer-1', customerName: 'Customer',
  customerPhone: null, customerEmail: 'customer@example.test', billingAddress: null, shippingAddress: null,
  lineItems: [], subtotal: '100', deliveryFee: '0', taxAmount: '0', discountAmount: '0', grandTotal: '100',
  currency: 'MMK', paymentMethod: 'COD', paymentGatewayRef: null, paymentSlipUrl: null,
  status: 'PAID', pdfUrl: null, verifiedBy: null, verifiedAt: null, rejectionReason: null,
  verificationNote: null, refundAmount: null, refundMethod: null, refundReason: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
} as InvoiceDocument

describe('seller invoice thermal POS entry', () => {
  afterEach(() => {
    cleanup()
    getShopInvoicesMock.mockReset()
  })

  it('links staff to the shared invoice detail thermal actions for the authorized shop invoice', async () => {
    getShopInvoicesMock.mockResolvedValue([
      sellerInvoice,
      { ...sellerInvoice, id: 'invoice-2', invoiceNumber: 'INV-2', shopId: 'shop-2', shopName: 'Second shop' },
    ])
    render(<MemoryRouter><SellerInvoicesPage /></MemoryRouter>)

    const thermalActions = await screen.findByRole('link', { name: 'Invoice details and thermal POS actions for INV-1' })
    expect(thermalActions).toHaveAttribute('href', '/seller/invoices/INV-1')
    expect(thermalActions).toHaveAttribute('title', expect.stringContaining('58mm and 80mm'))
    expect(await screen.findByRole('link', { name: 'Invoice details and thermal POS actions for INV-2' }))
      .toHaveAttribute('href', '/seller/invoices/INV-2')
    expect(getShopInvoicesMock).toHaveBeenCalledOnce()
  })
})
