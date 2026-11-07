import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_MENU_ADMIN,
  DASHBOARD_MENU_DELIVERY_AGENT,
  DASHBOARD_MENU_PAYROLL,
  DASHBOARD_MENU_SELLER,
  DASHBOARD_MENU_WAREHOUSE_MANAGER,
  DASHBOARD_MENU_EMPLOYEE,
} from './dashboardMenu'
import { getSearchConfigsForArea } from './searchConfigs'
import { CAPABILITIES } from '@/app/rbac/capabilities'

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

  it('shows purchase tracking, confirm/pickup, and goods receipts for the seller', () => {
    const sellerLabels = labels(DASHBOARD_MENU_SELLER)

    expect(sellerLabels).toContain('Goods Receipts')
    expect(sellerLabels).toContain('Confirm and Pickup')
    expect(sellerLabels).toContain('Purchase Order Tracking')
    expect(sellerLabels).not.toContain('Suppliers')
    expect(sellerLabels).toContain('Purchase Orders')
    expect(sellerLabels).toContain('Inventory Data')
    expect(sellerLabels).toContain('Transfer')
    expect(sellerLabels).toContain('Orders from warehouse')
    expect(sellerLabels).not.toContain('Order from Warehouse')
    expect(sellerLabels).not.toContain('Receive from Supplier')
    expect(sellerLabels).toContain('Damage Reports')
  })

  it('shows Orders, Cancel Orders, and Return Orders as flat SALES items', () => {
    const sales = DASHBOARD_MENU_SELLER.find((section) => section.title === 'SALES')
    const salesItems = sales?.items ?? []

    expect(salesItems.map((item) => item.label)).toEqual([
      'Orders',
      'Quantity Approvals',
      'Cancel Orders',
      'Return Orders',
      'Payments',
      'Invoices',
    ])
    expect(salesItems.find((item) => item.key === 'seller-orders')?.children).toBeUndefined()
    expect(salesItems.find((item) => item.key === 'seller-cancel-orders')?.to).toBe('/seller/orders/cancelled')
    expect(salesItems.find((item) => item.key === 'seller-return-orders')?.to).toBe('/seller/orders/returns')
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
    expect(adminLabels).toContain('Assign Delivery Agent')
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
      'Request from seller',
      'Goods Receipts',
      'Purchase Returns',
      'Leave Requests',
      'Leave Approvals',
      'My Leave',
    ])
    expect(managerLabels).not.toContain('Purchase Order Tracking')
    expect(managerLabels).not.toContain('Suppliers')
    expect(managerLabels).not.toContain('Receive from Supplier')
    expect(managerLabels).not.toContain('Assign Warehouse Manager')
    expect(managerLabels).not.toContain('Shops')
  })

  it('routes the warehouse manager to its own leave request, approval and self-service pages', () => {
    const leaveItems = DASHBOARD_MENU_WAREHOUSE_MANAGER.flatMap((section) => section.items).filter((item) =>
      item.key?.startsWith('wm-leave') || item.key === 'wm-my-leave',
    )

    expect(leaveItems).toContainEqual(
      expect.objectContaining({
        key: 'wm-leave-requests',
        label: 'Leave Requests',
        to: '/warehouse-manager/leave/requests',
        requiredCapabilities: [CAPABILITIES.LEAVE_VIEW],
      }),
    )
    expect(leaveItems).toContainEqual(
      expect.objectContaining({
        key: 'wm-leave-approvals',
        label: 'Leave Approvals',
        to: '/warehouse-manager/leave/approvals',
        requiredCapabilities: [CAPABILITIES.LEAVE_REVIEW],
      }),
    )
    expect(leaveItems).toContainEqual(
      expect.objectContaining({
        key: 'wm-my-leave',
        label: 'My Leave',
        to: '/warehouse-manager/leave/me',
        requiredCapabilities: [CAPABILITIES.LEAVE_VIEW],
      }),
    )
  })

  it('gives the delivery agent only delivery permission menus', () => {
    const deliveryLabels = labels(DASHBOARD_MENU_DELIVERY_AGENT)

    expect(deliveryLabels).toEqual(['Overview', 'Parcels', 'Damage Reports', 'My Leave'])
    expect(deliveryLabels).not.toContain('Purchase Orders')
    expect(deliveryLabels).not.toContain('Warehouses')
    expect(deliveryLabels).not.toContain('Shops')
    expect(deliveryLabels).not.toContain('Order from Warehouse')
  })
})

