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
  maxItems?: number
}

/** POS-style rows keep each product, quantity, and line amount together. */
const ThermalItemTable = ({ items, currency, width, maxItems = 20 }: ThermalItemTableProps) => {
  const displayItems = items.slice(0, maxItems)
  const hasMoreItems = items.length > maxItems

  return (
    <div className={`thermal-item-table thermal-item-table-${width === '58mm' ? 'narrow' : 'wide'}`}>
      <div className="receipt-item-row receipt-item-heading receipt-label" aria-hidden="true">
        <span>Item</span><span className="receipt-item-qty">Qty</span><span className="receipt-item-price">Amount</span>
      </div>
      <div className="thermal-item-list">
        {displayItems.map((item, index) => (
          <div key={item.orderItemId || item.id || index} className="receipt-item-block">
            <div className="receipt-item-row">
              <span className="receipt-item-name receipt-value" title={[item.name || 'Product', item.variantName].filter(Boolean).join(' · ')}>
                {item.name || 'Product'}{item.variantName ? <span className="receipt-faint"> · {item.variantName}</span> : null}
              </span>
              <span className="receipt-item-qty receipt-value">{item.quantity}</span>
              <span className="receipt-item-price receipt-value receipt-bold">{formatCurrency(item.total, currency)}</span>
            </div>
          </div>
        ))}
        {hasMoreItems && (
          <div className="receipt-faint text-xs text-center py-1">
            ... and {items.length - maxItems} more items
          </div>
        )}
      </div>
    </div>
  )
}

export default ThermalItemTable
