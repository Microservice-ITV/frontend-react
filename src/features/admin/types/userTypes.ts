// ─── Row shape (view model used in the UI) ──────────────────────────────────

export type AdminUserRoleChip = {
  id: string
  code: string
  name: string
  scope: string
}

export type AdminUserRow = {
  id: string
  name: string
  email: string
  /** true when email_verified_at is non-null */
  isVerified: boolean
  roles: AdminUserRoleChip[]
  /** Human-readable join date, e.g. "Sep 14, 2026" */
  created: string
}

// ─── Redux state shape ───────────────────────────────────────────────────────

export type AdminUsersState = {
  users: AdminUserRow[]
  total: number
  lastPage: number
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

// ─── Shop-role assignment view models (Manage Roles tool) ────────────────────

/** Shared status for on-demand lookups that are not kept in Redux. */
export type AdminLookupStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

/** One shop-role assignment held by the selected user. */
export type AdminUserShopRoleRow = {
  shopId: string
  shopName: string
  shopDomain: string | null
  roleCode: string
  roleName: string
  status: string
  joined: string
}