describe('DASHBOARD_MENU_SELLER accounting items', () => {
  it('keeps finance navigation consolidated under seller accounting', () => {
    expect(DASHBOARD_MENU_SELLER.some((section) => section.title === 'FINANCE')).toBe(false)
    expect(DASHBOARD_MENU_SELLER.some((section) => section.title === 'ACCOUNTING')).toBe(true)
  })

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
    const receivablesPayables = findSellerAccountingItems().find((item) => item.key === 'seller-accounting-receivables-payables')
    const inventoryValuation = findSellerAccountingItems().find((item) => item.key === 'seller-accounting-inventory-valuation')

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
    expect(receivablesPayables).toMatchObject({
      key: 'seller-accounting-receivables-payables',
      label: 'Receivables & Payables',
      to: '/seller/accounting/receivables-payables',
      requiredCapabilities: [CAPABILITIES.FINANCE_DASHBOARD_VIEW],
    })
    expect(inventoryValuation).toMatchObject({
      key: 'seller-accounting-inventory-valuation',
      label: 'Inventory Valuation',
      to: '/seller/accounting/inventory-valuation',
      requiredCapabilities: [CAPABILITIES.FINANCE_DASHBOARD_VIEW],
    })
  })

  it('links finance users to the dashboard and reserved salary approvals page', () => {
    const items = findSellerAccountingItems()
    expect(items.find((item) => item.key === 'seller-accounting-finance-dashboard')).toMatchObject({
      label: 'Finance Dashboard',
      to: '/seller/finance',
    })
    expect(DASHBOARD_MENU_SELLER.flatMap((section) => section.items).find((item) => item.key === 'seller-salary-approvals')).toMatchObject({
      label: 'Salary Approvals',
      to: '/seller/salary-approvals',
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

describe('DASHBOARD_MENU_ADMIN leave items', () => {
  const leaveItems = () => {
    const leaveSection = DASHBOARD_MENU_ADMIN.find((s) => s.title === 'LEAVE MANAGEMENT')
    return leaveSection?.items ?? []
  }

  it('links platform admins to the leave configuration pages', () => {
    const items = leaveItems()

    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-leave-types',
        label: 'Leave Types',
        to: '/super-admin/leave-types',
      }),
    )
    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-leave-policies',
        label: 'Leave Policies',
        to: '/super-admin/leave-policies',
      }),
    )
    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-leave-balances',
        label: 'Leave Balances',
        to: '/super-admin/leave-balances',
      }),
    )
  })

  it('links admins to leave requests, the approval queue and self-service leave', () => {
    const items = leaveItems()

    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-leave-requests',
        label: 'Leave Requests',
        to: '/super-admin/leave-requests',
      }),
    )
    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-leave-approvals',
        label: 'Leave Approvals',
        to: '/super-admin/leave-approvals',
      }),
    )
    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-my-leave',
        label: 'My Leave',
        to: '/super-admin/leave/me',
      }),
    )
  })
})

describe('DASHBOARD_MENU_ADMIN HR organization', () => {
  const hrSectionTitles = [
    'HR MANAGEMENT',
    'TIME & ATTENDANCE',
    'LEAVE MANAGEMENT',
    'PAYROLL & COMPENSATION',
    'PERFORMANCE & BONUSES',
  ]

  const hrSections = () =>
    DASHBOARD_MENU_ADMIN.filter((section) => hrSectionTitles.includes(section.title))

  const systemItems = () =>
    DASHBOARD_MENU_ADMIN.find((s) => s.title === 'SYSTEM')?.items ?? []

  const flattenItems = (
    items: Array<{ key?: string; children?: unknown }>,
  ): Array<{ key?: string }> =>
    items.flatMap((item) => [
      item,
      ...flattenItems((item.children ?? []) as Array<{ key?: string; children?: unknown }>),
    ])

  it('groups all HR navigation into top-level sections outside SYSTEM', () => {
    for (const title of hrSectionTitles) {
      expect(DASHBOARD_MENU_ADMIN.some((section) => section.title === title)).toBe(true)
    }

    expect(systemItems().some((item) => item.key.startsWith('admin-hr-'))).toBe(false)
    expect(hrSections()).toHaveLength(hrSectionTitles.length)

    const hrItems = flattenItems(hrSections().flatMap((section) => section.items))

    // Verify all expected HR items are present under the HR sections
    const expectedKeys = [
      'admin-hr-employees',
      'admin-hr-departments',
      'admin-hr-positions',
      'admin-hr-designations',
      'admin-hr-my-profile',
      'admin-hr-attendance',
      'admin-hr-shifts',
      'admin-hr-shift-schedules',
      'admin-hr-overtime-requests',
      'admin-hr-my-attendance',
      'admin-hr-leave-types',
      'admin-hr-leave-policies',
      'admin-hr-leave-balances',
      'admin-hr-leave-requests',
      'admin-hr-leave-approvals',
      'admin-hr-leave-settings',
      'admin-hr-my-leave',
      'admin-hr-payroll-policies',
      'admin-hr-payroll-runs',
      'admin-hr-payslips',
      'admin-hr-payment-records',
      'admin-hr-my-payslips',
      'admin-hr-perf-cycles',
      'admin-hr-kpis',
      'admin-hr-reviews',
      'admin-hr-bonus-policies',
      'admin-hr-bonus-awards',
      'admin-hr-my-perf',
    ]

    for (const key of expectedKeys) {
      expect(hrItems.some((item) => item.key === key)).toBe(true)
    }
  })
})

