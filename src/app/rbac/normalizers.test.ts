import { describe, expect, it } from 'vitest'
import type { User } from '@/features/auth/types/authTypes'
import { extractRoleFromUser, extractRolesFromUser } from './normalizers'
import { resolvePostLoginPath } from './navigation'
import { getCapabilitiesForRoles } from './policies'

describe('multi-role access', () => {
  const sellerWarehouseUser: User = {
    id: 'user-1',
    name: 'Warehouse seller',
    email: 'warehouse-seller@example.com',
    role: 'seller',
    roles: [{ code: 'warehouse_manager', name: 'Warehouse Manager' }],
  }

  it('retains warehouse-manager access when the active role is seller', () => {
    const roles = extractRolesFromUser(sellerWarehouseUser)

    expect(roles).toContain('SHOP_ADMIN')
    expect(roles).toContain('WAREHOUSE_MANAGER')
    expect(extractRoleFromUser(sellerWarehouseUser)).toBe('WAREHOUSE_MANAGER')
    expect(getCapabilitiesForRoles(roles)).toContain('warehouse.dashboard.view')
    expect(getCapabilitiesForRoles(roles)).toContain('seller.dashboard.view')
  })

  it('preserves the active seller role when Auth Service reports a warehouse platform role', () => {
    const roles = extractRolesFromUser({
      ...sellerWarehouseUser,
      role: 'warehouse_manager',
      roles: [{ code: 'warehouse_manager', name: 'Warehouse Manager' }],
      active_shop_role: 'seller',
    })

    expect(roles).toContain('WAREHOUSE_MANAGER')
    expect(roles).toContain('SHOP_ADMIN')
    expect(getCapabilitiesForRoles(roles)).toContain('warehouse.dashboard.view')
    expect(getCapabilitiesForRoles(roles)).toContain('seller.dashboard.view')
  })

  it('allows a multi-role user to return to the warehouse dashboard', () => {
    const roles = extractRolesFromUser(sellerWarehouseUser)

    expect(
      resolvePostLoginPath('SHOP_ADMIN', '/warehouse-manager/warehouse', roles),
    ).toBe('/warehouse-manager/warehouse')
  })

  it('preserves access to the seller dashboard for the same account', () => {
    const roles = extractRolesFromUser(sellerWarehouseUser)

    expect(resolvePostLoginPath('WAREHOUSE_MANAGER', '/seller', roles)).toBe('/seller')
  })

  it('treats shop staff memberships as employees for self-service leave', () => {
    const staffUser: User = {
      id: 'user-2',
      name: 'Warehouse Staff',
      email: 'staff@example.com',
      // Auth service reports staff as a normal customer...
      role: 'user',
      staff_shop_ids: ['shop-1'],
    }

    const roles = extractRolesFromUser(staffUser)

    expect(roles).toContain('EMPLOYEE')
    expect(getCapabilitiesForRoles(roles)).toContain('leave.view')
  })

  it('reports a staff alias as EMPLOYEE', () => {
    const roles = extractRolesFromUser({
      id: 'user-3',
      name: 'Shop Staff',
      email: 'shop-staff@example.com',
      role: 'staff',
    })

    expect(roles).toContain('EMPLOYEE')
    expect(getCapabilitiesForRoles(roles)).toContain('leave.view')
  })
})
