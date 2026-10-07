// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import InvoiceDocumentSheet from './InvoiceDocumentSheet'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import { INVOICE_DOCUMENT_STYLES } from '../lib/invoicePrintStyles'

type InvoiceDocumentFixture = Omit<
  InvoiceDocument,
  'subtotal' | 'deliveryFee' | 'taxAmount' | 'discountAmount' | 'grandTotal' | 'currency'
> & {
  subtotal: string | null
  deliveryFee: string | null
  taxAmount: string | null
  discountAmount: string | null
  grandTotal: string | null
  currency: string | null
}

const createInvoice = (overrides: Partial<InvoiceDocumentFixture> = {}): InvoiceDocumentFixture => ({
  id: 'invoice-id',
  invoiceNumber: 'DNI-INV-20261006-000007',
  orderId: 'order-id',
  orderReference: 'DNI-ORD-20261006-000009',
  shopId: 'shop-id',
  shopName: 'Daily Need Shop',
  shopContactName: 'Shop Contact',
  shopContactEmail: 'shop@example.test',
  shopContactPhone: '+95 9 123456789',
  shopAddress: 'Yangon',
  customerId: 'customer-id',
  customerName: 'Customer Name',
  customerEmail: 'customer@example.test',
  customerPhone: '+95 9 987654321',
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
  createdAt: '2026-10-06T10:00:00.000Z',
  updatedAt: '2026-10-06T10:00:00.000Z',
  ...overrides,
})

const renderInvoice = (invoice: InvoiceDocumentFixture) =>
  render(<InvoiceDocumentSheet invoice={invoice} showActions={false} />)

afterEach(cleanup)

describe('InvoiceDocumentSheet', () => {
  it('renders a COD invoice as UNPAID and does not offer payment-slip submission', () => {
    renderInvoice(createInvoice({ paymentMethod: 'COD', status: 'UNPAID' }))

    expect(screen.getByText('DNI-INV-20261006-000007')).toBeTruthy()
    expect(screen.getByText('Cash on delivery')).toBeTruthy()
    expect(screen.getByLabelText('Payment Status: UNPAID')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /submit payment slip/i })).toBeNull()
  })

  it('renders a collected COD invoice as PAID', () => {
    renderInvoice(createInvoice({ paymentMethod: 'COD', status: 'PAID' }))

    expect(screen.getByLabelText('Payment Status: PAID')).toBeTruthy()
    expect(screen.getByText('PAID')).toBeTruthy()
  })

  it('renders a Stripe-paid invoice with the available payment reference', () => {
    renderInvoice(createInvoice({
      paymentMethod: 'STRIPE',
      paymentGatewayRef: 'pi_confirmed_123',
      status: 'PAID',
    }))

    expect(screen.getByText('Stripe / Card')).toBeTruthy()
    expect(screen.getByText('pi_confirmed_123')).toBeTruthy()
    expect(screen.getByLabelText('Payment Status: PAID')).toBeTruthy()
  })

  it('shows a backend-provided discount', () => {
    renderInvoice(createInvoice({ discountAmount: '5000.00', grandTotal: '97000.00' }))

    expect(screen.getByText('Discount')).toBeTruthy()
    expect(screen.getByText('-MMK 5,000')).toBeTruthy()
  })

  it('shows a backend-provided tax amount', () => {
    renderInvoice(createInvoice({ taxAmount: '10000.00', grandTotal: '112000.00' }))

    expect(screen.getByText('Tax')).toBeTruthy()
    expect(screen.getByText('MMK 10,000')).toBeTruthy()
  })

  it('shows both backend-provided discount and tax amounts', () => {
    renderInvoice(createInvoice({
      discountAmount: '5000.00',
      taxAmount: '10000.00',
      grandTotal: '107000.00',
    }))

    expect(screen.getByText('-MMK 5,000')).toBeTruthy()
    expect(screen.getByText('MMK 10,000')).toBeTruthy()
    expect(screen.getByText('MMK 107,000')).toBeTruthy()
  })

  it('renders zero values without treating missing amounts as zero', () => {
    renderInvoice(createInvoice({
      subtotal: null,
      deliveryFee: '0.00',
      taxAmount: null,
      discountAmount: null,
      grandTotal: null,
      currency: null,
    }))

    expect(screen.getByText('Subtotal').parentElement?.textContent).toContain('—')
    expect(screen.getByText('Shipping').parentElement?.textContent).toContain('0')
    expect(screen.getByText('Total').parentElement?.textContent).toContain('—')
    expect(screen.queryByText('Tax')).toBeNull()
    expect(screen.queryByText('Discount')).toBeNull()
  })

  it('displays extra charges with the existing logo on a brand-aligned light header', () => {
    renderInvoice(createInvoice({
      currency: 'EUR',
      subtotal: '1234.56',
      deliveryFee: '0',
      grandTotal: '1239.56',
      paymentMethod: 'regional_gateway',
      otherCharges: [{ label: 'Handling charge', amount: '5.00' }],
    }))

    expect(screen.getByText('EUR 1,234.56')).toBeTruthy()
    expect(screen.getByText('Handling charge')).toBeTruthy()
    expect(screen.getByText('EUR 5')).toBeTruthy()
    expect(screen.getByText('regional_gateway')).toBeTruthy()
    expect(screen.queryByText(/MMK/)).toBeNull()

    const logo = screen.getByRole('img', { name: 'Daily Need Items' }) as HTMLImageElement
    expect(logo.getAttribute('src')).toBe('/logo.svg')
    expect(logo.className).toContain('invoice-logo')
    expect(logo.parentElement?.parentElement?.parentElement?.className).toContain('invoice-header')
    expect(INVOICE_DOCUMENT_STYLES).toContain('--invoice-accent: var(--dni-primary-600, #059669)')
    expect(INVOICE_DOCUMENT_STYLES).toContain('.invoice-header::before')
    expect(INVOICE_DOCUMENT_STYLES).not.toContain('filter: brightness(0) invert(1)')
    expect(INVOICE_DOCUMENT_STYLES).not.toContain('background: #172033')
  })
})
