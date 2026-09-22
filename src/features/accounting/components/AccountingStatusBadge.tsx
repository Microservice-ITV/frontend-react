import type { ReactNode } from 'react'

export type AccountingStatus =
  | 'DRAFT'
  | 'POSTED'
  | 'REVERSED'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'RETURNED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | (string & {})

export const ACCOUNTING_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  POSTED: 'bg-emerald-100 text-emerald-700',
  REVERSED: 'bg-red-100 text-red-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
  WAITING: 'bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  RETURNED: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
}

export const accountingStatusLabel = (status: string) =>
  status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const AccountingStatusBadge = ({ status, children }: { status: string; children?: ReactNode }) => (
  <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${ACCOUNTING_STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
    {children ?? accountingStatusLabel(status)}
  </span>
)

export default AccountingStatusBadge
