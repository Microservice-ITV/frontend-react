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
import { useKpis } from '../hooks/usePerformanceData'
import { KpiScoringMethodBadge } from '../components/PerformanceBadges'
import {
  KPI_SCORING_METHODS,
  KPI_SCORING_METHOD_LABELS,
  type Kpi,
  type KpiPayload,
  type KpiScoringMethod,
} from '../types/performanceTypes'

const KpisPage = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const canManage = useCan(CAPABILITIES.PERFORMANCE_MANAGE)

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  const { kpis, loading, error, reload } = useKpis({
    search: search || undefined,
    is_active: activeFilter === '' ? undefined : activeFilter === '1',
  })

  const openForm = (existing?: Kpi) => {
    const payload: KpiPayload = {
      title: existing?.title ?? '',
      description: existing?.description ?? '',
      measurement_unit: existing?.measurement_unit ?? '',
      scoring_method: existing?.scoring_method ?? 'LINEAR',
      is_active: existing?.is_active ?? true,
    }

    showForm({
      title: existing ? 'Edit KPI' : 'New KPI',
      content: (
        <div className="grid gap-3">
          <FormField label="Title" required>
            <input
              type="text"
              placeholder="e.g. Customer satisfaction score"
              defaultValue={payload.title}
              onChange={(event) => {
                payload.title = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Description">
            <textarea
              rows={2}
              defaultValue={payload.description ?? ''}
              onChange={(event) => {
                payload.description = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Measurement unit">
              <input
                type="text"
                placeholder="e.g. %, tickets, hours"
                defaultValue={payload.measurement_unit ?? ''}
                onChange={(event) => {
                  payload.measurement_unit = event.target.value || null
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Scoring method" required hint="How actual values become a 0–100 score.">
              <select
                defaultValue={payload.scoring_method}
                onChange={(event) => {
                  payload.scoring_method = event.target.value as KpiScoringMethod
                }}
                className={textInputClass}
              >
                {KPI_SCORING_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {KPI_SCORING_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              defaultChecked={payload.is_active}
              onChange={(event) => {
                payload.is_active = event.target.checked
              }}
              className="rounded border-slate-300"
            />
            Active
          </label>
        </div>
      ),
      primaryLabel: existing ? 'Save changes' : 'Create KPI',
      onPrimary: async () => {
        if (!payload.title.trim()) throw new Error('Title is required')
        try {
          if (existing) await performanceApi.updateKpi(existing.id, payload)
          else await performanceApi.createKpi(payload)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (kpi: Kpi) => {
    openModal({
      title: 'Delete KPI',
      content: <p className="text-sm text-slate-600">Delete "{kpi.title}"? This cannot be undone.</p>,
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await performanceApi.deleteKpi(kpi.id)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<Kpi>> = [
    {
      key: 'title',
      header: 'KPI',
      sortValue: (row) => row.title,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.title}</p>
          {row.description && <p className="truncate text-xs text-slate-500">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      width: '110px',
      hideBelow: 'md',
      render: (row) => <span className="text-sm text-slate-600">{row.measurement_unit || '—'}</span>,
    },
    {
      key: 'method',
      header: 'Scoring',
      width: '120px',
      sortValue: (row) => row.scoring_method,
      render: (row) => <KpiScoringMethodBadge method={row.scoring_method} />,
    },
    {
      key: 'active',
      header: 'Active',
      width: '90px',
      render: (row) => (
        <span className={`text-sm ${row.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
          {row.is_active ? 'Yes' : 'No'}
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
            ariaLabel={`Actions for ${row.title}`}
          />
        ) : null,
    },
  ]

  if (formPage) return formPage

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">KPIs</h1>
          <p className="text-sm text-slate-500">Reusable performance indicators weighted inside review cycles.</p>
        </div>
        {canManage && (
          <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
            <Plus size={16} /> New KPI
          </button>
        )}
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search KPIs…' }}
        selects={[
          {
            key: 'active',
            label: 'Status',
            value: activeFilter,
            onChange: setActiveFilter,
            allLabel: 'All',
            options: [
              { value: '1', label: 'Active' },
              { value: '0', label: 'Inactive' },
            ],
          },
        ]}
      />

      <DataTable<Kpi>
        columns={columns}
        rows={kpis}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No KPIs defined yet."
        itemLabel="KPI"
      />
    </div>
  )
}

export default KpisPage
