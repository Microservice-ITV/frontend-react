import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Download } from 'lucide-react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { fetchHomeFeatures } from '../store/homeFeatureThunks'
import {
  selectHomeFeatures,
  selectHomeFeaturesLoading,
  selectHomeFeaturesError,
} from '../store/homeFeatureSelectors'
import HomeFeatureTable from '../components/HomeFeatureTable'

const FILTER_TABS: { key: 'all' | 'active' | 'inactive'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

const toCsvCell = (value: string | number | boolean | null | undefined): string =>
  `"${String(value ?? '').replace(/"/g, '""')}"`

const HomeFeaturesPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const features = useAppSelector(selectHomeFeatures)
  const loading = useAppSelector(selectHomeFeaturesLoading)
  const error = useAppSelector(selectHomeFeaturesError)

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    if (features.length === 0) {
      dispatch(fetchHomeFeatures())
    }
  }, [dispatch, features.length])

  useEffect(() => {
    setPage(1)
  }, [activeFilter, search])

  const filteredFeatures = useMemo(() => {
    return features.filter((feature) => {
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'active' && feature.isActive) ||
        (activeFilter === 'inactive' && !feature.isActive)
      const matchesSearch =
        !search ||
        feature.name.toLowerCase().includes(search.toLowerCase()) ||
        feature.slug.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [features, activeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredFeatures.length / rowsPerPage))
  const paginatedFeatures = filteredFeatures.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  )

  const handleExport = () => {
    const header = [
      'Name',
      'Slug',
      'Icon URL',
      'Sort Order',
      'Status',
      'Start At',
      'End At',
      'Created At',
    ]
    const rows = filteredFeatures.map((feature) => [
      feature.name,
      feature.slug,
      feature.iconUrl,
      feature.sortOrder,
      feature.isActive ? 'Active' : 'Inactive',
      feature.startAt,
      feature.endAt,
      feature.createdAt,
    ])
    const csv = [header, ...rows].map((row) => row.map(toCsvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'home-features.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleEdit = (id: string) => {
    navigate(`/super-admin/home-features/${id}/edit`)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Home Features</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Home Features</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Manage the shortcut features displayed on the homepage.
          </p>
        </div>

        <Link
          to="/super-admin/home-features/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add Home Feature
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeFilter === tab.key
                ? 'bg-slate-200 text-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & tools */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search home features..."
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

      {/* Table */}
      <HomeFeatureTable
        features={paginatedFeatures}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        footer={
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={filteredFeatures.length}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setPage(1)
            }}
            itemLabel="home features"
          />
        }
      />
    </div>
  )
}

export default HomeFeaturesPage