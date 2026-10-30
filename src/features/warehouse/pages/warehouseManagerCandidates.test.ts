import { describe, expect, it } from 'vitest'
import type { AdminUserDto } from '@/features/admin/api/adminUsersApi'
import { isAssignableWarehouseManagerCandidate } from './warehouseManagerCandidates'

const user = (overrides: Partial<AdminUserDto> = {}): AdminUserDto => ({
  id: 'user-1',
  name: 'User',
  email: 'user@example.test',
  email_verified_at: null,
  created_at: null,
  has_shop_membership: false,
  roles: [{ id: 'role-user', code: 'user', name: 'User', scope: 'platform' }],
  ...overrides,
})

describe('isAssignableWarehouseManagerCandidate', () => {
  it('allows a seller with an existing shop membership to receive the platform role', () => {
    expect(
      isAssignableWarehouseManagerCandidate(
        user({
          has_shop_membership: true,
          roles: [],
        }),
      ),
    ).toBe(true)
  })

  it('keeps users with unrelated platform roles out of the assignment list', () => {
    expect(
      isAssignableWarehouseManagerCandidate(
        user({
          roles: [{ id: 'role-admin', code: 'admin', name: 'Admin', scope: 'platform' }],
        }),
      ),
    ).toBe(false)
  })

  it('continues to include users already assigned as warehouse managers', () => {
    expect(
      isAssignableWarehouseManagerCandidate(
        user({
          roles: [
            { id: 'role-user', code: 'user', name: 'User', scope: 'platform' },
            {
              id: 'role-manager',
              code: 'warehouse_manager',
              name: 'Warehouse Manager',
              scope: 'platform',
            },
          ],
        }),
      ),
    ).toBe(true)
  })
})
