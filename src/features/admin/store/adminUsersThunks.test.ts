import { describe, expect, it } from 'vitest'
import { mapAdminUserRoles } from './adminUsersThunks'

describe('admin user role mapping', () => {
  it('preserves platform and self roles and deduplicates only identical shop assignments', () => {
    const roles = mapAdminUserRoles([
      { id: 'super', code: 'super_admin', name: 'Super Admin', scope: 'platform' },
      { id: 'user', code: 'user', name: 'User', scope: 'self' },
      { id: 'owner-role', code: 'shop_owner', name: 'Shop Owner', scope: 'shop', shop_id: 'shop-a', shop_name: 'Shop A' },
      { id: 'owner-role', code: 'shop_owner', name: 'Shop Owner', scope: 'shop', shop_id: 'shop-a', shop_name: 'Shop A' },
      { id: 'owner-role', code: 'shop_owner', name: 'Shop Owner', scope: 'shop', shop_id: 'shop-b', shop_name: 'Shop B' },
      { id: 'admin-role', code: 'shop_admin', name: 'Shop Admin', scope: 'shop', shop_id: 'shop-c', shop_name: 'Shop C' },
    ])

    expect(roles.map((role) => role.name)).toEqual([
      'Super Admin', 'User', 'Shop Owner', 'Shop Owner', 'Shop Admin',
    ])
    expect(roles.filter((role) => role.shopId).map((role) => role.shopName)).toEqual([
      'Shop A', 'Shop B', 'Shop C',
    ])
  })

  it('preserves regular users and handles an empty role list', () => {
    expect(mapAdminUserRoles([{ id: 'user', code: 'user', name: 'User', scope: 'self' }])).toMatchObject([
      { code: 'user', name: 'User', scope: 'self' },
    ])
    expect(mapAdminUserRoles()).toEqual([])
  })
})
