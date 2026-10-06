import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Plus, Receipt, RefreshCw, Search, Trash2 } from 'lucide-react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { adminTaxApi, type TaxCharge, type TaxSettings } from '../api/adminTaxApi'

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

const AdminTaxPage = () => {
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const [settings, setSettings] = useState<TaxSettings | null>(null)
  const [taxes, setTaxes] = useState<TaxCharge[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState('')
  const [switchError, setSwitchError] = useState('')
  const [savingSwitch, setSavingSwitch] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const load = async () => {
    setStatus('loading')
    setError('')
    try {
      const [nextSettings, nextTaxes] = await Promise.all([
        adminTaxApi.getSettings(),
        adminTaxApi.listTaxes({ page, limit: rowsPerPage, search }),
      ])
      setSettings(nextSettings)
      setTaxes(nextTaxes.data)
      setTotalItems(nextTaxes.pagination.total)
      setTotalPages(Math.max(1, nextTaxes.pagination.totalPages))
      setStatus('succeeded')
    } catch (loadError: unknown) {
      setError(errorMessage(loadError, 'Unable to load taxes.'))
      setStatus('failed')
    }
  }

  useEffect(() => {
    void load()
  }, [page, rowsPerPage, search])

  const toggleTax = async (nextEnabled: boolean) => {
    setSavingSwitch(true)
    setSwitchError('')
    try {
      const next = await adminTaxApi.updateSettings(nextEnabled)
      setSettings((current) => ({ ...(current ?? next), ...next, isEnabled: nextEnabled }))
    } catch (toggleError: unknown) {
      setSwitchError(errorMessage(toggleError, 'Failed to update tax switch'))
    } finally {
      setSavingSwitch(false)
    }
  }

  const confirmDelete = (tax: TaxCharge) => {
    openModal({
      title: 'Remove this tax?',
      content: (
        <p>
          This removes the {tax.rate}% charge
          {tax.categories.length > 0
            ? ` on ${tax.categories.map((category) => category.categoryName).join(', ')}`
            : ''}{' '}
          and stops charging those categories. Checkout uses the next published rates.
        </p>
      ),
      primaryLabel: 'Remove',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await adminTaxApi.deleteTax(tax.id)
        await load()
      },
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Tax</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tax</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Rates assigned to product categories. Checkout adds the published rate. Shipping is not taxed.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={status === 'loading'}
            title="Refresh"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={16} className={status === 'loading' ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/super-admin/tax/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={18} />
            New tax
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Tax charges</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {settings?.isEnabled
              ? 'Turn this off to stop charging tax on every checkout.'
              : 'Tax is off. Every checkout is charged 0 until you turn this on.'}
          </p>
          {switchError && <p className="mt-1 text-xs text-red-600">{switchError}</p>}
        </div>
        <ToggleSwitch
          checked={Boolean(settings?.isEnabled)}
          disabled={!settings || savingSwitch}
          ariaLabel="Tax charges"
          onChange={(next) => void toggleTax(next)}
        />
      </div>

      <div className="relative w-full max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search taxes..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Categories</th>
                <th className="w-16 px-2 py-3 text-left text-xs font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading taxes...
                  </td>
                </tr>
              )}
              {status === 'failed' && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center">
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                      type="button"
                      onClick={() => void load()}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      Try again
                    </button>
                  </td>
                </tr>
              )}
              {status === 'succeeded' && taxes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Receipt size={22} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">No taxes yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Create a tax and assign product categories to start charging at checkout.
                    </p>
                    <Link
                      to="/super-admin/tax/new"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Plus size={14} />
                      New tax
                    </Link>
                  </td>
                </tr>
              )}
              {status === 'succeeded' &&
                taxes.map((tax) => (
                  <tr key={tax.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums text-slate-900">{tax.rate}%</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {tax.categories.map((category) => category.categoryName).join(', ') || 'None'}
                    </td>
                    <td className="w-16 px-2 py-3">
                      <RowActionMenu
                        ariaLabel="Tax actions"
                        items={[
                          {
                            key: 'edit',
                            label: 'Edit',
                            icon: <Pencil size={16} className="shrink-0 text-slate-500" />,
                            onClick: () => navigate(`/super-admin/tax/${tax.id}/edit`),
                          },
                          {
                            key: 'delete',
                            label: 'Remove',
                            icon: <Trash2 size={16} className="shrink-0 text-slate-500" />,
                            className:
                              'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
                            onClick: () => confirmDelete(tax),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          itemLabel="taxes"
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}

export default AdminTaxPage
