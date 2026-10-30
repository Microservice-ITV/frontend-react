// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import ThermalItemTable, { type LineItem } from './ThermalItemTable'
import { THERMAL_RECEIPT_STYLES } from '@/features/invoices/lib/thermalReceiptStyles'

const products: LineItem[] = [{
  orderItemId: 'item-1',
  name: 'DailyNeedItems whole grain cereal family pack',
  sku: 'CEREAL-01',
  variantName: 'Large 1kg pack',
  quantity: 3,
  unitPrice: '1200',
  total: '3600',
}]

describe('ThermalItemTable', () => {
  afterEach(() => cleanup())

  it('renders a compact 58mm product line with quantity, unit price, and line total', () => {
    const { container } = render(<ThermalItemTable items={products} currency="MMK" width="58mm" />)
    const table = container.querySelector('.thermal-item-table-narrow')
    expect(table).not.toBeNull()
    const item = within(screen.getByTestId('thermal-item-block'))
    expect(item.getByText(products[0].name)).toBeInTheDocument()
    expect(item.getByText('3 × MMK 1,200')).toBeInTheDocument()
    expect(item.getByText('MMK 3,600')).toBeInTheDocument()
    expect(item.getByText('SKU: CEREAL-01')).toBeInTheDocument()
    expect(item.getByText('Large 1kg pack')).toBeInTheDocument()
    expect(table?.querySelector('.receipt-item-heading')).toBeNull()
  })

  it('renders the 80mm aligned name, quantity, total, and secondary unit price and metadata', () => {
    const { container } = render(<ThermalItemTable items={products} currency="MMK" width="80mm" />)
    const table = container.querySelector('.thermal-item-table-wide')
    const item = screen.getByTestId('thermal-item-block')
    expect(table).not.toBeNull()
    expect(item.querySelector('.receipt-item-wide-row')).toBeInTheDocument()
    expect(within(item).getByText(products[0].name)).toBeInTheDocument()
    expect(within(item).getByText('×3')).toBeInTheDocument()
    expect(within(item).getByText('MMK 3,600')).toBeInTheDocument()
    expect(within(item).getByText('Unit: MMK 1,200')).toBeInTheDocument()
    expect(within(item).getByText('SKU: CEREAL-01')).toBeInTheDocument()
    expect(within(item).getByText('Large 1kg pack')).toBeInTheDocument()
  })

  it('renders every product beyond 20, including long names and differing quantity and price data', () => {
    const manyItems = Array.from({ length: 27 }, (_, index): LineItem => ({
      orderItemId: `item-${index + 1}`,
      name: index === 26 ? 'A very long product name that must be visually truncated with an ellipsis without hiding its amount' : `Product ${index + 1}`,
      quantity: index + 1,
      unitPrice: `${100 + index}`,
      total: `${(index + 1) * (100 + index)}`,
    }))
    render(<ThermalItemTable items={manyItems} currency="MMK" width="58mm" />)
    expect(screen.getAllByTestId('thermal-item-block')).toHaveLength(27)
    expect(screen.getByText(manyItems[26].name)).toBeInTheDocument()
    expect(screen.getByText('27 × MMK 126')).toBeInTheDocument()
    expect(screen.getByText('MMK 3,402')).toBeInTheDocument()
    expect(screen.queryByText(/more items/)).not.toBeInTheDocument()
    expect(screen.getByText(manyItems[26].name)).toHaveClass('receipt-item-name')
    expect(screen.getAllByTestId('thermal-item-block')[26]).toHaveClass('receipt-item-block-narrow')
  })

  it('keeps every product name to one ellipsized visual line in both paper layouts', () => {
    expect(THERMAL_RECEIPT_STYLES).toMatch(/\.receipt-item-block\s*\{[^}]*break-inside:\s*avoid/s)
    for (const selector of [
      /\.receipt-item-wide-row \.receipt-item-name\s*\{([^}]*)\}/s,
      /\.thermal-item-table-narrow \.receipt-item-name\s*\{([^}]*)\}/s,
    ]) {
      const rules = THERMAL_RECEIPT_STYLES.match(selector)?.[1] ?? ''
      expect(rules).toMatch(/white-space:\s*nowrap/)
      expect(rules).toMatch(/overflow:\s*hidden/)
      expect(rules).toMatch(/text-overflow:\s*ellipsis/)
      expect(rules).toMatch(/overflow-wrap:\s*normal/)
    }
    expect(THERMAL_RECEIPT_STYLES).toMatch(/\.receipt-item-unit\s*\{[^}]*white-space:\s*nowrap/s)
  })

  it('retains the full original name and displays all 27 items with totals in the 80mm layout', () => {
    const manyItems = Array.from({ length: 27 }, (_, index): LineItem => ({
      orderItemId: `item-${index + 1}`,
      name: index === 0 ? 'An extraordinarily long product name retained in invoice data while its visible row is ellipsized' : `Product ${index + 1}`,
      quantity: index + 1,
      unitPrice: `${100 + index}`,
      total: `${(index + 1) * (100 + index)}`,
    }))
    render(<ThermalItemTable items={manyItems} currency="MMK" width="80mm" />)
    expect(screen.getAllByTestId('thermal-item-block')).toHaveLength(27)
    const longName = screen.getByTitle(manyItems[0].name)
    expect(longName).toHaveTextContent(manyItems[0].name)
    expect(longName).toHaveClass('receipt-item-name')
    expect(screen.getByText('1 × MMK 100')).toBeInTheDocument()
    expect(screen.getByText('MMK 100')).toBeInTheDocument()
  })
})
