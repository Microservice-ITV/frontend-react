import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCheck, RefreshCw, RotateCcw, X } from 'lucide-react'
import { accountingExpensesAdapter } from '@/features/accounting/adapters/accountingExpensesAdapter'
import AccountingStatusBadge from '@/features/accounting/components/AccountingStatusBadge'
import type { PendingApprovalRecord } from '@/features/accounting/types/expenseTypes'

const PlatformPendingApprovalsPage = () => {
  const [approvals, setApprovals] = useState<PendingApprovalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const rows = await accountingExpensesAdapter.listPendingApprovals()
      setApprovals(rows.filter((row) => row.expense.scope === 'PLATFORM' || !row.expense.shopId))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load platform approvals.') } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const decide = async (approval: PendingApprovalRecord, action: 'approve' | 'reject' | 'return') => {
    setWorking(approval.id); setError(null)
    try {
      if (action === 'approve') await accountingExpensesAdapter.approveExpense(approval.expenseId, approval.id)
      if (action === 'reject') await accountingExpensesAdapter.rejectExpense(approval.expenseId, approval.id, 'Rejected from platform approvals')
      if (action === 'return') await accountingExpensesAdapter.returnExpense(approval.expenseId, approval.id, 'Please correct this platform expense')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to complete approval action.') } finally { setWorking(null) }
  }

  return <section className="space-y-6"><nav className="text-xs text-slate-500"><Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link><span className="mx-1">/</span><span>Accounting</span><span className="mx-1">/</span><span className="text-slate-900">Pending Approvals</span></nav><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><CheckCheck size={22} className="text-amber-600" />Platform Pending Approvals</h1><p className="mt-1 text-sm text-slate-600">Review platform expenses assigned to your approval step.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</button></div>{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-225"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Expense</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Category</th><th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Amount</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Step</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Actions</th></tr></thead><tbody>{loading && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">Loading approvals...</td></tr>}{!loading && approvals.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">No platform approvals are waiting for you.</td></tr>}{!loading && approvals.map((approval) => <tr key={approval.id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3"><Link to={`/super-admin/accounting/platform-expenses/${encodeURIComponent(approval.expense.expenseNo)}`} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">{approval.expense.expenseNo}</Link><p className="mt-1 max-w-xs truncate text-xs text-slate-500">{approval.expense.description || 'No description'}</p></td><td className="px-4 py-3 text-xs text-slate-600">{new Date(approval.expense.expenseDate).toLocaleDateString()}</td><td className="px-4 py-3 text-xs text-slate-600">{approval.expense.expenseType?.name ?? approval.expense.expenseTypeId}</td><td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">{approval.expense.currency} {Number(approval.expense.amount).toLocaleString()}</td><td className="px-4 py-3 text-xs text-slate-600">Step {approval.stepNo}</td><td className="px-4 py-3"><AccountingStatusBadge status={approval.status} /></td><td className="px-4 py-3"><div className="flex gap-1.5"><button type="button" disabled={working === approval.id} onClick={() => void decide(approval, 'return')} className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 disabled:opacity-50"><RotateCcw size={12} />Return</button><button type="button" disabled={working === approval.id} onClick={() => void decide(approval, 'reject')} className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1.5 text-[11px] font-semibold text-red-700 disabled:opacity-50"><X size={12} />Reject</button><button type="button" disabled={working === approval.id} onClick={() => void decide(approval, 'approve')} className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"><Check size={12} />Approve</button></div></td></tr>)}</tbody></table></div></div></section>
}

export default PlatformPendingApprovalsPage
