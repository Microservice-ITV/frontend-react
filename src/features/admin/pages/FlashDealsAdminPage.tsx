import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import {
  CalendarClock,
  ChevronRight,
  Clock,
  Loader2,
  PackagePlus,
  Play,
  Plus,
  Search,
  Square,
  Tag,
  X,
} from 'lucide-react'
import {
  fetchAdminFlashDealCampaigns,
  createAdminFlashDealCampaign,
  createAdminFlashDealSlot,
  setAdminFlashDealSlotStatus,
  assignAdminFlashDealProducts,
  setAdminFlashDealItemStatus,
} from '../store/adminFlashDealsThunks'
import {
  selectAdminFlashDealCampaigns,
  selectAdminFlashDealError,
  selectAdminFlashDealStatus,
} from '../store/adminFlashDealsSelectors'
import type {
  AdminFlashDealCampaign,
  AdminFlashDealItem,
  AdminFlashDealSlot,
  AdminCampaignStatus,
  AdminItemStatus,
  AdminProductOption,
  AdminSlotStatus,
} from '../types/adminFlashDealTypes'
import { adminFlashDealApi } from '../api/adminFlashDealApi'

const CAMPAIGN_FILTERS: { key: AdminCampaignStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
]

const PAGE_SIZE = 8

const START_GRACE_MS = 5 * 60 * 1000

// ────────────────────────────────────────────────────────────
// Shared presentational helpers
// ────────────────────────────────────────────────────────────

const formatDate = (raw: string): string => {
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (raw: string): string => {
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const campaignBadge = (status: AdminCampaignStatus): string =>
  status === 'DRAFT'
    ? 'bg-slate-100 text-slate-600'
    : status === 'SCHEDULED'
      ? 'bg-blue-100 text-blue-700'
      : status === 'ACTIVE'
        ? 'bg-emerald-100 text-emerald-700'
        : status === 'COMPLETED'
          ? 'bg-teal-100 text-teal-700'
          : 'bg-red-100 text-red-700'

const slotBadge = (status: AdminSlotStatus): string =>
  status === 'PENDING'
    ? 'bg-slate-100 text-slate-600'
    : status === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'COMPLETED'
        ? 'bg-teal-100 text-teal-700'
        : 'bg-red-100 text-red-700'

const itemBadge = (status: AdminItemStatus): string =>
  status === 'ACTIVE'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'SOLD_OUT'
      ? 'bg-amber-100 text-amber-800'
      : status === 'DISABLED'
        ? 'bg-slate-100 text-slate-600'
        : 'bg-red-100 text-red-700'

const StatusBadge = ({ label, className }: { label: string; className: string }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
    {label}
  </span>
)

const ModalShell = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer: React.ReactNode
  maxWidth?: string
}) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`flex max-h-[90vh] w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-lg ${maxWidth}`}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 no-underline hover:no-underline"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          {footer}
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500'
const labelClass = 'block text-xs font-medium text-slate-600'
const primaryBtnClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 no-underline hover:no-underline'
const secondaryBtnClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 no-underline hover:no-underline'

const errorMessage = (err: unknown, fallback: string): string =>
  typeof err === 'string' && err.trim() ? err : (err as Error | undefined)?.message || fallback

// ────────────────────────────────────────────────────────────
// New Campaign modal
// ────────────────────────────────────────────────────────────

const CampaignModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const dispatch = useAppDispatch()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setStartTime('')
      setEndTime('')
      setError('')
    }
  }, [open])

  const handleSubmit = async () => {
    setError('')
    if (!title.trim()) {
      setError('Campaign title is required.')
      return
    }
    if (!startTime || !endTime) {
      setError('Start and end times are required.')
      return
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError('End time must be later than start time.')
      return
    }
    if (new Date(startTime).getTime() <= Date.now() - START_GRACE_MS) {
      setError('Start time must be in the future.')
      return
    }

    setSubmitting(true)
    try {
      await dispatch(
        createAdminFlashDealCampaign({
          title: title.trim(),
          description: description.trim() || undefined,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      ).unwrap()
      onClose()
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not create campaign.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="New Flash Deal Campaign"
      subtitle="A campaign defines the overall date window. Time slots are added next."
      footer={
        <>
          <button type="button" className={secondaryBtnClass} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtnClass}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create campaign
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="fd-campaign-title">
            Title
          </label>
          <input
            id="fd-campaign-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mid-Autumn Mega Sale"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="fd-campaign-desc">
            Description <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            id="fd-campaign-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short blurb shown on the flash deal landing page"
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="fd-campaign-start">
              Start time
            </label>
            <input
              id="fd-campaign-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="fd-campaign-end">
              End time
            </label>
            <input
              id="fd-campaign-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>
    </ModalShell>
  )
}

// ────────────────────────────────────────────────────────────
// New time slot modal
// ────────────────────────────────────────────────────────────

const SlotModal = ({
  campaign,
  open,
  onClose,
}: {
  campaign: AdminFlashDealCampaign
  open: boolean
  onClose: () => void
}) => {
  const dispatch = useAppDispatch()
  const [slotTime, setSlotTime] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setSlotTime('')
      setError('')
    }
  }, [open])

  const handleSubmit = async () => {
    setError('')
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(slotTime)) {
      setError('Slot time must be in HH:MM (24-hour) format.')
      return
    }
    setSubmitting(true)
    try {
      await dispatch(
        createAdminFlashDealSlot({ campaignId: campaign.id, input: { slotTime } }),
      ).unwrap()
      onClose()
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not create time slot.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Add Time Slot"
      subtitle={`Campaign: ${campaign.title}`}
      footer={
        <>
          <button type="button" className={secondaryBtnClass} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtnClass}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add slot
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="fd-slot-time">
            Slot time (24h)
          </label>
          <input
            id="fd-slot-time"
            type="time"
            value={slotTime}
            onChange={(e) => setSlotTime(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">
            Deals inside this slot run for the configured window within the campaign date range.
          </p>
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>
    </ModalShell>
  )
}

// ────────────────────────────────────────────────────────────
// Item allocation modal (attach products to a slot)
// ────────────────────────────────────────────────────────────

type AllocationRow = {
  product: AdminProductOption
  flashPrice: string
  allocatedStock: string
  limitPerUser: string
}

const AllocateItemsModal = ({
  slot,
  open,
  onClose,
}: {
  slot: AdminFlashDealSlot
  open: boolean
  onClose: () => void
}) => {
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminProductOption[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [rows, setRows] = useState<AllocationRow[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setRows([])
      setError('')
      setHasSearched(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const clean = query.trim()
    if (!clean) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const options = await adminFlashDealApi.searchProducts(clean)
        setResults(options)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
        setHasSearched(true)
      }
    }, 350)
  }, [query, open])

  const isAlreadyAdded = (productId: string) => rows.some((row) => row.product.id === productId)

  const addProduct = (product: AdminProductOption) => {
    if (isAlreadyAdded(product.id)) return
    setRows((prev) => [
      ...prev,
      {
        product,
        flashPrice: '',
        allocatedStock: '',
        limitPerUser: '1',
      },
    ])
  }

  const removeProduct = (productId: string) => {
    setRows((prev) => prev.filter((row) => row.product.id !== productId))
  }

  const updateRow = (
    productId: string,
    patch: Partial<Pick<AllocationRow, 'flashPrice' | 'allocatedStock' | 'limitPerUser'>>,
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.product.id === productId ? { ...row, ...patch } : row)),
    )
  }

  const handleSubmit = async () => {
    setError('')
    if (rows.length === 0) {
      setError('Add at least one product to this slot.')
      return
    }

    const invalidPricing = rows.find((row) => {
      const flashPrice = Number(row.flashPrice)
      return !Number.isFinite(flashPrice) || flashPrice <= 0 || flashPrice >= row.product.price
    })
    const invalidStock = rows.find((row) => {
      const allocated = Math.floor(Number(row.allocatedStock))
      return !Number.isInteger(allocated) || allocated <= 0 || allocated > row.product.stock
    })

    if (invalidPricing) {
      setError(`Flash price for "${invalidPricing.product.name}" must be lower than its list price.`)
      return
    }
    if (invalidStock) {
      setError(
        `Allocated stock for "${invalidStock.product.name}" must be between 1 and ${invalidStock.product.stock} (available).`,
      )
      return
    }

    const items = rows.map((row) => {
      const maxPerUser = Math.floor(Number(row.limitPerUser)) || 1
      return {
        productId: row.product.id,
        originalPrice: row.product.price,
        dealPrice: Number(row.flashPrice),
        allocatedStock: Math.floor(Number(row.allocatedStock)),
        maxPerUser: Math.max(1, maxPerUser),
      }
    })

    setSubmitting(true)
    try {
      await dispatch(assignAdminFlashDealProducts({ slotId: slot.id, items })).unwrap()
      onClose()
    } catch (err: unknown) {
      setError(errorMessage(err, 'Could not assign products to slot.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Assign Products to Slot"
      subtitle={`Slot ${slot.slotTime || '—'} · pick products and set flash pricing & stock`}
      maxWidth="max-w-3xl"
      footer={
        <>
          <span className="mr-auto text-xs text-slate-500">
            {rows.length} product{rows.length !== 1 ? 's' : ''} selected
          </span>
          <button type="button" className={secondaryBtnClass} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtnClass}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />}
            Assign products
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="fd-alloc-search">
            Search products
          </label>
          <div className="relative mt-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="fd-alloc-search"
              type="search"
              placeholder="Search by product name or SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
            />
          </div>
          {searching && <p className="mt-1 text-xs text-slate-500">Searching…</p>}
          {!searching && hasSearched && results.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">No products found.</p>
          )}
          {!searching && results.length > 0 && (
            <ul className="mt-2 max-h-52 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-white">
              {results.map((product) => (
                <li key={product.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                    {product.image ? (
                      <img src={product.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Tag size={14} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-900">{product.name}</p>
                    <p className="text-[11px] text-slate-500">
                      ${product.price.toFixed(2)} · {product.stock} available
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isAlreadyAdded(product.id)}
                    onClick={() => addProduct(product)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 no-underline hover:no-underline"
                  >
                    <Plus size={12} />
                    {isAlreadyAdded(product.id) ? 'Added' : 'Add'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {rows.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                      Product
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                      List price
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                      Flash price
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                      Stock
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                      Max / user
                    </th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.product.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2">
                        <p className="max-w-[180px] truncate text-xs font-medium text-slate-900">
                          {row.product.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{row.product.stock} available</p>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        ${row.product.price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={row.flashPrice}
                          onChange={(e) => updateRow(row.product.id, { flashPrice: e.target.value })}
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={row.allocatedStock}
                          onChange={(e) =>
                            updateRow(row.product.id, { allocatedStock: e.target.value })
                          }
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={row.limitPerUser}
                          onChange={(e) => updateRow(row.product.id, { limitPerUser: e.target.value })}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeProduct(row.product.id)}
                          aria-label="Remove product"
                          className="cursor-pointer rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 no-underline hover:no-underline"
                        >
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>
    </ModalShell>
  )
}

// ────────────────────────────────────────────────────────────
// Assigned items table (rendered inside expanded slot rows)
// ────────────────────────────────────────────────────────────

const ItemBar = ({
  slot,
  busyKey,
  onToggleItemStatus,
}: {
  slot: AdminFlashDealSlot
  busyKey: string | null
  onToggleItemStatus: (item: AdminFlashDealItem) => void
}) => {
  const soldTotal = slot.items.reduce((sum, item) => sum + item.soldStock, 0)

  if (slot.items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500">
        No products assigned yet — use “Assign products” to attach deals to this slot.
      </div>
    )
  }

  const slotLocked = slot.status === 'COMPLETED' || slot.status === 'CANCELLED'

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
        <p className="text-xs font-semibold text-slate-700">
          Assigned products ({slot.items.length})
        </p>
        <span className="text-[11px] text-slate-500">{soldTotal} units sold</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Product</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Price</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Sales</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Limit / user</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Status</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Control</th>
            </tr>
          </thead>
          <tbody>
            {slot.items.map((item) => {
              const itemBusy = busyKey === `item-status:${item.id}`
              const canToggle =
                !slotLocked && (item.status === 'ACTIVE' || item.status === 'DISABLED')
              return (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                        {item.productImage ? (
                          <img src={item.productImage} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Tag size={13} />
                          </div>
                        )}
                      </div>
                      <p className="max-w-[200px] truncate text-xs font-medium text-slate-900">
                        {item.productName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-xs text-slate-900">
                      <span className="font-semibold text-emerald-700">${item.dealPrice.toFixed(2)}</span>
                      <span className="ml-1.5 text-slate-400 line-through">
                        ${item.originalPrice.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-[11px] font-medium text-emerald-700">
                      {item.discountPercent}% off
                    </p>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: `${Math.min(100, item.soldPercent)}%` }}
                        />
                      </div>
                      <span className="text-[11px] whitespace-nowrap text-slate-600">
                        {item.soldStock} / {item.allocatedStock} ({item.soldPercent}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-600">
                    {item.limitPerUser > 1 ? `${item.limitPerUser} units` : '1 unit'}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge label={item.status} className={itemBadge(item.status)} />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      {!canToggle ? (
                        <span className="text-[11px] text-slate-400">—</span>
                      ) : item.status === 'DISABLED' ? (
                        <button
                          type="button"
                          disabled={itemBusy}
                          onClick={() => onToggleItemStatus(item)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 no-underline hover:no-underline"
                        >
                          {itemBusy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                          Enable
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={itemBusy}
                          onClick={() => onToggleItemStatus(item)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 no-underline hover:no-underline"
                        >
                          {itemBusy ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Square size={12} />
                          )}
                          Disable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Slots panel (rendered inside expanded campaign rows)
// ────────────────────────────────────────────────────────────

const SlotsPanel = ({
  campaign,
  expandedSlotId,
  onToggleSlot,
  busyKey,
  onOpenSlotModal,
  onOpenAllocateModal,
  onToggleSlotStatus,
  onToggleItemStatus,
}: {
  campaign: AdminFlashDealCampaign
  expandedSlotId: string | null
  onToggleSlot: (slotId: string) => void
  busyKey: string | null
  onOpenSlotModal: () => void
  onOpenAllocateModal: (slot: AdminFlashDealSlot) => void
  onToggleSlotStatus: (slot: AdminFlashDealSlot) => void
  onToggleItemStatus: (item: AdminFlashDealItem) => void
}) => {
  const totalSold = campaign.slots.reduce(
    (sum, slot) => sum + slot.items.reduce((s, item) => s + item.soldStock, 0),
    0,
  )
  const campaignLocked = campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED'

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-500" />
          <p className="text-xs font-semibold text-slate-700">
            Time Slots ({campaign.slots.length})
          </p>
          <span className="text-[11px] text-slate-500">· {totalSold} units sold</span>
        </div>
        {!campaignLocked && (
          <button
            type="button"
            onClick={onOpenSlotModal}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 no-underline hover:no-underline"
          >
            <Plus size={13} />
            Add slot
          </button>
        )}
      </div>

      {campaign.slots.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
          No slots yet — add a time slot to schedule deals within this campaign.
        </p>
      ) : (
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Slot time</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Products</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Sold</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaign.slots.map((slot) => {
              const expanded = expandedSlotId === slot.id
              const isBusy = busyKey === `slot-status:${slot.id}`
              const soldTotal = slot.items.reduce((sum, item) => sum + item.soldStock, 0)
              return (
                <Fragment key={slot.id}>
                  <tr className="border-b border-slate-100 bg-white hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onToggleSlot(slot.id)}
                        className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-900 hover:text-emerald-700 no-underline hover:no-underline"
                      >
                        <ChevronRight
                          size={14}
                          className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        />
                        {slot.slotTime || '—'}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge label={slot.status} className={slotBadge(slot.status)} />
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{slot.items.length}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {soldTotal > 0 ? (
                        <span className="font-medium text-emerald-700">{soldTotal}</span>
                      ) : (
                        soldTotal
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenAllocateModal(slot)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 no-underline hover:no-underline"
                        >
                          <PackagePlus size={13} />
                          Assign products
                        </button>
                        {slot.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => onToggleSlotStatus(slot)}
                            disabled={isBusy}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 no-underline hover:no-underline"
                          >
                            {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                            Activate
                          </button>
                        )}
                        {slot.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => onToggleSlotStatus(slot)}
                            disabled={isBusy}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 no-underline hover:no-underline"
                          >
                            {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Square size={13} />}
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50/60 px-4 pb-4 pt-1">
                        <ItemBar
                          slot={slot}
                          busyKey={busyKey}
                          onToggleItemStatus={onToggleItemStatus}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

const FlashDealsAdminPage = () => {
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()

  const campaigns = useAppSelector(selectAdminFlashDealCampaigns)
  const status = useAppSelector(selectAdminFlashDealStatus)
  const storeError = useAppSelector(selectAdminFlashDealError)

  const [activeFilter, setActiveFilter] = useState<AdminCampaignStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null)
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const [campaignOpen, setCampaignOpen] = useState(false)
  const [slotModalCampaign, setSlotModalCampaign] = useState<AdminFlashDealCampaign | null>(null)
  const [allocateSlot, setAllocateSlot] = useState<AdminFlashDealSlot | null>(null)

  const load = useCallback(async () => {
    try {
      await dispatch(fetchAdminFlashDealCampaigns()).unwrap()
    } catch {
      // re-fetch failed — the store exposes the error, UI shows it below.
    }
  }, [dispatch])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return campaigns.filter(
      (c) =>
        (activeFilter === 'all' || c.status === activeFilter) &&
        (!q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
    )
  }, [campaigns, activeFilter, search])

  useEffect(() => {
    setPage(1)
  }, [activeFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaignId((prev) => (prev === campaignId ? null : campaignId))
  }

  const toggleSlot = (slotId: string) => {
    setExpandedSlotId((prev) => (prev === slotId ? null : slotId))
  }

  const runAction = async (key: string, job: () => Promise<unknown>) => {
    setBusyKey(key)
    try {
      await job()
    } finally {
      setBusyKey(null)
    }
  }

  const handleToggleSlotStatus = (slot: AdminFlashDealSlot) => {
    const activating = slot.status === 'PENDING'
    openModal({
      title: activating ? 'Activate time slot?' : 'Deactivate time slot?',
      content: (
        <p>
          {activating
            ? `This will start the ${slot.slotTime || '—'} slot and make its deals live for buyers.`
            : `Deactivating ends the ${slot.slotTime || '—'} slot immediately and stops further sales on its deals.`}
        </p>
      ),
      primaryLabel: activating ? 'Activate' : 'Deactivate',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: () =>
        runAction(`slot-status:${slot.id}`, () =>
          dispatch(
            setAdminFlashDealSlotStatus({
              slotId: slot.id,
              status: activating ? 'ACTIVE' : 'CANCELLED',
            }),
          ).unwrap(),
        ),
    })
  }

  const handleToggleItemStatus = (item: AdminFlashDealItem) => {
    const enabling = item.status === 'DISABLED'
    openModal({
      title: enabling ? 'Enable deal item?' : 'Disable deal item?',
      content: (
        <p>
          {enabling
            ? `Re-enable "${item.productName}" for buyers on this slot.`
            : `Disable "${item.productName}" — it will stop appearing on this slot immediately. Existing orders are not affected.`}
        </p>
      ),
      primaryLabel: enabling ? 'Enable' : 'Disable',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: () =>
        runAction(`item-status:${item.id}`, () =>
          dispatch(
            setAdminFlashDealItemStatus({
              itemId: item.id,
              status: enabling ? 'ACTIVE' : 'DISABLED',
            }),
          ).unwrap(),
        ),
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link
          to="/super-admin/overview"
          className="hover:text-slate-700 no-underline hover:no-underline"
        >
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Flash Deals</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Flash Deals</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Campaigns, time slots, and their live deals across all shops.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCampaignOpen(true)}
          className={primaryBtnClass}
        >
          <Plus size={16} />
          New campaign
        </button>
      </div>

      {storeError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {storeError}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
        <div className="flex flex-wrap items-center gap-1 sm:px-0 px-2 pt-2">
          {CAMPAIGN_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium no-underline hover:no-underline ${
                activeFilter === filter.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64 px-2 pb-2 sm:px-0 sm:py-0">
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {status === 'loading' && campaigns.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Loading flash deals…
          </div>
        ) : paged.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <CalendarClock size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No campaigns found</p>
            <p className="mt-1 text-xs text-slate-500">
              {campaigns.length === 0
                ? 'Create your first flash deal campaign to get started.'
                : 'Try a different filter or search term.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                    Date window
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Slots</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((campaign) => {
                  const expanded = expandedCampaignId === campaign.id
                  const soldTotal = campaign.slots.reduce(
                    (sum, slot) => sum + slot.items.reduce((s, item) => s + item.soldStock, 0),
                    0,
                  )
                  return (
                    <Fragment key={campaign.id}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleCampaign(campaign.id)}
                            className="inline-flex cursor-pointer items-start gap-2 text-left no-underline hover:no-underline"
                          >
                            <ChevronRight
                              size={15}
                              className={`mt-0.5 flex-shrink-0 text-slate-400 transition-transform ${
                                expanded ? 'rotate-90' : ''
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-900 hover:text-emerald-700">
                                {campaign.title}
                              </p>
                              {campaign.description && (
                                <p className="mt-0.5 max-w-[300px] truncate text-xs text-slate-500">
                                  {campaign.description}
                                </p>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <p className="whitespace-nowrap">
                            {formatDate(campaign.startTime)} · {formatTime(campaign.startTime)} →{' '}
                            {formatTime(campaign.endTime)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge label={campaign.status} className={campaignBadge(campaign.status)} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-900">{campaign.slots.length}</p>
                          <p className="text-[11px] text-slate-500">
                            {soldTotal > 0 ? `${soldTotal} sold` : 'no sales yet'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(campaign.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleCampaign(campaign.id)}
                            className="cursor-pointer text-xs font-medium text-emerald-700 hover:text-emerald-800 no-underline hover:no-underline"
                          >
                            {expanded ? 'Collapse' : 'Open slots'}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/60 px-4 pb-4 pt-1">
                            <SlotsPanel
                              campaign={campaign}
                              expandedSlotId={expandedSlotId}
                              onToggleSlot={toggleSlot}
                              busyKey={busyKey}
                              onOpenSlotModal={() => setSlotModalCampaign(campaign)}
                              onOpenAllocateModal={(slot) => setAllocateSlot(slot)}
                              onToggleSlotStatus={handleToggleSlotStatus}
                              onToggleItemStatus={handleToggleItemStatus}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <DataTablePagination
          page={safePage}
          totalPages={pageCount}
          rowsPerPage={PAGE_SIZE}
          totalItems={filtered.length}
          onPageChange={setPage}
          onRowsPerPageChange={() => {
            // Page size is fixed for the compact layout.
          }}
          rowsPerPageOptions={[PAGE_SIZE]}
          itemLabel="campaigns"
        />
      </div>

      <CampaignModal open={campaignOpen} onClose={() => setCampaignOpen(false)} />
      {slotModalCampaign && (
        <SlotModal
          key={slotModalCampaign.id}
          campaign={slotModalCampaign}
          open
          onClose={() => setSlotModalCampaign(null)}
        />
      )}
      {allocateSlot && (
        <AllocateItemsModal
          key={allocateSlot.id}
          slot={allocateSlot}
          open
          onClose={() => setAllocateSlot(null)}
        />
      )}
    </div>
  )
}

export default FlashDealsAdminPage