// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import ThermalInvoiceDocument from './ThermalInvoiceDocument'

const invoice = {
  id: 'invoice-1',
  invoiceNumber: 'INV-100',
  createdAt: '2026-10-30T10:00:00.000Z',
  orderReference: 'ORD-100',
  currency: 'MMK',
  customerName: 'Customer',
  shopName: 'Daily Need Items',
  lineItems: [{
    orderItemId: 'line-1', name: 'Whole grain cereal', sku: 'CEREAL-01', variantName: '1kg bag',
    quantity: 3, unitPrice: '1200', total: '3600',
  }],
  subtotal: '3600', deliveryFee: '0', taxAmount: '0', discountAmount: '200', grandTotal: '3400',
} as InvoiceDocument

describe('ThermalInvoiceDocument product items', () => {
  afterEach(() => cleanup())

  it.each(['58mm', '80mm'] as const)('uses the shared item layout at %s and keeps the persisted grand total', (width) => {
    render(<ThermalInvoiceDocument invoice={invoice} width={width} />)
    const itemsHeading = screen.getByText('ITEMS')
    const itemSection = itemsHeading.parentElement
    expect(itemSection).not.toBeNull()
    const item = within(itemSection as HTMLElement).getByTestId('thermal-item-block')
    expect(within(item).getByText('Whole grain cereal')).toBeInTheDocument()
    expect(within(item).getByText('MMK 3,600')).toBeInTheDocument()
    expect(screen.getByText('-MMK 200')).toBeInTheDocument()
    expect(screen.getByText('GRAND TOTAL:')).toBeInTheDocument()
    expect(screen.getByText('MMK 3,400')).toBeInTheDocument()
  })
})
