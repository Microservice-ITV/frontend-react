import { format } from 'date-fns'
import type { ReceiptDocument, InvoiceDocument } from '@/lib/api/invoiceClient'
import ThermalItemTable from './ThermalItemTable'
import ThermalQRCode from './ThermalQRCode'
import { 
  formatCurrency, 
  formatReceiptDate, 
  formatReceiptNumber 
} from '@/features/invoices/lib/invoiceFormat'

interface ThermalReceiptPrintProps {
  receipt: ReceiptDocument
  invoice?: InvoiceDocument
  width: '58mm' | '80mm'
}

/**
 * Shared component for thermal receipt printing
 * Professional POS design with Daily Need Items branding
 */
const ThermalReceiptPrint = ({ receipt, invoice, width }: ThermalReceiptPrintProps) => {
  const hasNonZeroAmount = (value: string | null) => {
    if (value === null || value.trim() === '') return false
    const amount = Number(value)
    return Number.isFinite(amount) && amount !== 0
  }

  const receiptNumber = formatReceiptNumber(receipt.receiptNumber || receipt.id)
  const issuedDate = formatReceiptDate(receipt.issuedAt)
  const currency = receipt.currency || 'MMK'
  
  const customerName = invoice?.customerName || receipt.customerName || 'Customer'
  const customerEmail = invoice?.customerEmail || receipt.customerEmail
  const shopName = invoice?.shopName || receipt.shopName || 'Daily Need Items'

  const lineItems = invoice?.lineItems || []

  return (
    <div className="p-2">
      {/* Header with Daily Need Items branding */}
      <header className="receipt-center mb-3">
        <h1 className="receipt-store-name">DAILY NEED ITEMS</h1>
        <div className="receipt-divider" />
        <h2 className="receipt-document-title">PAYMENT RECEIPT</h2>
        <p className="receipt-label mb-1">Payment Confirmation Document</p>
      </header>

      {/* Document Information */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="receipt-label">Receipt No:</span>
          <span className="receipt-value receipt-bold">{receiptNumber}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="receipt-label">Invoice No:</span>
          <span className="receipt-value">{receipt.invoiceNumber}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="receipt-label">Date:</span>
          <span className="receipt-value">{issuedDate}</span>
        </div>
        {receipt.orderReference && (
          <div className="flex justify-between items-center mb-1">
            <span className="receipt-label">Order Ref:</span>
            <span className="receipt-value">{receipt.orderReference}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="receipt-label">Status:</span>
          <span className={`receipt-value ${receipt.status === 'ISSUED' ? 'text-green-700' : 'text-amber-700'}`}>
            {receipt.status}
          </span>
        </div>
      </div>

      <div className="receipt-divider" />

      {/* Parties Information */}
      <div className="mb-4">
        <h3 className="receipt-section-title mb-2">PARTIES</h3>
        <div className="space-y-1">
          <div>
            <div className="receipt-label">Customer:</div>
            <div className="receipt-value">{customerName}</div>
          </div>
          {customerEmail && (
            <div>
              <div className="receipt-label">Email:</div>
              <div className="receipt-value">{customerEmail}</div>
            </div>
          )}
          <div>
            <div className="receipt-label">Merchant:</div>
            <div className="receipt-value">{shopName}</div>
          </div>
        </div>
      </div>

      <div className="receipt-divider" />

      {/* Payment Information */}
      <div className="mb-4">
        <h3 className="receipt-section-title mb-2">PAYMENT DETAILS</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="receipt-label">Method:</span>
            <span className="receipt-value">{receipt.paymentMethod || 'Not specified'}</span>
          </div>
          {receipt.paymentGatewayRef && (
            <div className="flex justify-between">
              <span className="receipt-label">Reference:</span>
              <span className="receipt-value">{receipt.paymentGatewayRef}</span>
            </div>
          )}
        </div>
      </div>

      {lineItems.length > 0 && (
        <>
          <div className="receipt-divider" />
          <div className="mb-4">
            <h3 className="receipt-section-title mb-2">ITEMS</h3>
            <ThermalItemTable 
              items={lineItems} 
              currency={currency}
              width={width}
              maxItems={5}
            />
          </div>
        </>
      )}

      <div className="receipt-divider" />

      {/* Totals Section */}
      <div className="mb-4">
        <h3 className="receipt-section-title mb-2">AMOUNTS</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="receipt-label">Subtotal:</span>
            <span className="receipt-value">{formatCurrency(receipt.subtotal, currency)}</span>
          </div>
          
          {hasNonZeroAmount(receipt.deliveryFee) && (
            <div className="flex justify-between">
              <span className="receipt-label">Delivery:</span>
              <span className="receipt-value">{formatCurrency(receipt.deliveryFee, currency)}</span>
            </div>
          )}
          
          {hasNonZeroAmount(receipt.discountAmount) && (
            <div className="flex justify-between">
              <span className="receipt-label">Discount:</span>
              <span className="receipt-value">-{formatCurrency(receipt.discountAmount, currency)}</span>
            </div>
          )}
          
          {hasNonZeroAmount(receipt.taxAmount) && (
            <div className="flex justify-between">
              <span className="receipt-label">Tax:</span>
              <span className="receipt-value">{formatCurrency(receipt.taxAmount, currency)}</span>
            </div>
          )}
          
          <div className="receipt-double-divider" />
          
          <div className="flex justify-between">
            <span className="receipt-label receipt-bold">TOTAL COLLECTED:</span>
            <span className="receipt-total">{formatCurrency(receipt.grandTotal, currency)}</span>
          </div>
        </div>
      </div>

      <div className="receipt-divider" />

      {/* QR Code Section */}
      <div className="mb-4">
        <ThermalQRCode 
          title="Scan to visit our store"
          subtitle="DailyNeedItems.com"
        />
      </div>

      {/* Footer */}
      <footer className="receipt-footer">
        <div className="receipt-divider" />
        <p className="mt-2">Thank you for your purchase!</p>
        <p className="mt-1">This receipt confirms payment has been received.</p>
        <p className="mt-1">For inquiries: support@dailyneeditems.com</p>
        <p className="mt-1 text-xs">Printed: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </footer>
    </div>
  )
}

export default ThermalReceiptPrint