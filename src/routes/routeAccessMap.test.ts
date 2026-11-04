import { describe, expect, it } from 'vitest'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { getCapabilitiesForRoles } from '@/app/rbac/policies'
import { ROUTE_ACCESS } from './routeAccessMap'

describe('finance manager report access', () => {
  it('limits AR/AP and inventory valuation routes to finance dashboard access', () => {
    expect(ROUTE_ACCESS.sellerFinanceManagerReports).toEqual([
      CAPABILITIES.FINANCE_DASHBOARD_VIEW,
    ])
    expect(ROUTE_ACCESS.sellerInventoryValuation).toEqual([
      CAPABILITIES.FINANCE_DASHBOARD_VIEW,
    ])
    expect(
      getCapabilitiesForRoles(['SHOP_OWNER']),
    ).not.toContain(CAPABILITIES.FINANCE_DASHBOARD_VIEW)
    expect(
      getCapabilitiesForRoles(['SHOP_ADMIN']),
    ).not.toContain(CAPABILITIES.FINANCE_DASHBOARD_VIEW)
    expect(
      getCapabilitiesForRoles(['FINANCE_MANAGER']),
    ).toContain(CAPABILITIES.FINANCE_DASHBOARD_VIEW)
  })
})
