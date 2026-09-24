import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock3, ReceiptText, Undo2, XCircle } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { authClient } from '@/lib/api/authClient'
import AccountingStatusBadge from '../components/AccountingStatusBadge'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import { compressReceiptFile } from '../utils/receiptImage'
import type {
  AccountingExpense,
  ExpenseActionResponse,
  ExpenseApprovalStatusResponse,
  ExpenseApprovalSummary,
} from '../types/expenseTypes'

const errorMessage = (error: unknown, fallback = 'Unable to load expense.') => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response
    if (typeof response?.data?.error === 'string') return response.data.error
  }
  return error instanceof Error ? error.message : fallback
}

const errorStatus = (error: unknown): number | null => {
  if (error && typeof error === 'object' && 'response' in error) {
    const status = (error as { response?: { status?: unknown } }).response?.status
    return typeof status === 'number' ? status : null
  }
  return null
}

const approvalStatusLabel = (approval: ExpenseApprovalSummary) =>
  approval.action === 'RETURNED' ? 'RETURNED' : approval.status

const normalizeShopId = (value: string) => value.trim().toLowerCase()

type AccessContextResponse = {
  data?: {
    access_context?: {
      shops?: Array<{
        shop_id?: string | null
        shop_name?: string | null
      }>
    }
  }
}

type ShopUsersResponse = {
  data?: {
    shop_id?: string
    users?: Array<{
      user?: {
        id?: string | null
        name?: string | null
      } | null
    }>
  }
}

type ActionKind = 'approve' | 'reject' | 'return'

const SellerExpenseDetailPage = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const actorUserId = useAppSelector((state) => state.auth.user?.id)
  const [expense, setExpense] = useState<AccountingExpense | null>(null)
  const [shopNames, setShopNames] = useState<Record<string, string>>({})
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [approvals, setApprovals] = useState<ExpenseApprovalSummary[]>([])
  const [approvalStatus, setApprovalStatus] = useState<ExpenseApprovalStatusResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [httpStatus, setHttpStatus] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState<Record<ActionKind, boolean>>({
    approve: false,
    reject: false,
    return: false,
  })
  const [note, setNote] = useState('')
  const [editingReturned, setEditingReturned] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editReceipt, setEditReceipt] = useState('')

  const currentApproval = useMemo(
    () => approvals.find((approval) => approval.status === 'PENDING') ?? null,
    [approvals],
  )

  const isCurrentApprover = Boolean(
    currentApproval && actorUserId && currentApproval.approverUserId === actorUserId,
  )
  const isExpenseCreator = Boolean(expense?.sellerUserId && actorUserId === expense.sellerUserId)

  const loadApprovalStatus = async (targetExpenseId: string) => {
    try {
      const response = await accountingExpensesAdapter.getApprovalStatus(targetExpenseId)
      setApprovalStatus(response)
      setApprovals(response.approvals)
    } catch (cause) {
      setApprovalStatus(null)
      setApprovals([])
      if (errorStatus(cause) !== 404) {
        setError(errorMessage(cause))
      }
    }
  }

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
      const [loaded, accessContextResponse] = await Promise.all([
        accountingExpensesAdapter.getByReference(expenseId),
        authClient.get<AccessContextResponse>('/me/access-context').catch(() => null),
      ])

      setShopNames(
        Object.fromEntries(
          (accessContextResponse?.data?.data?.access_context?.shops ?? []).flatMap((shop) => {
            return shop.shop_id && shop.shop_name
              ? [[normalizeShopId(shop.shop_id), shop.shop_name]]
              : []
          }),
        ),
      )

      if (loaded.shopId) {
        const shopUsersResponse = await authClient
          .get<ShopUsersResponse>(`/shops/${encodeURIComponent(loaded.shopId)}/users`)
          .catch(() => null)

        setUserNames(
          Object.fromEntries(
            (shopUsersResponse?.data?.data?.users ?? []).flatMap((shopUser) => {
              const userId = shopUser.user?.id
              const userName = shopUser.user?.name?.trim()
              return userId && userName ? [[userId, userName]] : []
            }),
          ),
        )
      } else {
        setUserNames({})
      }

      setExpense(loaded)
      setEditAmount(String(loaded.amount))
      setEditDescription(loaded.description ?? '')
      setEditDate(loaded.expenseDate.slice(0, 10))
      setEditReceipt(loaded.receiptImage ?? '')
      setStatus('succeeded')

      if (['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RETURNED'].includes(loaded.status)) {
        await loadApprovalStatus(loaded.id)
      } else {
        setApprovalStatus(null)
        setApprovals([])
      }
    } catch (cause) {
      setStatus('failed')
      setHttpStatus(errorStatus(cause))
      setError(errorMessage(cause))
    }
  }

  const approverName = (approverUserId: string | null) =>
    approverUserId ? (userNames[approverUserId] ?? 'Manager') : 'Unassigned'

  useEffect(() => {
    void load()
  }, [expenseId])

  const submitForApproval = async () => {
    if (!expense || expense.status !== 'DRAFT') return
    setSubmitting((prev) => ({ ...prev, approve: true }))
    setError(null)

    try {
      await accountingExpensesAdapter.submit(expense.id, actorUserId)
      await load()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSubmitting((prev) => ({ ...prev, approve: false }))
    }
  }

  const handleAction = async (kind: ActionKind) => {
    if (!expense || !currentApproval) return
    if (!isCurrentApprover) {
      setError('You are not the current approver for this step.')
      return
    }

    if ((kind === 'reject' || kind === 'return') && !note.trim()) {
      setError(`Add a note before you ${kind} this expense.`)
      return
    }

    setSubmitting((prev) => ({ ...prev, [kind]: true }))
    setError(null)

    try {
      let result: ExpenseActionResponse

      if (kind === 'approve') {
        const comment = note.trim()
        result = comment
          ? await accountingExpensesAdapter.approveExpense(expense.id, currentApproval.id, comment)
          : await accountingExpensesAdapter.approveExpense(expense.id, currentApproval.id)
      } else if (kind === 'reject') {
        result = await accountingExpensesAdapter.rejectExpense(expense.id, currentApproval.id, note.trim())
      } else {
        result = await accountingExpensesAdapter.returnExpense(expense.id, currentApproval.id, note.trim())
      }

      if (result.expenseStatus) {
        setExpense((prev) =>
          prev ? { ...prev, status: result.expenseStatus as AccountingExpense['status'] } : prev,
        )
      }

      await load()
      setNote('')
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSubmitting((prev) => ({ ...prev, [kind]: false }))
    }
  }

  const saveReturnedExpense = async () => {
    if (!expense) return
    setError(null)
    try {
      await accountingExpensesAdapter.updateReturned(expense.id, {
        shopId: expense.shopId ?? '', amount: Number(editAmount), expenseDate: editDate,
        expenseCategoryId: expense.expenseTypeId, expenseAccountCode: '', fundingAccountCode: '',
        description: editDescription.trim() || undefined, receiptImage: editReceipt || undefined,
      })
      setEditingReturned(false)
      await load()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <section className="space-y-6">
      <Link
        to="/seller/accounting/expenses"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={15} />
        Back to expenses
      </Link>

      {status === 'loading' && (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Loading expense...
        </p>
      )}

      {status === 'failed' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-bold text-red-900">
            {httpStatus === 404 ? 'Expense not found' : 'Unable to load expense'}
          </h1>
          <p className="mt-1 text-sm text-red-700">
            {error ?? 'The accounting service could not load this expense.'}
          </p>
        </div>
      )}

      {status === 'succeeded' && expense && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <ReceiptText size={22} className="text-orange-600" />
                {expense.expenseNo}
              </h1>
              <p className="mt-1 text-sm text-slate-600">Shop expense detail and approval status.</p>
            </div>

            <div className="flex items-center gap-2">
              <AccountingStatusBadge status={expense.status} />
              {expense.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => void submitForApproval()}
                  disabled={submitting.approve}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  {submitting.approve ? 'Submitting...' : 'Submit for Approval'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {expense.receiptImage && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Receipt image</h2>
              <img src={expense.receiptImage} alt="Expense receipt" className="mt-3 max-h-96 w-full rounded-lg border border-slate-100 bg-slate-50 object-contain" />
            </div>
          )}

          {expense.status === 'RETURNED' && isExpenseCreator && !editingReturned && (
            <button type="button" onClick={() => setEditingReturned(true)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Edit and resubmit</button>
          )}

          {expense.status === 'RETURNED' && isExpenseCreator && editingReturned && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h2 className="text-base font-bold text-slate-900">Correct expense</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input type="number" value={editAmount} onChange={(event) => setEditAmount(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input value={editDescription} onChange={(event) => setEditDescription(event.target.value)} placeholder="Description" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-3 text-sm" onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                try {
                  const compressed = await compressReceiptFile(file)
                  setEditReceipt(compressed)
                } catch (cause) {
                  setError(errorMessage(cause, 'Unable to process receipt image.'))
                }
              }} />
              <div className="mt-3 flex gap-2"><button type="button" onClick={() => void saveReturnedExpense()} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">Save changes</button><button type="button" onClick={() => setEditingReturned(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600">Cancel</button></div>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 xl:col-span-2">
              <h2 className="text-base font-bold text-slate-900">Expense details</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail label="Expense No" value={expense.expenseNo} />
                <Detail label="Shop" value={expense.shopId ? (shopNames[normalizeShopId(expense.shopId)] ?? expense.shopId) : '—'} />
                <Detail label="Amount" value={Number(expense.amount).toLocaleString()} />
                <Detail label="Currency" value={expense.currency} />
                <Detail label="Category" value={expense.expenseType?.name ?? expense.expenseTypeId} />
                <Detail label="Description" value={expense.description ?? '—'} />
                <Detail label="Expense date" value={new Date(expense.expenseDate).toLocaleDateString()} />
                <Detail label="Status" value={expense.status} />
                <Detail label="Created at" value={new Date(expense.createdAt).toLocaleString()} />
                <Detail label="Submitted at" value={expense.submittedAt ? new Date(expense.submittedAt).toLocaleString() : '—'} />
              </dl>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <Clock3 size={17} className="text-slate-500" />
                  <h2 className="text-base font-bold text-slate-900">Approval</h2>
                </div>

                {approvals.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No approval steps have been returned.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {approvals.map((approval) => (
                      <div key={approval.id} className="rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">Step {approval.stepNo}</span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {approvalStatusLabel(approval)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-700">
                          {approverName(approval.approverUserId)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Manager</p>
                        {approval.comment && (
                          <p className="mt-2 rounded bg-white px-2 py-1 text-xs text-slate-600">
                            Note: {approval.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {currentApproval && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                  <h3 className="text-sm font-bold text-slate-900">Current approver action</h3>
                  <p className="mt-2 text-xs text-slate-600">
                    Step {currentApproval.stepNo} is pending for manager {approverName(currentApproval.approverUserId)}.
                  </p>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Add a note for the expense creator" className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

                  {isCurrentApprover ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAction('approve')}
                        disabled={submitting.approve || submitting.reject || submitting.return}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} />
                        {submitting.approve ? 'Approving...' : 'Approve'}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleAction('reject')}
                        disabled={submitting.approve || submitting.reject || submitting.return}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle size={15} />
                        {submitting.reject ? 'Rejecting...' : 'Reject'}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleAction('return')}
                        disabled={submitting.approve || submitting.reject || submitting.return}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        <Undo2 size={15} />
                        {submitting.return ? 'Returning...' : 'Return'}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      This action is waiting on the assigned approver.
                    </p>
                  )}
                </div>
              )}

              {expense.journalEntry && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                  <h2 className="text-base font-bold text-slate-900">Journal entry</h2>
                  <p className="mt-3 text-sm text-slate-600">
                    {expense.journalEntry.narration || 'No narration provided.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
  </div>
)

export default SellerExpenseDetailPage
