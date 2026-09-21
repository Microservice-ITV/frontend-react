import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock3, ReceiptText } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import AccountingStatusBadge from '../components/AccountingStatusBadge'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import type { AccountingExpense, ExpenseApprovalSummary } from '../types/expenseTypes'

const errorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response
    if (typeof response?.data?.error === 'string') return response.data.error
  }
  return error instanceof Error ? error.message : 'Unable to load expense.'
}
const errorStatus = (error: unknown): number | null => {
  if (error && typeof error === 'object' && 'response' in error) {
    const status = (error as { response?: { status?: unknown } }).response?.status
    return typeof status === 'number' ? status : null
  }
  return null
}

const SellerExpenseDetailPage = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const actorUserId = useAppSelector((state) => state.auth.user?.id)
  const [expense, setExpense] = useState<AccountingExpense | null>(null)
  const [approvals, setApprovals] = useState<ExpenseApprovalSummary[]>([])
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [httpStatus, setHttpStatus] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!expenseId) {
      setStatus('failed')
      setError('Expense reference is missing.')
      return
    }
    setStatus('loading')
    setError(null)
    setHttpStatus(null)
    try {
      const loaded = await accountingExpensesAdapter.getByReference(expenseId)
      setExpense(loaded)
      setStatus('succeeded')
    } catch (cause) {
      setStatus('failed')
      setHttpStatus(errorStatus(cause))
      setError(errorMessage(cause))
    }
  }

  useEffect(() => { void load() }, [expenseId])

  const submitForApproval = async () => {
    if (!expense || expense.status !== 'DRAFT') return
    setSubmitting(true)
    setError(null)
    try {
      const result = await accountingExpensesAdapter.submit(expense.id, actorUserId)
      setExpense((previous) => previous ? { ...previous, status: result.status, submittedAt: new Date().toISOString() } : previous)
      setApprovals(result.approvals)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <Link to="/seller/accounting/expenses" className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"><ArrowLeft size={15} />Back to expenses</Link>
      {status === 'loading' && <p className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">Loading expense...</p>}
      {status === 'failed' && <div className="rounded-xl border border-red-200 bg-red-50 p-6"><h1 className="text-lg font-bold text-red-900">{httpStatus === 404 ? 'Expense not found' : 'Unable to load expense'}</h1><p className="mt-1 text-sm text-red-700">{error ?? 'The accounting service could not load this expense.'}</p></div>}
      {status === 'succeeded' && expense && <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><ReceiptText size={22} className="text-orange-600" />{expense.expenseNo}</h1><p className="mt-1 text-sm text-slate-600">Shop expense detail and approval status.</p></div><div className="flex items-center gap-2"><AccountingStatusBadge status={expense.status} />{expense.status === 'DRAFT' && <button type="button" onClick={() => void submitForApproval()} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 size={15} />{submitting ? 'Submitting...' : 'Submit for Approval'}</button>}</div></div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-6 xl:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 xl:col-span-2"><h2 className="text-base font-bold text-slate-900">Expense details</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Detail label="Amount" value={`${expense.currency} ${Number(expense.amount).toLocaleString()}`} /><Detail label="Category ID" value={expense.expenseTypeId} /><Detail label="Shop ID" value={expense.shopId ?? '—'} /><Detail label="Expense date" value={new Date(expense.expenseDate).toLocaleDateString()} /><Detail label="Description" value={expense.description ?? '—'} /><Detail label="Created" value={new Date(expense.createdAt).toLocaleString()} /></dl></div><div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"><div className="flex items-center gap-2"><Clock3 size={17} className="text-slate-500" /><h2 className="text-base font-bold text-slate-900">Approval</h2></div>{approvals.length === 0 ? <p className="mt-4 text-sm text-slate-500">No approval steps have been returned.</p> : <div className="mt-4 space-y-3">{approvals.map((approval) => <div key={approval.id} className="rounded-lg bg-slate-50 p-3"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">Step {approval.stepNo}</span><span className="text-[10px] font-medium text-slate-500">{approval.status}</span></div><p className="mt-1 text-xs text-slate-500">Approver: {approval.approverUserId ?? 'Unassigned'}</p></div>)}</div>}</div></div>
      </>}
    </section>
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd></div>

export default SellerExpenseDetailPage
