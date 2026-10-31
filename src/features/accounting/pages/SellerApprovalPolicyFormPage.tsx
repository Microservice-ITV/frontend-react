import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, Save } from 'lucide-react'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import { useApprovalPolicyShopContext } from '../hooks/useApprovalPolicyShopContext'
import type { ApprovalPolicy, ApprovalPolicyInput } from '../types/expenseTypes'

const errorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response
    if (typeof response?.data?.error === 'string') return response.data.error
  }
  return error instanceof Error ? error.message : 'Unable to save approval policy.'
}

const SellerApprovalPolicyFormPage = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { policyId } = useParams<{ policyId: string }>()
  const navigate = useNavigate()
  const { shops, shopId, setShopId, selectedShop, status: shopStatus, error: shopError } = useApprovalPolicyShopContext()
  const [value, setValue] = useState({ name: '', minAmount: '', maxAmount: '', unlimited: true, level: '1', isActive: true })
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (shopStatus === 'loading') return () => { active = false }
    if (shopStatus === 'failed') {
      setStatus('failed')
      setError(shopError ?? 'Unable to load your current shop context.')
      return () => { active = false }
    }
    if (!shopId) {
      setStatus('ready')
      return () => { active = false }
    }
    if (!policyId) {
      setStatus('ready')
      return () => { active = false }
    }

    setStatus('loading')
    setError(null)
    void accountingExpensesAdapter.getApprovalPolicy(policyId, shopId).then((policy) => {
      if (!active) return
      setValue({
        name: policy.name,
        minAmount: policy.minAmount,
        maxAmount: policy.maxAmount ?? '',
        unlimited: policy.maxAmount === null,
        level: String(policy.level),
        isActive: policy.isActive,
      })
      setStatus('ready')
    }).catch((cause: unknown) => {
      if (active) {
        setStatus('failed')
        setError(errorMessage(cause))
      }
    })
    return () => { active = false }
  }, [policyId, shopId, shopStatus, shopError])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    const minAmount = Number(value.minAmount)
    const maxAmount = value.unlimited ? null : Number(value.maxAmount)
    const level = Number(value.level)

    if (!value.name.trim()) return setError('Policy name is required.')
    if (!Number.isFinite(minAmount) || minAmount < 0) return setError('Minimum amount must be non-negative.')
    if (!value.unlimited && (!Number.isFinite(maxAmount) || maxAmount! < minAmount)) return setError('Maximum amount must be greater than or equal to minimum amount.')
    if (!Number.isInteger(level) || level < 1) return setError('Approval level must be a positive integer.')
    if (shopStatus !== 'succeeded' || !selectedShop) return setError('Select a valid active shop before saving this policy.')

    const payload: ApprovalPolicyInput = { shopId, name: value.name.trim(), minAmount, maxAmount, level, isActive: value.isActive }
    setStatus('saving')
    try {
      if (policyId) await accountingExpensesAdapter.updateApprovalPolicy(policyId, payload)
      else await accountingExpensesAdapter.createApprovalPolicy(payload)
      navigate('/seller/accounting/approval-policies')
    } catch (cause) {
      setStatus('ready')
      setError(errorMessage(cause))
    }
  }

  return (
    <section className="space-y-6">
      <Link to="/seller/accounting/approval-policies" className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"><ArrowDown size={15} className="rotate-90" />Back to policies</Link>
      <div><h1 className="text-xl font-bold text-slate-900">{readOnly ? 'Approval Policy Details' : policyId ? 'Edit Approval Policy' : 'Create Approval Policy'}</h1><p className="mt-1 text-sm text-slate-600">Define the approval level required for a shop expense amount range.</p></div>
      {(error || shopError) && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error ?? shopError}</p>}
      {(status === 'loading' || shopStatus === 'loading') && <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading policy configuration...</p>}
      {shopStatus === 'succeeded' && shops.length === 0 && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">No active shop membership is available for approval policies.</p>}
      {shopStatus === 'succeeded' && shops.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="approval-policy-shop" className="text-sm font-medium text-slate-700">Current shop</label>
          {shops.length > 1 ? (
            <select id="approval-policy-shop" value={shopId} onChange={(event) => setShopId(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
              <option value="">Select a shop</option>
              {shops.map((shop) => <option key={shop.shop_id} value={shop.shop_id}>{shop.shop_name}</option>)}
            </select>
          ) : <span className="text-sm font-semibold text-slate-900">{selectedShop?.shop_name}</span>}
        </div>
      )}
      {status !== 'loading' && shopStatus === 'succeeded' && shops.length > 0 && <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        {readOnly && <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2"><Summary label="Status" value={value.isActive ? 'Active' : 'Inactive'} /><Summary label="Amount Range" value={`${value.minAmount || '0'} - ${value.unlimited ? 'No maximum' : value.maxAmount}`} /><Summary label="Approval Level" value={value.level} /></div>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Policy Name"><input disabled={readOnly} value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} className={inputClass} /></Field>
          <Field label="Approval Level"><input disabled={readOnly} type="number" min="1" value={value.level} onChange={(event) => setValue({ ...value, level: event.target.value })} className={inputClass} /></Field>
          <Field label="Minimum Amount"><input disabled={readOnly} type="number" min="0" value={value.minAmount} onChange={(event) => setValue({ ...value, minAmount: event.target.value })} className={inputClass} /></Field>
          <Field label="Maximum Amount"><div className="flex gap-2"><input disabled={readOnly || value.unlimited} type="number" min="0" value={value.maxAmount} onChange={(event) => setValue({ ...value, maxAmount: event.target.value })} className={`${inputClass} flex-1`} /><label className="flex items-center gap-2 whitespace-nowrap text-sm font-normal"><input disabled={readOnly} type="checkbox" checked={value.unlimited} onChange={(event) => setValue({ ...value, unlimited: event.target.checked })} />No maximum</label></div></Field>
        </div>
        {!readOnly && <div className="flex justify-end gap-2 border-t border-slate-100 pt-5"><Link to="/seller/accounting/approval-policies" className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</Link><button type="submit" disabled={status === 'saving' || !shopId} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><Save size={15} />{status === 'saving' ? 'Saving...' : 'Save Policy'}</button></div>}
      </form>}
    </section>
  )
}

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50'
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block text-sm font-medium text-slate-700"><span>{label}</span><span className="mt-1.5 block">{children}</span></label>
const Summary = ({ label, value }: { label: string; value: string }) => <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd></div>

export default SellerApprovalPolicyFormPage
