import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Download } from 'lucide-react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { fetchAnnouncements } from '../store/announcementThunks'
import {
  selectAnnouncements,
  selectAnnouncementsLoading,
  selectAnnouncementsError,
} from '../store/announcementSelectors'
import AnnouncementsTable from '../components/AnnouncementsTable'

type StatusFilter = 'all' | 'DRAFT' | 'ACTIVE' | 'INACTIVE'

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'INACTIVE', label: 'Inactive' },
]

const toCsvCell = (value: string | number | boolean | null | undefined): string =>
  `"${String(value ?? '').replace(/"/g, '""')}"`

const AnnouncementsPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const announcements = useAppSelector(selectAnnouncements)
  const loading = useAppSelector(selectAnnouncementsLoading)
  const error = useAppSelector(selectAnnouncementsError)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    if (announcements.length === 0) {
      dispatch(fetchAnnouncements())
    }
  }, [dispatch, announcements.length])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, search])

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesFilter = statusFilter === 'all' || announcement.status === statusFilter
      const matchesSearch =
        !search ||
        announcement.name.toLowerCase().includes(search.toLowerCase()) ||
        announcement.announcementType.name.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [announcements, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredAnnouncements.length / rowsPerPage))
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const handleExport = () => {
    const header = [
      'Name',
      'Type',
      'Status',
      'Start At',
      'End At',
      'Priority',
      'Created At',
    ]
    const rows = filteredAnnouncements.map((announcement) => [
      announcement.name,
      announcement.announcementType.name,
      announcement.status,
      announcement.startAt,
      announcement.endAt,
      announcement.priority,
      announcement.createdAt,
    ])
    const csv = [header, ...rows].map((row) => row.map(toCsvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'announcements.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleView = (id: string) => {
    navigate(`/super-admin/announcements/${id}/edit`)
  }

  const handleEdit = (id: string) => {
    navigate(`/super-admin/announcements/${id}/edit`)
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Announcements</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Manage announcement banners shown across the storefront.
          </p>
        </div>

        <Link
          to="/super-admin/announcements/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add Announcement
        </Link>
      </div>

      <div className="flex flex-wrap gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-slate-200 text-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <AnnouncementsTable
        announcements={paginatedAnnouncements}
        loading={loading}
        error={error}
        onView={handleView}
        onEdit={handleEdit}
        footer={
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={filteredAnnouncements.length}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setPage(1)
            }}
            itemLabel="announcements"
          />
        }
      />
    </div>
  )
}

export default AnnouncementsPage