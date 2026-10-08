import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleDollarSign, Pencil, Plus, RefreshCw } from 'lucide-react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import {
  adminDeliveryProviderFeeApi,
  getDeliveryProviderFeeApiErrorMessage,
  type DeliveryChargingBasis,
  type DeliveryProviderFeePayload,
  type DeliveryProviderFeeRule,
  type DeliveryProviderOption,
} from '../api/adminDeliveryProviderFeeApi'

type FeeRuleDraft = {
  providerId: string
  chargingBasis: DeliveryChargingBasis
  amount: string
  currency: string
  active: boolean
  effectiveFrom: string
  effectiveTo: string
}

const inputClassName = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50'

function toLocalDateTime(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toDraft(rule?: DeliveryProviderFeeRule): FeeRuleDraft {
  return rule
    ? {
        providerId: rule.providerId,
        chargingBasis: rule.chargingBasis,
        amount: rule.amount,
        currency: rule.currency,
        active: rule.active,
        effectiveFrom: toLocalDateTime(rule.effectiveFrom),
        effectiveTo: toLocalDateTime(rule.effectiveTo),
      }
    : {
        providerId: '',
        chargingBasis: 'PER_ORDER',
        amount: '',
        currency: 'MMK',
        active: true,
        effectiveFrom: toLocalDateTime(new Date().toISOString()),
        effectiveTo: '',
      }
}

function validateDraft(draft: FeeRuleDraft): string | null {
  if (!draft.providerId) return 'Select a delivery provider.'
  if (!/^\d+(?:\.\d{1,2})?$/.test(draft.amount.trim()) || Number(draft.amount) <= 0) {
    return 'Fee Amount must be greater than 0 and have no more than 2 decimal places.'
  }
  if (!/^[A-Za-z]{3}$/.test(draft.currency.trim())) return 'Currency must be a 3-letter code.'
  if (!draft.effectiveFrom || Number.isNaN(new Date(draft.effectiveFrom).getTime())) {
    return 'Effective From is required.'
  }
  if (draft.effectiveTo) {
    const from = new Date(draft.effectiveFrom).getTime()
    const to = new Date(draft.effectiveTo).getTime()
    if (Number.isNaN(to) || to < from) return 'Effective To must be greater than or equal to Effective From.'
  }
  return null
}

function toPayload(draft: FeeRuleDraft): DeliveryProviderFeePayload {
  return {
    providerId: draft.providerId,
    chargingBasis: draft.chargingBasis,
    amount: draft.amount.trim(),
    currency: draft.currency.trim().toUpperCase(),
    active: draft.active,
    effectiveFrom: new Date(draft.effectiveFrom).toISOString(),
    effectiveTo: draft.effectiveTo ? new Date(draft.effectiveTo).toISOString() : null,
  }
}

type FeeRuleFormProps = {
  initialValue: FeeRuleDraft
  providers: DeliveryProviderOption[]
  providersLoading: boolean
  providersError: string | null
  onChange: (value: FeeRuleDraft) => void
}

function FeeRuleForm({ initialValue, providers, providersLoading, providersError, onChange }: FeeRuleFormProps) {
  const [value, setValue] = useState(initialValue)
  const update = (next: Partial<FeeRuleDraft>) => {
    const updated = { ...value, ...next }
    setValue(updated)
    onChange(updated)
  }
  const selectableProviders = providers.filter((provider) => provider.active || provider.id === value.providerId)
  const currentProviderKnown = selectableProviders.some((provider) => provider.id === value.providerId)

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Delivery Provider
        <select
          aria-label="Delivery Provider"
          value={value.providerId}
          onChange={(event) => update({ providerId: event.target.value })}
          disabled={providersLoading || Boolean(providersError)}
          className={inputClassName}
        >
          <option value="">Select a delivery provider</option>
          {value.providerId && !currentProviderKnown && (
            <option value={value.providerId}>Unknown Provider ({value.providerId})</option>
          )}
          {selectableProviders.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}{provider.code ? ` (${provider.code})` : ''}
            </option>
          ))}
        </select>
        {providersLoading && <span className="mt-1 block text-xs text-slate-500">Loading providers...</span>}
        {providersError && <span className="mt-1 block text-xs text-red-600">{providersError}</span>}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Charging Basis
        <select
          aria-label="Charging Basis"
          value={value.chargingBasis}
          onChange={(event) => update({ chargingBasis: event.target.value as DeliveryChargingBasis })}
          className={inputClassName}
        >
          <option value="PER_ORDER">Per Order</option>
          <option value="PER_DAY">Per Day</option>
        </select>
        <span className="mt-1 block text-xs font-normal text-slate-500">
          {value.chargingBasis === 'PER_ORDER'
            ? 'Charge the shop once for each applicable delivered order.'
            : 'Charge the shop once per provider/shop business day, regardless of the number of delivered orders.'}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Fee Amount
          <input
            aria-label="Fee Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={value.amount}
            onChange={(event) => update({ amount: event.target.value })}
            className={inputClassName}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Currency
          <input
            aria-label="Currency"
            value={value.currency}
            maxLength={3}
            onChange={(event) => update({ currency: event.target.value.toUpperCase() })}
            className={inputClassName}
            placeholder="MMK"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Effective From
          <input
            aria-label="Effective From"
            type="datetime-local"
            value={value.effectiveFrom}
            onChange={(event) => update({ effectiveFrom: event.target.value })}
            className={inputClassName}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Effective To
          <input
            aria-label="Effective To"
            type="datetime-local"
            value={value.effectiveTo}
            onChange={(event) => update({ effectiveTo: event.target.value })}
            className={inputClassName}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          aria-label="Active"
          type="checkbox"
          checked={value.active}
          onChange={(event) => update({ active: event.target.checked })}
          className="h-4 w-4 accent-emerald-600"
        />
        Active
      </label>
    </div>
  )
}

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : '—'

const AdminDeliveryProviderFeesPage = () => {
  const { openModal } = useGlobalModal()
  const [feeRules, setFeeRules] = useState<DeliveryProviderFeeRule[]>([])
  const [providers, setProviders] = useState<DeliveryProviderOption[]>([])
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [providerError, setProviderError] = useState<string | null>(null)
  const [providersLoading, setProvidersLoading] = useState(true)
  const [success, setSuccess] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [providerFilter, setProviderFilter] = useState('')
  const [basisFilter, setBasisFilter] = useState<'' | DeliveryChargingBasis>('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const draftRef = useRef<FeeRuleDraft>(toDraft())

  const loadFeeRules = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      setFeeRules(await adminDeliveryProviderFeeApi.listFeeRules())
      setStatus('succeeded')
    } catch (loadError) {
      setError(getDeliveryProviderFeeApiErrorMessage(loadError, 'Unable to load delivery provider fee rules.'))
      setStatus('failed')
    }
  }, [])

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true)
    setProviderError(null)
    try {
      setProviders(await adminDeliveryProviderFeeApi.listDeliveryProviders())
    } catch (loadError) {
      setProviderError(getDeliveryProviderFeeApiErrorMessage(loadError, 'Unable to load delivery providers.'))
    } finally {
      setProvidersLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    void loadFeeRules()
    void loadProviders()
  }, [loadFeeRules, loadProviders])

  useEffect(() => {
    refresh()
  }, [refresh])

  const providersById = useMemo(() => new Map(providers.map((provider) => [provider.id, provider])), [providers])
  const filteredRules = useMemo(() => feeRules.filter((rule) =>
    (!providerFilter || rule.providerId === providerFilter)
    && (!basisFilter || rule.chargingBasis === basisFilter)
    && (!statusFilter || rule.active === (statusFilter === 'active')),
  ), [feeRules, providerFilter, basisFilter, statusFilter])
  const pageCount = Math.max(1, Math.ceil(filteredRules.length / rowsPerPage))
  const visibleRules = filteredRules.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const openFeeRuleModal = (rule?: DeliveryProviderFeeRule) => {
    const initialValue = toDraft(rule)
    draftRef.current = initialValue
    openModal({
      title: rule ? 'Edit delivery provider fee rule' : 'Create delivery provider fee rule',
      content: (
        <FeeRuleForm
          initialValue={initialValue}
          providers={providers}
          providersLoading={providersLoading}
          providersError={providerError}
          onChange={(next) => { draftRef.current = next }}
        />
      ),
      primaryLabel: rule ? 'Save changes' : 'Create fee rule',
      primaryVariant: 'success',
      onPrimary: async () => {
        const draft = draftRef.current
        const validationError = validateDraft(draft)
        if (validationError) throw new Error(validationError)
        const payload = toPayload(draft)
        try {
          if (rule) await adminDeliveryProviderFeeApi.updateFeeRule(rule.id, payload)
          else await adminDeliveryProviderFeeApi.createFeeRule(payload)
        } catch (saveError) {
          throw new Error(getDeliveryProviderFeeApiErrorMessage(saveError, 'Unable to save delivery provider fee rule.'))
        }
        setSuccess(rule ? 'Delivery provider fee rule updated.' : 'Delivery provider fee rule created.')
        await loadFeeRules()
      },
    })
  }

  const toggleActive = async (rule: DeliveryProviderFeeRule) => {
    const action = rule.active ? 'deactivate' : 'activate'
    const providerName = providersById.get(rule.providerId)?.name ?? 'this provider'
    if (!window.confirm(`${rule.active ? 'Deactivate' : 'Activate'} this delivery provider fee rule for ${providerName}?`)) return
    setError(null)
    setStatusUpdatingId(rule.id)
    try {
      await adminDeliveryProviderFeeApi.setFeeRuleActive(rule.id, !rule.active)
      setSuccess(`Delivery provider fee rule ${action}d.`)
      await loadFeeRules()
    } catch (updateError) {
      setError(getDeliveryProviderFeeApiErrorMessage(updateError, 'Unable to update delivery provider fee rule status.'))
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/accounting/overview" className="hover:text-slate-700">Accounting</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Delivery Provider Fees</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <CircleDollarSign size={22} className="text-orange-600" />
            Delivery Provider Fee Rules
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Configure the delivery expense charged to a shop by each provider. Per Order applies once to each applicable order; Per Day applies once per provider, shop, and business day.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => openFeeRuleModal()}
            disabled={providersLoading || Boolean(providerError) || !providers.some((provider) => provider.active)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} /> Create fee rule
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={status === 'loading' || providersLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {providerError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Provider list unavailable: {providerError}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-slate-600">
          Provider
          <select value={providerFilter} onChange={(event) => { setProviderFilter(event.target.value); setPage(1) }} className={inputClassName}>
            <option value="">All providers</option>
            {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Charging Basis
          <select value={basisFilter} onChange={(event) => { setBasisFilter(event.target.value as '' | DeliveryChargingBasis); setPage(1) }} className={inputClassName}>
            <option value="">All</option>
            <option value="PER_ORDER">Per Order</option>
            <option value="PER_DAY">Per Day</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Status
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as '' | 'active' | 'inactive'); setPage(1) }} className={inputClassName}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Delivery Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Charging Basis</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Fee Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Currency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Effective From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Effective To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">Loading delivery provider fee rules...</td></tr>}
              {status === 'failed' && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-red-600">{error ?? 'Unable to load delivery provider fee rules.'}</td></tr>}
              {status === 'succeeded' && visibleRules.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">No delivery provider fee rules found.</td></tr>}
              {status === 'succeeded' && visibleRules.map((rule) => {
                const provider = providersById.get(rule.providerId)
                return (
                  <tr key={rule.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <span>{provider?.name ?? 'Unknown Provider'}</span>
                      {provider?.code
                        ? <span className="ml-1 text-xs text-slate-500">({provider.code})</span>
                        : <span className="mt-0.5 block font-mono text-xs text-slate-500">{rule.providerId}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rule.chargingBasis === 'PER_ORDER' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
                        {rule.chargingBasis === 'PER_ORDER' ? 'Per Order' : 'Per Day'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{Number(rule.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{rule.currency}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDate(rule.effectiveFrom)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDate(rule.effectiveTo)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rule.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openFeeRuleModal(rule)} className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100">
                          <Pencil size={13} /> Edit
                        </button>
                        <button type="button" onClick={() => void toggleActive(rule)} disabled={statusUpdatingId === rule.id} className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                          {statusUpdatingId === rule.id ? 'Updating...' : rule.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {status === 'succeeded' && filteredRules.length > 0 && (
          <DataTablePagination
            page={page}
            totalPages={pageCount}
            rowsPerPage={rowsPerPage}
            totalItems={filteredRules.length}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1) }}
            itemLabel="fee rules"
          />
        )}
      </div>

      <aside className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">Charging basis examples</h2>
        <p className="mt-2"><strong>Per Order:</strong> The configured fee is applied once for each delivered order.</p>
        <p className="mt-1"><strong>Per Day:</strong> The configured fee is applied once per provider, shop, and business day.</p>
      </aside>
    </div>
  )
}

export default AdminDeliveryProviderFeesPage
