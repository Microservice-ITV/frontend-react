import { describe, expect, it } from 'vitest'
import { DASHBOARD_MENU_ADMIN, DASHBOARD_MENU_SELLER } from './dashboardMenu'

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
  })
})
