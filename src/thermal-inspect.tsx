import React from 'react'
import { createRoot } from 'react-dom/client'
import InvoiceThermalSheet from '@/features/invoices/components/InvoiceThermalSheet'
import ReceiptDocumentSheet from '@/features/invoices/components/ReceiptDocumentSheet'
import type { InvoiceDocument, ReceiptDocument } from '@/lib/api/invoiceClient'

const params = new URLSearchParams(location.search)
const width = params.get('width') === '80mm' ? '80mm' : '58mm'
const kind = params.get('kind') === 'receipt' ? 'receipt' : 'invoice'
const count = Number(params.get('count') ?? 3)
const invoice = {
  id: 'thermal-preview-invoice', invoiceNumber: 'INV-20261008-000039', orderId: 'order-39', orderReference: 'ORD-39',
  shopId: 'shop-1', shopName: 'Daily Need Items', shopContactName: null, shopContactEmail: null, shopContactPhone: null,
  shopAddress: null, customerId: 'customer-1', customerName: 'Thermal Preview Customer', customerEmail: 'customer@example.test',
  customerPhone: '09-123456789', billingAddress: null,
  shippingAddress: { address_line_1: '39 Test Road', city: 'Yangon', country: 'Myanmar' },
  lineItems: Array.from({ length: count }, (_, i) => ({ name: `Thermal preview item ${i + 1}`, quantity: 1, unitPrice: '190000', total: '190000' })),
  subtotal: `${190000 * count}`, deliveryFee: '0', taxAmount: '0', discountAmount: '0', grandTotal: `${190000 * count}`, currency: 'MMK',
  paymentMethod: 'CARD', paymentGatewayRef: 'TXN-39', paymentSlipUrl: null, status: 'PAID', pdfUrl: null, verifiedBy: null,
  verifiedAt: null, rejectionReason: null, verificationNote: null, refundAmount: null, refundMethod: null, refundReason: null,
  createdAt: '2026-10-08T00:00:00.000Z', updatedAt: '2026-10-08T00:00:00.000Z',
} as unknown as InvoiceDocument
const receipt = {
  id: 'receipt-39', receiptNumber: 'REC-20261008-000039', invoiceId: invoice.id,
  invoiceNumber: invoice.invoiceNumber, orderId: invoice.orderId, orderReference: invoice.orderReference, shopId: invoice.shopId,
  shopName: invoice.shopName, customerId: invoice.customerId, customerName: invoice.customerName, customerEmail: invoice.customerEmail,
  currency: 'MMK', subtotal: invoice.subtotal, deliveryFee: '0', taxAmount: '0', discountAmount: '0', grandTotal: invoice.grandTotal,
  paymentMethod: 'CARD', paymentGatewayRef: 'TXN-39', status: 'ISSUED', issuedAt: '2026-10-08T00:00:00.000Z',
} as unknown as ReceiptDocument

createRoot(document.getElementById('root')!).render(
  <div className="min-h-screen bg-slate-50 px-4 py-6">
    <div data-print-hide style={{ minHeight: 1200 }}>Print controls</div>
    <div style={{ width: width === '58mm' ? '52mm' : '70mm' }}>
      {kind === 'receipt'
        ? <ReceiptDocumentSheet receipt={receipt} invoice={invoice} width={width} mode="print" showActions={false} />
        : <InvoiceThermalSheet invoice={invoice} width={width} mode="print" showActions={false} />}
    </div>
  </div>,
)

void (async () => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  await Promise.all([400, 500, 600, 700].map((weight) => document.fonts.load(`${weight} 10px Inter`)))
  await document.fonts.ready
  await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined)))
  window.__THERMAL_READY__ = true
})()

declare global { interface Window { __THERMAL_READY__?: boolean } }