describe('DASHBOARD_MENU_ADMIN payroll items', () => {
  const payrollItems = () => {
    const payrollSection = DASHBOARD_MENU_ADMIN.find(
      (s) => s.title === 'PAYROLL & COMPENSATION',
    )
    return payrollSection?.items ?? []
  }

  it('links admins to every payroll page under /super-admin/payroll', () => {
    const items = payrollItems()

    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-payroll-policies',
        label: 'Payroll Policies',
        to: '/super-admin/payroll/policies',
      }),
    )
    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-payroll-runs',
        label: 'Payroll Runs',
        to: '/super-admin/payroll/runs',
      }),
    )
    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-payslips',
        label: 'Payslips',
        to: '/super-admin/payroll/payslips',
      }),
    )
    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-payment-records',
        label: 'Payment Records',
        to: '/super-admin/payroll/payments',
      }),
    )
    expect(items).toContainEqual(
      expect.objectContaining({
        key: 'admin-hr-my-payslips',
        label: 'My Payslips',
        to: '/super-admin/payroll/payslips/me',
      }),
    )
  })

  it('gates each payroll entry with the matching payroll capability', () => {
    const items = payrollItems()
    const capabilityFor = (key: string) => items.find((item) => item.key === key)?.requiredCapabilities

    expect(capabilityFor('admin-hr-payroll-policies')).toEqual([CAPABILITIES.PAYROLL_POLICIES_MANAGE])
    expect(capabilityFor('admin-hr-payroll-runs')).toEqual([CAPABILITIES.PAYROLL_VIEW])
    expect(capabilityFor('admin-hr-payslips')).toEqual([CAPABILITIES.PAYSLIP_VIEW])
    expect(capabilityFor('admin-hr-payment-records')).toEqual([CAPABILITIES.PAYROLL_VIEW])
    expect(capabilityFor('admin-hr-my-payslips')).toEqual([CAPABILITIES.PAYSLIP_VIEW_OWN])
  })
})

describe('DASHBOARD_MENU_PAYROLL', () => {
  const payrollLabels = () =>
    DASHBOARD_MENU_PAYROLL.flatMap((section) => section.items).map((item) => item.label)

  it('gives the payroll area its own run, payslip and payment sections', () => {
    expect(payrollLabels()).toEqual([
      'Payroll Policies',
      'Payroll Runs',
      'Payslips',
      'Payment Records',
      'Performance Cycles',
      'KPIs',
      'Performance Reviews',
      'Bonus Policies',
      'Bonus Awards',
      'My Payslips',
    ])
  })

  it('routes the payroll area to standalone /payroll paths', () => {
    const tos = DASHBOARD_MENU_PAYROLL.flatMap((section) => section.items).map((item) => item.to)

    expect(tos).toEqual([
      '/payroll/policies',
      '/payroll/runs',
      '/payroll/payslips',
      '/payroll/payments',
      '/payroll/performance/cycles',
      '/payroll/performance/kpis',
      '/payroll/performance/reviews',
      '/payroll/performance/bonus-policies',
      '/payroll/performance/bonus-awards',
      '/payroll/payslips/me',
    ])
  })

  it('marks every payroll menu item with area "payroll"', () => {
    for (const section of DASHBOARD_MENU_PAYROLL) {
      for (const item of section.items) {
        expect(item.area).toBe('payroll')
      }
    }
  })
})

describe('DASHBOARD_MENU_EMPLOYEE', () => {
  it('only exposes self-service leave', () => {
    const items = DASHBOARD_MENU_EMPLOYEE.flatMap((section) => section.items)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      key: 'employee-my-leave',
      label: 'My Leave',
      to: '/employee/my-leave',
      area: 'employee',
      requiredCapabilities: [CAPABILITIES.LEAVE_VIEW],
    })
  })

  it('does not load admin data search configs for the employee area', () => {
    expect(getSearchConfigsForArea('employee')).toEqual([])
  })
})
