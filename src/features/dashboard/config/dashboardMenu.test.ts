import { describe, expect, it } from 'vitest'
import { DASHBOARD_MENU_SELLER } from './dashboardMenu'

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
})
