import { describe, expect, it } from 'vitest'
import { DASHBOARD_MENU_ADMIN, DASHBOARD_MENU_SELLER, DASHBOARD_MENU_WAREHOUSE_MANAGER } from './dashboardMenu'

const findSellerAccountingItems = () => {
  const items: Array<{ key?: string; label?: string; to?: string; children?: Array<{ key?: string; label?: string; to?: string }> }> = []

  for (const section of DASHBOARD_MENU_SELLER) {
    for (const item of section.items) {
      if (item.key?.startsWith('seller-accounting')) {
        items.push(item)
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.key?.startsWith('seller-accounting')) {
            items.push(child)
          }
        }
      }
    }
  }

  return items
}

describe('DASHBOARD_MENU warehouse purchasing items', () => {
  const labels = (sections: typeof DASHBOARD_MENU_SELLER) =>
    sections.flatMap((section) => section.items).map((item) => item.label)

  it('hides goods receipts and suppliers from the seller menu', () => {
    const sellerLabels = labels(DASHBOARD_MENU_SELLER)

    expect(sellerLabels).not.toContain('Goods Receipts')
    expect(sellerLabels).not.toContain('Suppliers')
    expect(sellerLabels).toContain('Purchase Orders')
    expect(sellerLabels).toContain('Inventory Data')
    expect(sellerLabels).toContain('Transfer')
    expect(sellerLabels).toContain('Order from Warehouse')
    expect(sellerLabels).not.toContain('Receive from Supplier')
  })

  it('keeps suppliers on the admin menu and leaves purchasing to the warehouse manager', () => {
    const adminLabels = labels(DASHBOARD_MENU_ADMIN)

    expect(adminLabels).not.toContain('Purchase Orders')
    expect(adminLabels).not.toContain('Goods Receipts')
    expect(adminLabels).not.toContain('Purchase Returns')
    expect(adminLabels).not.toContain('Transfer')
    expect(adminLabels).not.toContain('Order from Warehouse')
    expect(adminLabels).not.toContain('Receive from Supplier')
    expect(adminLabels).toContain('Suppliers')
    expect(adminLabels).toContain('Assign Warehouse Manager')
  })

  it('gives the warehouse manager only the warehouse menus', () => {
    const managerLabels = labels(DASHBOARD_MENU_WAREHOUSE_MANAGER)

    expect(managerLabels).toEqual([
      'Overview',
      'Warehouses',
      'Inventory Data',
      'Transfer',
      'Inventory Movements',
      'Purchase Orders',
      'Receive from Supplier',
      'Goods Receipts',
      'Purchase Returns',
    ])
    expect(managerLabels).not.toContain('Suppliers')
    expect(managerLabels).not.toContain('Assign Warehouse Manager')
    expect(managerLabels).not.toContain('Shops')
  })
})

describe('DASHBOARD_MENU_SELLER accounting items', () => {
  it('includes chart of accounts under seller accounting', () => {
    const chartOfAccounts = findSellerAccountingItems().find((item) => item.key === 'seller-accounting-chart-of-accounts')

    expect(chartOfAccounts).toMatchObject({
      key: 'seller-accounting-chart-of-accounts',
      label: 'Chart of Accounts',
      to: '/seller/accounting/chart-of-accounts',
    })

  })

  it('links sellers to the accounting overview and detailed profit and loss report', () => {
    const overview = findSellerAccountingItems().find((item) => item.key === 'seller-accounting-overview')
    const profitLoss = findSellerAccountingItems().find((item) => item.key === 'seller-accounting-profit-loss')

    expect(overview).toMatchObject({
      key: 'seller-accounting-overview',
      label: 'Accounting Overview',
      to: '/seller/accounting/overview',
    })
    expect(profitLoss).toMatchObject({
      key: 'seller-accounting-profit-loss',
      label: 'Profit & Loss',
      to: '/seller/accounting/profit-loss',
    })
  })

  describe('DASHBOARD_MENU_ADMIN order approval items', () => {
    it('links platform admins to the order approval queue', () => {
      const orderApprovals = DASHBOARD_MENU_ADMIN
        .flatMap((section) => section.items)
        .find((item) => item.key === 'admin-orders')

      expect(orderApprovals).toMatchObject({
        key: 'admin-orders',
        label: 'Order Approvals',
        to: '/super-admin/orders',
      })
    })

    it('links sellers to shop-specific Delivery Company expense configuration', () => {
      const deliveryExpenses = findSellerAccountingItems().find(
        (item) => item.key === 'seller-accounting-delivery-company-fees',
      )

      expect(deliveryExpenses).toMatchObject({
        key: 'seller-accounting-delivery-company-fees',
        label: 'Delivery Expense Fees',
        to: '/seller/accounting/delivery-company-fees',
      })
    })
  })

  describe('DASHBOARD_MENU_ADMIN delivery company items', () => {
    it('exposes the global Delivery Company catalog without provider-master navigation', () => {
      const items = DASHBOARD_MENU_ADMIN.flatMap((section) => section.items)

      expect(items).toContainEqual(expect.objectContaining({
        key: 'admin-delivery-companies',
        label: 'Delivery Companies',
        to: '/super-admin/shipping/delivery-companies',
      }))
      expect(items.some((item) => item.label?.includes('Delivery Provider'))).toBe(false)
    })
  })
})
