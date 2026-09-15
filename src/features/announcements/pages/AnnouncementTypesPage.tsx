import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { fetchAnnouncementTypes } from '../store/announcementTypeThunks'
import {
  selectAnnouncementTypes,
  selectAnnouncementTypesLoading,
  selectAnnouncementTypesError,
} from '../store/announcementTypeSelectors'
import AnnouncementTypesTable from '../components/AnnouncementTypesTable'

const AnnouncementTypesPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const types = useAppSelector(selectAnnouncementTypes)
  const loading = useAppSelector(selectAnnouncementTypesLoading)
  const error = useAppSelector(selectAnnouncementTypesError)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    if (types.length === 0) {
      dispatch(fetchAnnouncementTypes())
    }
  }, [dispatch, types.length])

  useEffect(() => {
    setPage(1)
  }, [search])

  const filteredTypes = useMemo(() => {
    return types.filter((type) => {
      return (
        !search ||
        type.name.toLowerCase().includes(search.toLowerCase()) ||
        type.code.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [types, search])

  const totalPages = Math.max(1, Math.ceil(filteredTypes.length / rowsPerPage))
  const paginatedTypes = filteredTypes.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const handleView = (id: string) => {
    navigate(`/super-admin/announcement-types/${id}/edit`)
  }

  const handleEdit = (id: string) => {
    navigate(`/super-admin/announcement-types/${id}/edit`)
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Announcement Types</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Announcement Types</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Define the building blocks your announcement banners can use.
          </p>
        </div>

        <Link
          to="/super-admin/announcement-types/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add Announcement Type
        </Link>
      </div>

      <div className="relative w-full max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search announcement types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
        />
      </div>

      <AnnouncementTypesTable
        types={paginatedTypes}
        loading={loading}
        error={error}
        onView={handleView}
        onEdit={handleEdit}
        footer={
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={filteredTypes.length}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setPage(1)
            }}
            itemLabel="announcement types"
          />
        }
      />
    </div>
  )
}

export default AnnouncementTypesPage