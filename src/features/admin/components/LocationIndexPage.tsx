import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'

export type LocationIndexRow = {
  id: number
  name: string
  parent: string
}

type LocationIndexPageProps = {
  title: string
  description: string
  addLabel: string
  addTo: string
  editTo: (id: number) => string
  parentHeading: string
  itemLabel: string
  rows: LocationIndexRow[]
  status: 'loading' | 'succeeded' | 'failed'
  error: string | null
  onRefresh: () => void
  onDelete: (row: LocationIndexRow) => Promise<void>
  deleteMessage: (row: LocationIndexRow) => string
}

const LocationIndexPage = ({
  title,
  description,
  addLabel,
  addTo,
  editTo,
  parentHeading,
  itemLabel,
  rows,
  status,
  error,
  onRefresh,
  onDelete,
  deleteMessage,
}: LocationIndexPageProps) => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const { openModal } = useGlobalModal()

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(
      (row) => row.name.toLowerCase().includes(query) || row.parent.toLowerCase().includes(query),
    )
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{title}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="mt-0.5 text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Link
            to={addTo}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={16} />
            {addLabel}
          </Link>
          <button
            type="button"
            onClick={onRefresh}
            disabled={status === 'loading'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="relative w-full max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder={`Search ${itemLabel}...`}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">{parentHeading}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">
                    Loading {itemLabel}...
                  </td>
                </tr>
              )}
              {status !== 'loading' && visible.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">
                    {rows.length === 0 ? `No ${itemLabel} yet.` : `No ${itemLabel} match your search.`}
                  </td>
                </tr>
              )}
              {status !== 'loading' &&
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.parent}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={editTo(row.id)}
                          title={`Edit ${row.name}`}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          title={`Delete ${row.name}`}
                          onClick={() => {
                            openModal({
                              title: `Delete ${row.name}?`,
                              content: <p>{deleteMessage(row)}</p>,
                              primaryLabel: 'Delete',
                              primaryVariant: 'danger',
                              secondaryLabel: 'Cancel',
                              onPrimary: () => onDelete(row),
                            })
                          }}
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={safePage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={filtered.length}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
          itemLabel={itemLabel}
        />
      </div>
    </div>
  )
}

export default LocationIndexPage
