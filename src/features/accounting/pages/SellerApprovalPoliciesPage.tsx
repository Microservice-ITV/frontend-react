import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Eye, Plus, RefreshCw, Settings2, Trash2, XCircle } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { authClient } from '@/lib/api/authClient'
import AccountingStatusBadge from '../components/AccountingStatusBadge'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import type { ApprovalPolicy } from '../types/expenseTypes'

type Shop = { shop_id?: string | null; shop_name?: string | null; role?: { code?: string | null } | null }
type AccessContextResponse = { data?: { access_context?: { active_shop?: { shop_id?: string | null }; shops?: Shop[] } } }

const errorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response
    if (typeof response?.data?.error === 'string') return response.data.error
  }
  return error instanceof Error ? error.message : 'Unable to load approval policies.'
}

const SellerApprovalPoliciesPage = () => {
  const authUser = useAppSelector((state) => state.auth.user)
  const [shops, setShops] = useState<Shop[]>([])
  const [shopId, setShopId] = useState(authUser?.active_shop_id ?? '')
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([])
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!shopId) return
    setStatus('loading')
    setError(null)
    try {
      setPolicies(await accountingExpensesAdapter.listApprovalPolicies(shopId))
      setStatus('succeeded')
    } catch (cause) {
      setStatus('failed')
      setError(errorMessage(cause))
    }
  }

  useEffect(() => {
    let active = true
    void authClient.get<AccessContextResponse>('/me/access-context').then((response) => {
      if (!active) return
      const context = response.data.data?.access_context
      const availableShops = context?.shops ?? []
      setShops(availableShops)
      setShopId((current) => current || context?.active_shop?.shop_id || availableShops[0]?.shop_id || '')
    }).catch((cause) => {
      if (active) setError(errorMessage(cause))
    })
    return () => { active = false }
  }, [authUser?.id])

  useEffect(() => { void load() }, [shopId])

  const toggle = async (policy: ApprovalPolicy) => {
    const action = policy.isActive ? 'deactivate' : 'activate'
    if (!window.confirm(`Are you sure you want to ${action} "${policy.name}"?`)) return

    try {
      await accountingExpensesAdapter.setApprovalPolicyActive(policy.id, shopId, !policy.isActive)
      await load()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  const remove = async (policy: ApprovalPolicy) => {
    if (policy.isActive) return
    if (!window.confirm(`Delete approval policy "${policy.name}"? This cannot be undone.`)) return

    try {
      await accountingExpensesAdapter.deleteApprovalPolicy(policy.id, shopId)
      await load()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Settings2 size={22} className="text-emerald-600" />Approval Policies</h1>
          <p className="mt-1 text-sm text-slate-600">Configure the approval rules used when your shop expenses are submitted.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} disabled={status === 'loading' || !shopId} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} />Refresh</button>
          <Link to="/seller/accounting/approval-policies/new" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"><Plus size={16} />Create Policy</Link>
        </div>
      </div>

      {shops.length > 1 && <label className="block max-w-md text-sm font-medium text-slate-700">Shop<select value={shopId} onChange={(event) => setShopId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Select a shop</option>{shops.map((shop) => <option key={shop.shop_id} value={shop.shop_id ?? ''}>{shop.shop_name ?? shop.shop_id}</option>)}</select></label>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto"><table className="w-full min-w-250"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Policy</th><th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Minimum</th><th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Maximum</th><th className="px-4 py-3 text-center text-xs font-medium text-slate-600">Level</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Actions</th></tr></thead><tbody>
          {status === 'loading' && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">Loading policies...</td></tr>}
          {status === 'succeeded' && policies.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">No approval policies configured for this shop.</td></tr>}
          {status === 'succeeded' && policies.map((policy) => <tr key={policy.id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3 text-sm font-semibold text-slate-900">{policy.name}</td><td className="px-4 py-3 text-right text-sm text-slate-600">{Number(policy.minAmount).toLocaleString()}</td><td className="px-4 py-3 text-right text-sm text-slate-600">{policy.maxAmount === null ? 'No maximum' : Number(policy.maxAmount).toLocaleString()}</td><td className="px-4 py-3 text-center text-sm text-slate-600">{policy.level}</td><td className="px-4 py-3"><AccountingStatusBadge status={policy.isActive ? 'ACTIVE' : 'INACTIVE'} /></td><td className="px-4 py-3"><div className="flex items-center gap-3 text-xs"><Link to={`/seller/accounting/approval-policies/${policy.id}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"><Eye size={13} />View</Link><Link to={`/seller/accounting/approval-policies/${policy.id}/edit`} className="text-emerald-700 hover:text-emerald-800">Edit</Link><button type="button" onClick={() => void toggle(policy)} className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800">{policy.isActive ? <XCircle size={13} /> : <CheckCircle2 size={13} />}{policy.isActive ? 'Deactivate' : 'Activate'}</button>{!policy.isActive && <button type="button" title="Delete policy" onClick={() => void remove(policy)} className="inline-flex items-center gap-1 text-red-700 hover:text-red-800"><Trash2 size={13} />Delete</button>}</div></td></tr>)}
        </tbody></table></div>
      </div>
    </section>
  )
}

export default SellerApprovalPoliciesPage
