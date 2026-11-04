import { describe, expect, it } from 'vitest'
import { formatDocumentTitle, resolvePageTitle } from './pageTitle'

describe('formatDocumentTitle', () => {
  it('appends the site name', () => {
    expect(formatDocumentTitle('Cart')).toBe('Cart - Daily Need Items')
  })

  it('uses only the site name on the home title', () => {
    expect(formatDocumentTitle('Daily Need Items')).toBe('Daily Need Items')
    expect(formatDocumentTitle('')).toBe('Daily Need Items')
  })
})

describe('resolvePageTitle', () => {
  it('names storefront pages', () => {
    expect(resolvePageTitle('/')).toBe('Daily Need Items')
    expect(resolvePageTitle('/cart')).toBe('Cart')
    expect(resolvePageTitle('/all_categories')).toBe('Categories')
    expect(resolvePageTitle('/wishlist')).toBe('Wishlist')
    expect(resolvePageTitle('/warehouse-manager/')).toBe('Dashboard')
  })

  it('prefers a static path over a param path', () => {
    expect(resolvePageTitle('/seller/products/new')).toBe('New Product')
    expect(resolvePageTitle('/seller/products/abc')).toBe('Product')
    expect(resolvePageTitle('/seller/accounting/profit-loss')).toBe('Profit & Loss')
    expect(resolvePageTitle('/seller/accounting/inventory-valuation')).toBe('Inventory Valuation')
    expect(resolvePageTitle('/super-admin/shipping/pricing-rules/new')).toBe('New Pricing Rule')
    expect(resolvePageTitle('/seller/promotion-engine/bundles')).toBe('Bundles')
    expect(resolvePageTitle('/seller/promotion-engine/bundles/new')).toBe('New Bundle')
    expect(resolvePageTitle('/seller/promotion-engine/bundles/abc/edit')).toBe('Edit Bundle')
    expect(resolvePageTitle('/super-admin/promotion-engine/bundles/new')).toBe('New Bundle')
    expect(resolvePageTitle('/super-admin/accounting/overview')).toBe('Accounting Overview')
    expect(resolvePageTitle('/seller/warehouse')).toBe('Warehouse Overview')
    expect(resolvePageTitle('/seller/warehouse/movements')).toBe('Inventory Movements')
    expect(resolvePageTitle('/seller/warehouse/purchase-orders/new')).toBe('Create Purchase Order')
    expect(resolvePageTitle('/seller/warehouse/orders/new')).toBe('Order from Warehouse')
    expect(resolvePageTitle('/seller/warehouse/from-warehouse')).toBe('Orders from warehouse')
    expect(resolvePageTitle('/super-admin/warehouse/warehouses/new')).toBe('New Warehouse')
    expect(resolvePageTitle('/super-admin/warehouse/warehouses/abc')).toBe('Warehouse')
    expect(resolvePageTitle('/super-admin/warehouse/warehouses/abc/edit')).toBe('Edit Warehouse')
    expect(resolvePageTitle('/super-admin/warehouse/suppliers/abc/edit')).toBe('Edit Supplier')
    expect(resolvePageTitle('/warehouse-manager/warehouse/receipts')).toBe('Goods Receipts')
    expect(resolvePageTitle('/warehouse-manager/warehouse/movements')).toBe('Inventory Movements')
    expect(resolvePageTitle('/super-admin/warehouse/assign-manager')).toBe('Assign Warehouse Manager')
  })

  it('includes the search query', () => {
    expect(resolvePageTitle('/search', '?q=rice')).toBe('Search: rice')
    expect(resolvePageTitle('/search')).toBe('Search')
  })

  it('sets document titles for thermal invoice and receipt print routes', () => {
    expect(resolvePageTitle('/account/invoices/INV-1/print', '?format=thermal&width=58mm')).toBe('Thermal invoice')
    expect(resolvePageTitle('/account/invoices/INV-1/receipt/print', '?width=80mm')).toBe('Thermal receipt')
    expect(resolvePageTitle('/account/invoices/INV-1/print')).toBe('Print invoice')
  })

  it('falls back when the path is unknown', () => {
    expect(resolvePageTitle('/does-not-exist')).toBe('Page Not Found')
  })
})
