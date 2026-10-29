import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { useEmployeeStyleForm } from '@/features/employees/components/forms/useEmployeeStyleForm'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { performanceApi, performanceErrorMessage } from '../api/performanceApi'
import { useBonusPolicies } from '../hooks/usePerformanceData'
import { formatDate, formatScore, type BonusPolicy, type BonusPolicyPayload } from '../types/performanceTypes'

const BonusPoliciesPage = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const canManage = useCan(CAPABILITIES.BONUS_POLICIES_MANAGE)

  const [search, setSearch] = useState('')
  const { bonusPolicies, loading, error, reload } = useBonusPolicies({ search: search || undefined })

  const openForm = (existing?: BonusPolicy) => {
    const payload: BonusPolicyPayload = {
      name: existing?.name ?? '',
      min_performance_score: existing?.min_performance_score === null || existing?.min_performance_score === undefined ? null : Number(existing.min_performance_score),
      bonus_percentage_or_flat: Number(existing?.bonus_percentage_or_flat ?? 0),
      is_percentage: existing?.is_percentage ?? true,
      effective_from: existing?.effective_from?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      effective_to: existing?.effective_to?.slice(0, 10) ?? null,
    }

    showForm({
      title: existing ? 'Edit bonus policy' : 'New bonus policy',
      content: (
        <div className="grid gap-3">
          <FormField label="Policy name" required>
            <input
              type="text"
              placeholder="e.g. High performer bonus"
              defaultValue={payload.name}
              onChange={(event) => {
                payload.name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Minimum performance score" hint="Reviews scoring below this are skipped.">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                defaultValue={payload.min_performance_score ?? ''}
                onChange={(event) => {
                  payload.min_performance_score = event.target.value === '' ? null : Number(event.target.value)
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Bonus value" required hint={payload.is_percentage ? '% of base salary' : 'Flat amount'}>
              <input
                type="number"
                min={0}
                step="0.01"
                defaultValue={payload.bonus_percentage_or_flat}
                onChange={(event) => {
                  payload.bonus_percentage_or_flat = Number(event.target.value)
                }}
                className={textInputClass}
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              defaultChecked={payload.is_percentage}
              onChange={(event) => {
                payload.is_percentage = event.target.checked
              }}
              className="rounded border-slate-300"
            />
            Percentage of base salary (uncheck for a flat amount)
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Effective from" required>
              <input
                type="date"
                defaultValue={payload.effective_from}
                onChange={(event) => {
                  payload.effective_from = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Effective to">
              <input
                type="date"
                defaultValue={payload.effective_to ?? ''}
                onChange={(event) => {
                  payload.effective_to = event.target.value || null
                }}
                className={textInputClass}
              />
            </FormField>
          </div>
        </div>
      ),
      primaryLabel: existing ? 'Save changes' : 'Create policy',
      onPrimary: async () => {
        if (!payload.name.trim()) throw new Error('Name is required')
        if (payload.bonus_percentage_or_flat <= 0) throw new Error('Bonus value must be greater than zero')
        try {
          if (existing) await performanceApi.updateBonusPolicy(existing.id, payload)
          else await performanceApi.createBonusPolicy(payload)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (policy: BonusPolicy) => {
    openModal({
      title: 'Delete bonus policy',
      content: <p className="text-sm text-slate-600">Delete "{policy.name}"? This cannot be undone.</p>,
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await performanceApi.deleteBonusPolicy(policy.id)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<BonusPolicy>> = [
    {
      key: 'name',
      header: 'Policy',
      sortValue: (row) => row.name,
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'threshold',
      header: 'Min score',
      width: '110px',
      align: 'right',
      sortValue: (row) => Number(row.min_performance_score ?? 0),
      render: (row) => <span className="text-sm text-slate-600">{formatScore(row.min_performance_score)}</span>,
    },
    {
      key: 'value',
      header: 'Bonus',
      width: '130px',
      align: 'right',
      sortValue: (row) => Number(row.bonus_percentage_or_flat),
      render: (row) => (
        <span className="text-sm font-medium text-slate-900">
          {row.is_percentage ? `${row.bonus_percentage_or_flat}%` : `$${row.bonus_percentage_or_flat}`}
        </span>
      ),
    },
    {
      key: 'effective',
      header: 'Effective',
      hideBelow: 'md',
      sortValue: (row) => row.effective_from,
      render: (row) => (
        <span className="text-sm text-slate-600">
          {formatDate(row.effective_from)} – {row.effective_to ? formatDate(row.effective_to) : 'open'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: (row) =>
        canManage ? (
          <RowActionMenu
            items={[
              { key: 'edit', label: 'Edit', icon: <Pencil size={14} />, onClick: () => openForm(row) },
              { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, className: 'text-rose-600', onClick: () => confirmDelete(row) },
            ]}
            ariaLabel={`Actions for ${row.name}`}
          />
        ) : null,
    },
  ]

  if (formPage) return formPage

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bonus policies</h1>
          <p className="text-sm text-slate-500">
            Versioned rules mapping performance scores to bonus amounts, evaluated at proposal time.
          </p>
        </div>
        {canManage && (
          <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
            <Plus size={16} /> New policy
          </button>
        )}
      </div>

      <FilterBar search={{ value: search, onChange: setSearch, placeholder: 'Search policies…' }} />

      <DataTable<BonusPolicy>
        columns={columns}
        rows={bonusPolicies}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No bonus policies defined yet."
        itemLabel="policy"
      />
    </div>
  )
}

export default BonusPoliciesPage
