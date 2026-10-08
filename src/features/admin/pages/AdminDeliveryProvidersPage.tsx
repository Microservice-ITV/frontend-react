import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Pencil, Plus, RefreshCw } from 'lucide-react'
import {
  adminDeliveryProviderApi,
  getDeliveryProviderApiErrorMessage,
  type DeliveryProvider,
  type DeliveryProviderPayload,
} from '../api/adminDeliveryProviderApi'

type ProviderDraft = {
  code: string
  name: string
  active: boolean
}

const inputClassName = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500'
const emptyDraft: ProviderDraft = { code: '', name: '', active: true }

function toPayload(draft: ProviderDraft): DeliveryProviderPayload {
  return {
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    active: draft.active,
  }
}

const AdminDeliveryProvidersPage = () => {
  const [providers, setProviders] = useState<DeliveryProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingProvider, setEditingProvider] = useState<DeliveryProvider | null>(null)
  const [draft, setDraft] = useState<ProviderDraft>(emptyDraft)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const loadProviders = useCallback(async (cancelled: () => boolean) => {
    setLoading(true)
    setLoadError('')
    try {
      const result = await adminDeliveryProviderApi.list()
      if (!cancelled()) setProviders(result)
    } catch (error: unknown) {
      if (!cancelled()) setLoadError(getDeliveryProviderApiErrorMessage(error, 'Unable to load delivery providers.'))
    } finally {
      if (!cancelled()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void loadProviders(() => cancelled)
    return () => {
      cancelled = true
    }
  }, [loadProviders, reloadKey])

  const openCreateForm = () => {
    setEditingProvider(null)
    setDraft(emptyDraft)
    setFormError('')
    setFormOpen(true)
  }

  const openEditForm = (provider: DeliveryProvider) => {
    setEditingProvider(provider)
    setDraft({ code: provider.code, name: provider.name, active: provider.active })
    setFormError('')
    setFormOpen(true)
  }

  const closeForm = () => {
    if (saving) return
    setEditingProvider(null)
    setFormError('')
    setFormOpen(false)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = toPayload(draft)
    if (!payload.code || !payload.name) {
      setFormError('Code and name are required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editingProvider) {
        const updated = await adminDeliveryProviderApi.update(editingProvider.id, payload)
        setProviders((current) => current.map((provider) => provider.id === updated.id ? updated : provider))
      } else {
        const created = await adminDeliveryProviderApi.create(payload)
        setProviders((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setEditingProvider(null)
      setFormOpen(false)
    } catch (error: unknown) {
      setFormError(getDeliveryProviderApiErrorMessage(error, 'Unable to save the delivery provider.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Delivery Providers</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Delivery Providers</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Manage canonical providers in Delivery Service. Provider IDs are generated there and remain stable.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={18} />
            New provider
          </button>
        </div>
      </div>

      {formOpen && (
        <section aria-label={editingProvider ? 'Edit delivery provider' : 'Create delivery provider'} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">{editingProvider ? 'Edit delivery provider' : 'Create delivery provider'}</h2>
              <p className="mt-1 text-xs text-slate-500">
                The provider ID is assigned by Delivery Service and cannot be edited.
              </p>
            </div>
            {editingProvider && <span className="break-all text-xs text-slate-500">ID: {editingProvider.id}</span>}
          </div>
          <form className="space-y-4" onSubmit={(event) => void submit(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Code
                <input
                  aria-label="Code"
                  required
                  maxLength={64}
                  value={draft.code}
                  onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                  className={inputClassName}
                  placeholder="Provider code"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  aria-label="Name"
                  required
                  maxLength={255}
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  className={inputClassName}
                  placeholder="Provider name"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                aria-label="Active"
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))}
                className="h-4 w-4 accent-emerald-600"
              />
              Active
            </label>
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeForm} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving...' : editingProvider ? 'Save changes' : 'Create provider'}
              </button>
            </div>
          </form>
        </section>
      )}

      {loadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Provider ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">Loading delivery providers...</td></tr>}
              {!loading && !loadError && providers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Building2 size={22} /></div>
                  <p className="mt-3 text-sm font-medium text-slate-700">No delivery providers have been created</p>
                </td></tr>
              )}
              {!loading && providers.map((provider) => (
                <tr key={provider.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{provider.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{provider.code}</td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-600" title={provider.id}>{provider.id}</td>
                  <td className="px-4 py-3">
                    <span className={provider.active ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700' : 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600'}>
                      {provider.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEditForm(provider)}
                      aria-label={`Edit ${provider.name}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDeliveryProvidersPage
