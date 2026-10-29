import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { employeeApi, employeeErrorMessage } from '../api/employeeApi'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '../components/forms/FormField'
import { useSalaryGrades } from '../hooks/useEmployeeData'
import type { Currency, SalaryGrade, SalaryGradePayload } from '../types/employeeTypes'
import { formatRange } from '../utils/employeeFormat'

const SalaryGradesPage = () => {
  const { openModal } = useGlobalModal()
  const [search, setSearch] = useState('')
  const { salaryGrades, loading, error, reload } = useSalaryGrades()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [currencyError, setCurrencyError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadCurrencies = async () => {
      setLoadingCurrencies(true)
      setCurrencyError(null)
      try {
        const response = await employeeApi.listCurrencies()
        if (!cancelled) setCurrencies(response.data.data.currencies)
      } catch (err) {
        if (!cancelled) {
          setCurrencies([])
          setCurrencyError(employeeErrorMessage(err))
        }
      } finally {
        if (!cancelled) setLoadingCurrencies(false)
      }
    }
    void loadCurrencies()
    return () => {
      cancelled = true
    }
  }, [])

  const currencyOptions = useMemo(
    () =>
      currencies.map((currency) => ({
        value: currency.code,
        label: `${currency.code} — ${currency.name}`,
      })),
    [currencies],
  )

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return salaryGrades
    return salaryGrades.filter((grade) =>
      `${grade.name} ${grade.code}`.toLowerCase().includes(term),
    )
  }, [salaryGrades, search])

  const openForm = (grade?: SalaryGrade) => {
    const payload: SalaryGradePayload = {
      code: grade?.code ?? '',
      name: grade?.name ?? '',
      min_salary: grade?.min_salary ? Number(grade.min_salary) : null,
      max_salary: grade?.max_salary ? Number(grade.max_salary) : null,
      currency: grade?.currency ?? 'USD',
    }

    openModal({
      title: grade ? 'Edit salary grade' : 'New salary grade',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Code" required>
            <input
              defaultValue={payload.code}
              onChange={(event) => {
                payload.code = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Name" required>
            <input
              defaultValue={payload.name}
              onChange={(event) => {
                payload.name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Minimum salary">
            <input
              type="number"
              step="0.01"
              min="0"
              defaultValue={payload.min_salary ?? ''}
              onChange={(event) => {
                payload.min_salary = event.target.value
                  ? Number(event.target.value)
                  : null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Maximum salary">
            <input
              type="number"
              step="0.01"
              min="0"
              defaultValue={payload.max_salary ?? ''}
              onChange={(event) => {
                payload.max_salary = event.target.value
                  ? Number(event.target.value)
                  : null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField
            label="Currency"
            error={currencyError ?? undefined}
            hint={loadingCurrencies ? 'Loading currencies…' : undefined}
          >
            <SearchableSelect
              options={currencyOptions}
              value={payload.currency ?? ''}
              onChange={(value) => {
                payload.currency = value || null
              }}
              emptyLabel="Select currency"
              placeholder="Search currencies…"
              mode="search-and-scroll"
              loading={loadingCurrencies}
              disabled={loadingCurrencies || Boolean(currencyError)}
            />
          </FormField>
        </div>
      ),
      primaryLabel: grade ? 'Save changes' : 'Create grade',
      onPrimary: async () => {
        if (!currencyOptions.some((option) => option.value === payload.currency)) {
          throw new Error(currencyError ?? 'Select a currency from the list.')
        }

        try {
          if (grade) {
            await employeeApi.updateSalaryGrade(grade.id, payload)
          } else {
            await employeeApi.createSalaryGrade(payload)
          }
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (grade: SalaryGrade) => {
    openModal({
      title: 'Delete salary grade?',
      content: (
        <p>
          Delete <strong>{grade.name}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await employeeApi.deleteSalaryGrade(grade.id)
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<SalaryGrade>> = [
    {
      key: 'name',
      header: 'Salary grade',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'range',
      header: 'Range',
      width: '240px',
      render: (row) => formatRange(row.min_salary, row.max_salary, row.currency),
    },
    {
      key: 'currency',
      header: 'Currency',
      width: '120px',
      hideBelow: 'md',
      render: (row) => row.currency ?? '—',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel={`Actions for ${row.name}`}
          items={[
            {
              key: 'edit',
              label: 'Edit',
              icon: <Pencil size={16} className="shrink-0 text-slate-500" />,
              onClick: () => openForm(row),
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: <Trash2 size={16} className="shrink-0 text-slate-500" />,
              className:
                'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
              onClick: () => confirmDelete(row),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Salary grades</h1>
          <p className="text-sm text-slate-500">Compensation bands assignable to employees.</p>
        </div>
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => openForm()}
          disabled={loadingCurrencies}
        >
          <Plus size={16} />
          Add salary grade
        </button>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search name or code…' }}
      />

      <DataTable<SalaryGrade>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No salary grades found."
        itemLabel="salary grades"
        minWidth="640px"
        fixedLayout
      />
    </div>
  )
}

export default SalaryGradesPage
