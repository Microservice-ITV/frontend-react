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

/**
 * Item table optimized for thermal width printing
 * Handles product name wrapping, compact layout, and proper alignment
 */
const ThermalItemTable = ({ items, currency, width, maxItems = 20 }: ThermalItemTableProps) => {
  const displayItems = items.slice(0, maxItems)
  const hasMoreItems = items.length > maxItems
  const columnWidths = width === '58mm' ? {
    name: '40%',
    qty: '15%',
    price: '20%',
    total: '25%'
  } : {
    name: '45%',
    qty: '15%',
    price: '20%',
    total: '20%'
  }

  return (
    <div className="thermal-item-table">
      {/* Table Header */}
      <div className="receipt-item-header receipt-divider">
        <div style={{ width: columnWidths.name }} className="receipt-label">Description</div>
        <div style={{ width: columnWidths.qty }} className="receipt-label text-right">Qty</div>
        <div style={{ width: columnWidths.price }} className="receipt-label text-right">Price</div>
        <div style={{ width: columnWidths.total }} className="receipt-label text-right">Total</div>
      </div>
      
      <div className="receipt-divider" />

      {/* Items */}
      <div className="thermal-item-list">
        {displayItems.map((item, index) => (
          <div key={item.orderItemId || item.id || index} className="receipt-item-row">
            <div style={{ width: columnWidths.name }} className="receipt-item-name">
              <div className="receipt-value">
                {item.name || 'Product'}
                {item.variantName && (
                  <div className="receipt-faint text-xs mt-0.5">{item.variantName}</div>
                )}
              </div>
            </div>
            <div style={{ width: columnWidths.qty }} className="receipt-item-qty">
              <span className="receipt-value tabular-nums">×{item.quantity}</span>
            </div>
            <div style={{ width: columnWidths.price }} className="receipt-item-price">
              <span className="receipt-value tabular-nums">{formatCurrency(item.unitPrice, currency)}</span>
            </div>
            <div style={{ width: columnWidths.total }} className="receipt-item-total">
              <span className="receipt-value receipt-accent tabular-nums">{formatCurrency(item.total, currency)}</span>
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