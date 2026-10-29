export type LeaveAreaBase = '/super-admin'

export const leavePaths = (base: LeaveAreaBase) => ({
  base,
  types: `${base}/leave-types`,
  policies: `${base}/leave-policies`,
  balances: `${base}/leave-balances`,
  requests: `${base}/leave-requests`,
  approvals: `${base}/leave-approvals`,
  myLeave: `${base}/leave/me`,
})

export type LeavePaths = ReturnType<typeof leavePaths>
