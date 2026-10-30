import { formatCurrency } from '@/features/invoices/lib/invoiceFormat'

export interface LineItem {
  id?: string
  orderItemId?: string
  name: string
  variantName?: string | null
  quantity: number
  unitPrice: string
  total: string
  sku?: string | null
}

interface ThermalItemTableProps {
  items: LineItem[]
  currency: string
  width: '58mm' | '80mm'
}

/** Width-aware POS rows keep each product and its actual invoice amounts together. */
const ThermalItemTable = ({ items, currency, width }: ThermalItemTableProps) => {
  const isNarrow = width === '58mm'
  return (
    <div className={`thermal-item-table thermal-item-table-${isNarrow ? 'narrow' : 'wide'}`}>
      {!isNarrow && (
        <div className="receipt-item-wide-row receipt-item-heading receipt-label" aria-hidden="true">
          <span>Item</span><span className="receipt-item-qty">Qty</span><span className="receipt-item-price">Total</span>
        </div>
      )}
      <div className="thermal-item-list">
        {items.map((item, index) => (
          <div key={item.orderItemId || item.id || index} className={`receipt-item-block ${isNarrow ? 'receipt-item-block-narrow' : 'receipt-item-block-wide'}`} data-testid="thermal-item-block">
            {isNarrow ? (
              <>
                <div className="receipt-item-name receipt-value" title={item.name}>{item.name}</div>
                <div className="receipt-item-narrow-row">
                  <span className="receipt-item-unit receipt-value">{item.quantity} × {formatCurrency(item.unitPrice, currency)}</span>
                  <span className="receipt-item-total receipt-value receipt-bold">{formatCurrency(item.total, currency)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="receipt-item-wide-row">
                  <span className="receipt-item-name receipt-value" title={item.name}>{item.name}</span>
                  <span className="receipt-item-qty receipt-value">×{item.quantity}</span>
                  <span className="receipt-item-total receipt-value receipt-bold">{formatCurrency(item.total, currency)}</span>
                </div>
                <div className="receipt-item-secondary receipt-faint">
                  <span>Unit: {formatCurrency(item.unitPrice, currency)}</span>
                  {item.sku && <span>SKU: {item.sku}</span>}
                  {item.variantName && <span>{item.variantName}</span>}
                </div>
              </>
            )}
            {isNarrow && (item.sku || item.variantName) && (
              <div className="receipt-item-secondary receipt-faint">
                {item.sku && <span>SKU: {item.sku}</span>}
                {item.variantName && <span>{item.variantName}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ThermalItemTable
