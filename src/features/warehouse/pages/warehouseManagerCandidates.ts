import type { AdminUserDto } from '@/features/admin/api/adminUsersApi'

const VISIBLE_ROLE_CODES = new Set(['user', 'warehouse_manager'])

export const isAssignableWarehouseManagerCandidate = (user: AdminUserDto) =>
  user.roles.some((role) => role.code === 'warehouse_manager') ||
  (user.roles.every((role) => VISIBLE_ROLE_CODES.has(role.code)) &&
    (user.roles.length > 0 || user.has_shop_membership === true))
