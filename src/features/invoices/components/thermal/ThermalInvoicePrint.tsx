import { format } from 'date-fns'
import type { InvoiceDocument } from '@/lib/api/invoiceClient'
import ThermalItemTable from './ThermalItemTable'
import ThermalQRCode from './ThermalQRCode'
import { 
  formatInvoiceNumber, 
  formatCurrency, 
  formatDate 
} from '@/features/invoices/lib/invoiceFormat'

interface ThermalInvoicePrintProps {
  invoice: InvoiceDocument
  width: '58mm' | '80mm'
}

/**
 * Shared component for thermal invoice printing
 * Professional POS design with Daily Need Items branding
 */
const ThermalInvoicePrint = ({ invoice, width }: ThermalInvoicePrintProps) => {
  const hasNonZeroAmount = (value: string | null) => {
    if (value === null || value.trim() === '') return false
    const amount = Number(value)
    return Number.isFinite(amount) && amount !== 0
  }

  const subtotal = invoice.subtotal || '0.00'
  const deliveryFee = invoice.deliveryFee || '0.00'
  const taxAmount = invoice.taxAmount || '0.00'
  const discountAmount = invoice.discountAmount || '0.00'
  const grandTotal = invoice.grandTotal || '0.00'

  const invoiceNumber = formatInvoiceNumber(invoice.invoiceNumber || invoice.id)

  return (
    <div className="p-2">
      {/* Header with Daily Need Items branding */}
      <header className="receipt-center mb-3">
        <h1 className="receipt-store-name">DAILY NEED ITEMS</h1>
        <div className="receipt-divider" />
        <h2 className="receipt-document-title">INVOICE</h2>
        <p className="receipt-label mb-1">Official Sales Document</p>
      </header>

      {/* Document Information */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="receipt-label">Invoice No:</span>
          <span className="receipt-value receipt-bold">{invoiceNumber}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="receipt-label">Date:</span>
          <span className="receipt-value">{formatDate(invoice.createdAt)}</span>
        </div>
        {invoice.orderReference && (
          <div className="flex justify-between items-center mb-1">
            <span className="receipt-label">Order Ref:</span>
            <span className="receipt-value">{invoice.orderReference}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="receipt-label">Status:</span>
          <span className={`receipt-value ${invoice.status === 'PAID' ? 'text-green-700' : 'text-amber-700'}`}>
            {invoice.status}
          </span>
        </div>
      </div>

      <div className="receipt-divider" />

      {/* Parties Information */}
      <div className="mb-4">
        <h3 className="receipt-section-title mb-2">PARTIES</h3>
        <div className="space-y-1">
          {invoice.customerName && (
            <div>
              <div className="receipt-label">Customer:</div>
              <div className="receipt-value">{invoice.customerName}</div>
            </div>
          )}
          {invoice.customerEmail && (
            <div>
              <div className="receipt-label">Email:</div>
              <div className="receipt-value">{invoice.customerEmail}</div>
            </div>
          )}
          {invoice.shopName && (
            <div>
              <div className="receipt-label">Shop:</div>
              <div className="receipt-value">{invoice.shopName}</div>
            </div>
          )}
        </div>
      </div>

      <div className="receipt-divider" />

      {/* Items Table */}
      <div className="mb-4">
        <h3 className="receipt-section-title mb-2">ITEMS</h3>
        <ThermalItemTable 
          items={invoice.lineItems || []} 
          currency={invoice.currency || 'MMK'}
          width={width}
        />
      </div>

      <div className="receipt-divider" />

      {/* Totals Section */}
      <div className="mb-4">
        <h3 className="receipt-section-title mb-2">TOTALS</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="receipt-label">Subtotal:</span>
            <span className="receipt-value">{formatCurrency(subtotal, invoice.currency)}</span>
          </div>
          
          {hasNonZeroAmount(deliveryFee) && (
            <div className="flex justify-between">
              <span className="receipt-label">Delivery:</span>
              <span className="receipt-value">{formatCurrency(deliveryFee, invoice.currency)}</span>
            </div>
          )}
          
          {hasNonZeroAmount(discountAmount) && (
            <div className="flex justify-between">
              <span className="receipt-label">Discount:</span>
              <span className="receipt-value">-{formatCurrency(discountAmount, invoice.currency)}</span>
            </div>
          )}
          
          {hasNonZeroAmount(taxAmount) && (
            <div className="flex justify-between">
              <span className="receipt-label">Tax:</span>
              <span className="receipt-value">{formatCurrency(taxAmount, invoice.currency)}</span>
            </div>
          )}
          
          <div className="receipt-double-divider" />
          
          <div className="flex justify-between">
            <span className="receipt-label receipt-bold">GRAND TOTAL:</span>
            <span className="receipt-total">{formatCurrency(grandTotal, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <div className="receipt-divider" />

      {/* Payment Information */}
      {invoice.paymentMethod && (
        <div className="mb-4">
          <h3 className="receipt-section-title mb-2">PAYMENT</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="receipt-label">Method:</span>
              <span className="receipt-value">{invoice.paymentMethod}</span>
            </div>
            {invoice.paymentGatewayRef && (
              <div className="flex justify-between">
                <span className="receipt-label">Reference:</span>
                <span className="receipt-value">{invoice.paymentGatewayRef}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Section */}
      <div className="mb-4">
        <ThermalQRCode 
          title="Scan to verify invoice"
          subtitle="Verify at DailyNeedItems.com"
        />
      </div>

      {/* Footer */}
      <footer className="receipt-footer">
        <div className="receipt-divider" />
        <p className="mt-2">Thank you for shopping with Daily Need Items!</p>
        <p className="mt-1">This is an official invoice document.</p>
        <p className="mt-1">For support: support@dailyneeditems.com</p>
        <p className="mt-1 text-xs">Printed: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </footer>
    </div>
  )
}

export default ThermalInvoicePrint