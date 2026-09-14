import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { useAuthRole } from '@/app/rbac/hooks'
import {
  promotionApi,
  type PromotionAssetKind,
  type PromotionConditionRecord,
  type PromotionRecord,
  type PromotionRewardRecord,
  type PromotionTargetRecord,
} from '../api/promotionApi'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Layers3,
  MoreHorizontal,
  Percent,
  Plus,
  Search,
  Sparkles,
  Store,
  Target,
  X,
} from 'lucide-react'

type PromotionStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED' | 'EXPIRED'
type RewardType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
type ManagementTab = 'rewards' | 'conditions' | 'targets'
type OwnerType = 'PLATFORM' | 'SELLER'
type PromotionScope = 'PRODUCT' | 'CATEGORY' | 'SHOP' | 'ORDER' | 'SHIPPING'
type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'FREE_SHIPPING' | 'BUNDLE'
type TargetType = 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'SHOP'
type AssetMode = 'create' | 'edit'

type PromotionCreatePayload = {
  owner_type: OwnerType
  shop_id: string | null
  scope: PromotionScope
  name: string
  description: string | null
  promotion_type: PromotionType
  priority: number
  stackable: boolean
  start_at: string
  end_at: string | null
  status: PromotionStatus
}

type PromotionListItem = {
  id: string
  name: string
  scope: PromotionScope
  reward: string
  status: PromotionStatus
  audience: string
  priority: number
  stackable: boolean
  starts: string
  ends: string
  accent: string
  record: PromotionRecord
}

type PromotionAsset = {
  id: string
  promotionId: string
  promotion: string
  detail: string
  rewardType?: RewardType
  percentage?: string
  fixedAmount?: string
  maxDiscount?: string
  conditionType?: string
  operator?: string
  value?: string
  targetType?: TargetType
  targetId?: string
}

type AssetFormState = {
  promotionId: string
  rewardType: RewardType
  percentage: string
  fixedAmount: string
  maxDiscount: string
  conditionType: string
  operator: string
  value: string
  targetType: TargetType
  targetId: string
}

const STATUS_STYLES: Record<PromotionStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  PAUSED: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  EXPIRED: 'bg-rose-50 text-rose-700 ring-rose-600/15',
}

const STATUS_ACCENTS: Record<PromotionStatus, string> = {
  ACTIVE: 'bg-emerald-500',
  DRAFT: 'bg-slate-400',
  PAUSED: 'bg-amber-500',
  EXPIRED: 'bg-rose-500',
}

const DEFAULT_ASSET_FORM: AssetFormState = {
  promotionId: '',
  rewardType: 'PERCENTAGE',
  percentage: '10',
  fixedAmount: '25',
  maxDiscount: '50',
  conditionType: 'MINIMUM_ORDER_AMOUNT',
  operator: 'GTE',
  value: '{"amount":100}',
  targetType: 'SHOP',
  targetId: '',
}

const toNullableString = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'No end date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const rewardLabel = (type: PromotionType) => {
  if (type === 'PERCENTAGE') return 'Percentage reward'
  if (type === 'FIXED_AMOUNT') return 'Fixed amount reward'
  if (type === 'FREE_SHIPPING') return 'Free shipping'
  if (type === 'BUY_X_GET_Y') return 'Buy X get Y'
  return 'Bundle offer'
}

const toListItem = (record: PromotionRecord): PromotionListItem => ({
  id: record.id,
  name: record.name,
  scope: record.scope,
  reward: rewardLabel(record.promotion_type),
  status: record.status,
  audience: record.owner_type === 'PLATFORM' ? 'All shoppers' : 'Active shop customers',
  priority: record.priority,
  stackable: record.stackable,
  starts: formatDate(record.start_at),
  ends: formatDate(record.end_at),
  accent: STATUS_ACCENTS[record.status],
  record,
})

const toUpdatePayload = (record: PromotionRecord, status: PromotionStatus) => ({
  owner_type: record.owner_type,
  ...(record.shop_id ? { shop_id: record.shop_id } : {}),
  scope: record.scope,
  name: record.name,
  ...(record.description ? { description: record.description } : {}),
  promotion_type: record.promotion_type,
  priority: record.priority,
  stackable: record.stackable,
  start_at: record.start_at,
  ...(record.end_at ? { end_at: record.end_at } : {}),
  status,
})

const toAsset = (
  kind: PromotionAssetKind,
  record: PromotionRewardRecord | PromotionConditionRecord | PromotionTargetRecord,
  promotionNameById: Map<string, string>,
): PromotionAsset => {
  if (kind === 'rewards') {
    const reward = record as PromotionRewardRecord
    const amount = reward.reward_type === 'PERCENTAGE'
      ? `${reward.percentage ?? 0}%`
      : reward.reward_type === 'FIXED_AMOUNT'
        ? `$${reward.fixed_amount ?? 0}`
        : 'Free shipping'
    const max = reward.max_discount_amount != null ? ` · max $${reward.max_discount_amount}` : ''
    return {
      id: reward.id,
      promotionId: reward.promotion_id,
      promotion: promotionNameById.get(reward.promotion_id) ?? reward.promotion_id,
      detail: `${reward.reward_type} · ${amount}${max}`,
      rewardType: reward.reward_type,
      percentage: reward.percentage != null ? String(reward.percentage) : '10',
      fixedAmount: reward.fixed_amount != null ? String(reward.fixed_amount) : '25',
      maxDiscount: reward.max_discount_amount != null ? String(reward.max_discount_amount) : '',
    }
  }

  if (kind === 'conditions') {
    const condition = record as PromotionConditionRecord
    return {
      id: condition.id,
      promotionId: condition.promotion_id,
      promotion: promotionNameById.get(condition.promotion_id) ?? condition.promotion_id,
      detail: `${condition.condition_type} · ${condition.operator} · ${JSON.stringify(condition.value)}`,
      conditionType: condition.condition_type,
      operator: condition.operator,
      value: JSON.stringify(condition.value ?? {}, null, 2),
    }
  }

  const target = record as PromotionTargetRecord
  return {
    id: target.id,
    promotionId: target.promotion_id,
    promotion: promotionNameById.get(target.promotion_id) ?? target.promotion_id,
    detail: `${target.target_type} · ${target.target_id}`,
    targetType: target.target_type,
    targetId: target.target_id,
  }
}

const buildAssetPayload = (kind: ManagementTab, form: AssetFormState) => {
  if (kind === 'rewards') {
    return {
      promotion_id: form.promotionId,
      reward_type: form.rewardType,
      percentage: form.rewardType === 'PERCENTAGE' ? Number(form.percentage) : undefined,
      fixed_amount: form.rewardType === 'FIXED_AMOUNT' ? Number(form.fixedAmount) : undefined,
      max_discount_amount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
    }
  }
  if (kind === 'conditions') {
    return {
      promotion_id: form.promotionId,
      condition_type: form.conditionType,
      operator: form.operator,
      value: JSON.parse(form.value) as Record<string, unknown>,
    }
  }
  return {
    promotion_id: form.promotionId,
    target_type: form.targetType,
    target_id: form.targetId,
  }
}

const PromotionEnginePage = () => {
  const authUser = useAppSelector((state) => state.auth.user)
  const authRole = useAuthRole()
  const isPlatformAdmin = authRole === 'SUPER_ADMIN'
  const isShopOwner = authRole === 'SHOP_OWNER'
  const canManagePromotionAssets = isPlatformAdmin || isShopOwner
  const activeShopId = authUser?.active_shop_id

  const [promotions, setPromotions] = useState<PromotionListItem[]>([])
  const [promotionsLoading, setPromotionsLoading] = useState(true)
  const [promotionsError, setPromotionsError] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | PromotionStatus>('all')
  const [search, setSearch] = useState('')
  const [showFullCreate, setShowFullCreate] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [managementTab, setManagementTab] = useState<ManagementTab>('rewards')
  const [assets, setAssets] = useState<Record<ManagementTab, PromotionAsset[]>>({
    rewards: [],
    conditions: [],
    targets: [],
  })
  const [assetError, setAssetError] = useState<string | null>(null)
  const [assetModalOpen, setAssetModalOpen] = useState(false)
  const [assetMode, setAssetMode] = useState<AssetMode>('create')
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [assetForm, setAssetForm] = useState<AssetFormState>(DEFAULT_ASSET_FORM)
  const [assetSaving, setAssetSaving] = useState(false)

  const promotionNameById = useMemo(
    () => new Map(promotions.map((promotion) => [promotion.id, promotion.name])),
    [promotions],
  )

  const defaultAssetPromotionId = useMemo(() => {
    if (selectedId) return selectedId
    if (promotions[0]?.id) return promotions[0].id
    return ''
  }, [promotions, selectedId])

  useEffect(() => {
    let cancelled = false
    setPromotionsLoading(true)
    promotionApi.listPromotions()
      .then((records) => {
        if (cancelled) return
        const items = records.map(toListItem)
        setPromotions(items)
        setSelectedId((current) => current || items[0]?.id || '')
        setPromotionsError(null)
      })
      .catch(() => {
        if (cancelled) return
        setPromotions([])
        setPromotionsError('Could not load promotions. Check the promotion service connection.')
      })
      .finally(() => {
        if (!cancelled) setPromotionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!canManagePromotionAssets) return
    let cancelled = false
    Promise.all((['rewards', 'conditions', 'targets'] as ManagementTab[]).map(async (kind) => {
      const records = await promotionApi.list<PromotionRewardRecord | PromotionConditionRecord | PromotionTargetRecord>(kind)
      return [kind, records] as const
    }))
      .then((results) => {
        if (cancelled) return
        const next = Object.fromEntries(
          results.map(([kind, records]) => [
            kind,
            records.map((record) => toAsset(kind, record, new Map())),
          ]),
        ) as Record<ManagementTab, PromotionAsset[]>
        setAssets(next)
        setAssetError(null)
      })
      .catch(() => {
        if (!cancelled) setAssetError('Could not load promotion rewards, conditions, and targets.')
      })
    return () => {
      cancelled = true
    }
  }, [canManagePromotionAssets])

  useEffect(() => {
    if (promotionNameById.size === 0) return
    setAssets((current) => ({
      rewards: current.rewards.map((asset) => ({
        ...asset,
        promotion: promotionNameById.get(asset.promotionId) ?? asset.promotion,
      })),
      conditions: current.conditions.map((asset) => ({
        ...asset,
        promotion: promotionNameById.get(asset.promotionId) ?? asset.promotion,
      })),
      targets: current.targets.map((asset) => ({
        ...asset,
        promotion: promotionNameById.get(asset.promotionId) ?? asset.promotion,
      })),
    }))
  }, [promotionNameById])

  const filteredPromotions = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()
    return promotions.filter((promotion) => {
      const matchesTab = activeTab === 'all' || promotion.status === activeTab
      const matchesSearch = !normalizedSearch
        || `${promotion.name} ${promotion.scope} ${promotion.audience} ${promotion.reward}`.toLowerCase().includes(normalizedSearch)
      return matchesTab && matchesSearch
    })
  }, [activeTab, promotions, search])

  const selectedPromotion = promotions.find((promotion) => promotion.id === selectedId) ?? filteredPromotions[0]
  const activeCount = promotions.filter((promotion) => promotion.status === 'ACTIVE').length
  const targetCoverage = assets.targets.length

  const createPromotion = async (payload: PromotionCreatePayload) => {
    try {
      const created = await promotionApi.createPromotion(payload)
      const item = toListItem(created)
      setPromotions((current) => [item, ...current])
      setSelectedId(item.id)
      setShowFullCreate(false)
      setPromotionsError(null)
      setAssetError(null)
    } catch {
      setAssetError('Could not create the promotion. Check the service connection and fields.')
    }
  }

  const togglePromotion = async (promotion: PromotionListItem) => {
    const nextStatus: PromotionStatus = promotion.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setStatusUpdatingId(promotion.id)
    try {
      const updated = await promotionApi.updatePromotion(promotion.id, toUpdatePayload(promotion.record, nextStatus))
      const item = toListItem(updated)
      setPromotions((current) => current.map((entry) => (entry.id === item.id ? item : entry)))
      setPromotionsError(null)
    } catch {
      setPromotionsError(`Could not ${nextStatus === 'ACTIVE' ? 'activate' : 'pause'} this promotion.`)
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const openCreateAsset = () => {
    setAssetMode('create')
    setEditingAssetId(null)
    setAssetForm({
      ...DEFAULT_ASSET_FORM,
      promotionId: defaultAssetPromotionId,
      targetId: activeShopId ?? '',
    })
    setAssetModalOpen(true)
  }

  const openEditAsset = (asset: PromotionAsset) => {
    setAssetMode('edit')
    setEditingAssetId(asset.id)
    setAssetForm({
      promotionId: asset.promotionId,
      rewardType: asset.rewardType ?? 'PERCENTAGE',
      percentage: asset.percentage ?? '10',
      fixedAmount: asset.fixedAmount ?? '25',
      maxDiscount: asset.maxDiscount ?? '',
      conditionType: asset.conditionType ?? 'MINIMUM_ORDER_AMOUNT',
      operator: asset.operator ?? 'GTE',
      value: asset.value ?? '{"amount":100}',
      targetType: asset.targetType ?? 'SHOP',
      targetId: asset.targetId ?? activeShopId ?? '',
    })
    setAssetModalOpen(true)
  }

  const saveAsset = async () => {
    setAssetSaving(true)
    try {
      const payload = buildAssetPayload(managementTab, assetForm)
      const record = assetMode === 'create'
        ? await promotionApi.create<PromotionRewardRecord | PromotionConditionRecord | PromotionTargetRecord>(managementTab, payload)
        : await promotionApi.update<PromotionRewardRecord | PromotionConditionRecord | PromotionTargetRecord>(managementTab, editingAssetId!, payload)
      const asset = toAsset(managementTab, record, promotionNameById)
      setAssets((current) => ({
        ...current,
        [managementTab]: assetMode === 'create'
          ? [asset, ...current[managementTab]]
          : current[managementTab].map((item) => (item.id === asset.id ? asset : item)),
      }))
      setAssetError(null)
      setAssetModalOpen(false)
    } catch {
      setAssetError(`Could not ${assetMode === 'create' ? 'create' : 'update'} this ${managementTab.slice(0, -1)}. Check the values and JSON.`)
    } finally {
      setAssetSaving(false)
    }
  }

  const removeAsset = async (id: string) => {
    try {
      await promotionApi.remove(managementTab, id)
      setAssets((current) => ({
        ...current,
        [managementTab]: current[managementTab].filter((asset) => asset.id !== id),
      }))
      setAssetError(null)
    } catch {
      setAssetError(`Could not delete this ${managementTab.slice(0, -1)}.`)
    }
  }

  const updateAssetForm = <K extends keyof AssetFormState>(key: K, value: AssetFormState[K]) => {
    setAssetForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
            <Sparkles size={15} /> Promotion engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Turn attention into action</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Build targeted offers, control stacking, and keep every promotion easy to understand.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowFullCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus size={17} /> Create promotion
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon={Percent} label="Active promotions" value={String(activeCount)} detail="Across your workspace" tone="emerald" />
        <MetricCard icon={CircleDollarSign} label="Total promotions" value={String(promotions.length)} detail="Loaded from promotion service" tone="sky" />
        <MetricCard icon={Target} label="Target coverage" value={String(targetCoverage)} detail="Configured promotion targets" tone="violet" />
      </div>

      {(promotionsError || assetError) && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {promotionsError ?? assetError}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 pt-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-slate-950">Promotions</h2>
                <p className="mt-1 text-xs text-slate-500">Manage live offers and upcoming campaigns.</p>
              </div>
              <div className="relative w-full sm:w-56">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search promotions"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-5 overflow-x-auto text-xs font-semibold">
              {(['all', 'ACTIVE', 'DRAFT', 'PAUSED', 'EXPIRED'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 pb-3 whitespace-nowrap transition ${activeTab === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  {tab === 'all' ? 'All promotions' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {promotionsLoading && (
              <div className="px-5 py-14 text-center text-sm text-slate-500">Loading promotions…</div>
            )}
            {!promotionsLoading && filteredPromotions.map((promotion) => (
              <button
                key={promotion.id}
                type="button"
                onClick={() => setSelectedId(promotion.id)}
                className={`flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 ${selectedPromotion?.id === promotion.id ? 'bg-emerald-50/40' : ''}`}
              >
                <span className={`h-10 w-1 rounded-full ${promotion.accent}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{promotion.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${STATUS_STYLES[promotion.status]}`}>
                      {promotion.status}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{promotion.scope}</span>
                    <span>{promotion.audience}</span>
                    <span>Priority {promotion.priority}</span>
                  </span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-bold text-slate-900">{promotion.reward}</span>
                  <span className="mt-1 block text-[11px] text-slate-500">{promotion.starts}</span>
                </span>
                <ChevronDown size={16} className="-rotate-90 text-slate-400" />
              </button>
            ))}
            {!promotionsLoading && filteredPromotions.length === 0 && (
              <div className="px-5 py-14 text-center text-sm text-slate-500">No promotions match this view.</div>
            )}
          </div>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          {selectedPromotion ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Promotion detail</span>
                  <h2 className="mt-2 text-xl font-bold">{selectedPromotion.name}</h2>
                </div>
                <button type="button" aria-label="More promotion actions" className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <DetailCell label="Reward" value={selectedPromotion.reward} />
                <DetailCell label="Scope" value={selectedPromotion.scope} />
                <DetailCell label="Audience" value={selectedPromotion.audience} />
                <DetailCell label="Status" value={selectedPromotion.status} />
              </div>
              <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CalendarDays size={16} className="text-emerald-300" />
                  <span>
                    {selectedPromotion.starts} <span className="text-slate-500">to</span> {selectedPromotion.ends}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Layers3 size={16} className="text-emerald-300" />
                  <span>{selectedPromotion.stackable ? 'Stacking is enabled for this offer' : 'Stacking is disabled for this offer'}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={statusUpdatingId === selectedPromotion.id}
                onClick={() => void togglePromotion(selectedPromotion)}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedPromotion.status === 'ACTIVE' ? (
                  <><Clock3 size={15} /> {statusUpdatingId === selectedPromotion.id ? 'Pausing…' : 'Pause promotion'}</>
                ) : (
                  <><Check size={15} /> {statusUpdatingId === selectedPromotion.id ? 'Activating…' : 'Activate promotion'}</>
                )}
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-300">Select a promotion to inspect it.</p>
          )}
        </aside>
      </div>

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Store size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {isPlatformAdmin ? 'Platform promotion workspace' : 'Shop promotion workspace'}
            </p>
            <p className="text-xs text-slate-500">
              {isPlatformAdmin
                ? 'Offers can apply across the marketplace.'
                : activeShopId
                  ? `Connected to shop ${activeShopId.slice(0, 8)}…`
                  : 'Choose an active shop to target offers.'}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <ArrowUpRight size={15} /> Ready to launch
        </span>
      </div>

      {canManagePromotionAssets && (
        <PromotionAssetManager
          isPlatformAdmin={isPlatformAdmin}
          activeTab={managementTab}
          assets={assets[managementTab]}
          onTabChange={setManagementTab}
          onAdd={openCreateAsset}
          onEdit={openEditAsset}
          onRemove={removeAsset}
        />
      )}

      <PromotionCreateModal
        open={showFullCreate}
        isPlatformAdmin={isPlatformAdmin}
        activeShopId={activeShopId}
        onClose={() => setShowFullCreate(false)}
        onCreate={createPromotion}
      />

      <PromotionAssetFormModal
        open={assetModalOpen}
        mode={assetMode}
        kind={managementTab}
        form={assetForm}
        saving={assetSaving}
        promotions={promotions}
        onClose={() => setAssetModalOpen(false)}
        onChange={updateAssetForm}
        onSubmit={saveAsset}
      />
    </section>
  )
}

const MetricCard = ({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Percent
  label: string
  value: string
  detail: string
  tone: 'emerald' | 'sky' | 'violet'
}) => {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">{detail}</p>
    </div>
  )
}

const DetailCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-white/5 p-3">
    <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-xs font-semibold text-slate-100">{value}</p>
  </div>
)

const PromotionAssetManager = ({
  isPlatformAdmin,
  activeTab,
  assets,
  onTabChange,
  onAdd,
  onEdit,
  onRemove,
}: {
  isPlatformAdmin: boolean
  activeTab: ManagementTab
  assets: PromotionAsset[]
  onTabChange: (tab: ManagementTab) => void
  onAdd: () => void
  onEdit: (asset: PromotionAsset) => void
  onRemove: (id: string) => void
}) => {
  const labels: Record<ManagementTab, string> = {
    rewards: 'Rewards',
    conditions: 'Conditions',
    targets: 'Targets',
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Layers3 size={17} className="text-violet-600" />
            <h2 className="text-base font-bold text-slate-950">Promotion building blocks</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isPlatformAdmin
              ? 'Control how platform offers are rewarded, qualified, and targeted.'
              : 'Define rewards, conditions, and targets for your shop promotions.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
        >
          <Plus size={15} /> Add {activeTab.slice(0, -1)}
        </button>
      </div>
      <div className="flex gap-1 border-b border-slate-100 px-5 pt-3">
        {(['rewards', 'conditions', 'targets'] as ManagementTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`border-b-2 px-3 pb-3 text-xs font-semibold ${activeTab === tab ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {labels[tab]}
          </button>
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {assets.map((asset) => (
          <div key={asset.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              {activeTab === 'rewards' ? <CircleDollarSign size={17} /> : activeTab === 'conditions' ? <Check size={17} /> : <Target size={17} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{asset.promotion}</p>
              <p className="mt-1 text-xs text-slate-500">{asset.detail}</p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(asset)}
              aria-label={`Edit ${labels[activeTab].toLowerCase()} item`}
              className="rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRemove(asset.id)}
              aria-label={`Delete ${labels[activeTab].toLowerCase()} item`}
              className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <X size={15} />
            </button>
          </div>
        ))}
        {assets.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No {labels[activeTab].toLowerCase()} configured.</p>
        )}
      </div>
    </section>
  )
}

type PromotionCreateModalProps = {
  open: boolean
  isPlatformAdmin: boolean
  activeShopId: string | null | undefined
  onClose: () => void
  onCreate: (payload: PromotionCreatePayload) => Promise<void>
}

const PromotionCreateModal = ({ open, isPlatformAdmin, activeShopId, onClose, onCreate }: PromotionCreateModalProps) => {
  const [ownerType, setOwnerType] = useState<OwnerType>(isPlatformAdmin ? 'PLATFORM' : 'SELLER')
  const [shopId, setShopId] = useState(activeShopId ?? '')
  const [scope, setScope] = useState<PromotionScope>('ORDER')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [promotionType, setPromotionType] = useState<PromotionType>('PERCENTAGE')
  const [priority, setPriority] = useState('0')
  const [stackable, setStackable] = useState(false)
  const [startAt, setStartAt] = useState('2026-09-11T00:00')
  const [endAt, setEndAt] = useState('')
  const [status, setStatus] = useState<PromotionStatus>('DRAFT')

  if (!open) return null

  const submit = async () => {
    const resolvedOwnerType: OwnerType = isPlatformAdmin ? ownerType : 'SELLER'
    const resolvedShopId = isPlatformAdmin
      ? toNullableString(shopId)
      : (toNullableString(activeShopId) ?? toNullableString(shopId))
    const priorityValue = Number(priority)
    await onCreate({
      owner_type: resolvedOwnerType,
      shop_id: resolvedShopId,
      scope,
      name: name.trim() || 'New promotion',
      description: toNullableString(description),
      promotion_type: promotionType,
      priority: Number.isFinite(priorityValue) ? priorityValue : 0,
      stackable,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      status,
    })
  }

  return (
    <ModalShell title="Create promotion" eyebrow="New campaign" onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Owner type">
          <select
            value={ownerType}
            onChange={(event) => setOwnerType(event.target.value as OwnerType)}
            disabled={!isPlatformAdmin}
            className={INPUT_CLASS}
          >
            {isPlatformAdmin && <option value="PLATFORM">Platform</option>}
            <option value="SELLER">Seller</option>
          </select>
        </FormField>
        <FormField label="Shop ID" hint="Required for seller promotions">
          <input
            value={shopId}
            onChange={(event) => setShopId(event.target.value)}
            placeholder="UUID or leave blank"
            disabled={!isPlatformAdmin && Boolean(activeShopId)}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Scope">
          <select value={scope} onChange={(event) => setScope(event.target.value as PromotionScope)} className={INPUT_CLASS}>
            {['PRODUCT', 'CATEGORY', 'SHOP', 'ORDER', 'SHIPPING'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </FormField>
        <FormField label="Promotion type">
          <select value={promotionType} onChange={(event) => setPromotionType(event.target.value as PromotionType)} className={INPUT_CLASS}>
            {['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING', 'BUNDLE'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Name">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Weekend checkout offer" className={INPUT_CLASS} />
      </FormField>
      <FormField label="Description">
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="Explain when this promotion applies" className={INPUT_CLASS} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Priority">
          <input type="number" min="0" max="1000" value={priority} onChange={(event) => setPriority(event.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Status">
          <select value={status} onChange={(event) => setStatus(event.target.value as PromotionStatus)} className={INPUT_CLASS}>
            {['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </FormField>
        <FormField label="Start at">
          <input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="End at">
          <input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className={INPUT_CLASS} />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={stackable} onChange={(event) => setStackable(event.target.checked)} className="h-4 w-4 accent-emerald-600" />
        Stackable promotion
      </label>
      <ModalActions onClose={onClose} onSubmit={submit} submitLabel="Create promotion" />
    </ModalShell>
  )
}

type PromotionAssetFormModalProps = {
  open: boolean
  mode: AssetMode
  kind: ManagementTab
  form: AssetFormState
  saving: boolean
  promotions: PromotionListItem[]
  onClose: () => void
  onChange: <K extends keyof AssetFormState>(key: K, value: AssetFormState[K]) => void
  onSubmit: () => Promise<void>
}

const PromotionAssetFormModal = ({
  open,
  mode,
  kind,
  form,
  saving,
  promotions,
  onClose,
  onChange,
  onSubmit,
}: PromotionAssetFormModalProps) => {
  if (!open) return null

  const singular = kind.slice(0, -1)
  const title = mode === 'create' ? `Create ${singular}` : `Edit ${singular}`

  return (
    <ModalShell title={title} eyebrow="Promotion building block" onClose={onClose}>
      <FormField label="Promotion">
        <select
          value={form.promotionId}
          onChange={(event) => onChange('promotionId', event.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Select a promotion</option>
          {promotions.map((promotion) => (
            <option key={promotion.id} value={promotion.id}>
              {promotion.name}
            </option>
          ))}
        </select>
      </FormField>

      {kind === 'rewards' && (
        <>
          <FormField label="Reward type">
            <select
              value={form.rewardType}
              onChange={(event) => onChange('rewardType', event.target.value as RewardType)}
              className={INPUT_CLASS}
            >
              <option value="PERCENTAGE">PERCENTAGE</option>
              <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
              <option value="FREE_SHIPPING">FREE_SHIPPING</option>
            </select>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Percentage">
              <input
                type="number"
                min="0"
                max="100"
                value={form.percentage}
                onChange={(event) => onChange('percentage', event.target.value)}
                disabled={form.rewardType !== 'PERCENTAGE'}
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Fixed amount">
              <input
                type="number"
                min="0"
                value={form.fixedAmount}
                onChange={(event) => onChange('fixedAmount', event.target.value)}
                disabled={form.rewardType !== 'FIXED_AMOUNT'}
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Max discount">
              <input
                type="number"
                min="0"
                value={form.maxDiscount}
                onChange={(event) => onChange('maxDiscount', event.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>
          </div>
        </>
      )}

      {kind === 'conditions' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Condition type">
              <input
                value={form.conditionType}
                onChange={(event) => onChange('conditionType', event.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Operator">
              <input
                value={form.operator}
                onChange={(event) => onChange('operator', event.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>
          </div>
          <FormField label="Value (JSONB)">
            <textarea
              value={form.value}
              onChange={(event) => onChange('value', event.target.value)}
              rows={5}
              className={`${INPUT_CLASS} font-mono text-xs`}
            />
          </FormField>
        </>
      )}

      {kind === 'targets' && (
        <>
          <FormField label="Target type">
            <select
              value={form.targetType}
              onChange={(event) => onChange('targetType', event.target.value as TargetType)}
              className={INPUT_CLASS}
            >
              {['PRODUCT', 'CATEGORY', 'BRAND', 'SHOP'].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Target ID">
            <input
              value={form.targetId}
              onChange={(event) => onChange('targetId', event.target.value)}
              placeholder="UUID"
              className={INPUT_CLASS}
            />
          </FormField>
        </>
      )}

      <ModalActions
        onClose={onClose}
        onSubmit={onSubmit}
        submitLabel={saving ? 'Saving…' : mode === 'create' ? `Create ${singular}` : `Save ${singular}`}
        disabled={saving || !form.promotionId}
      />
    </ModalShell>
  )
}

const INPUT_CLASS = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100'

const FormField = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-slate-700">
    {label}
    {hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}
    {children}
  </label>
)

const ModalShell = ({
  eyebrow,
  title,
  onClose,
  children,
}: {
  eyebrow: string
  title: string
  onClose: () => void
  children: React.ReactNode
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X size={18} />
        </button>
      </div>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  </div>
)

const ModalActions = ({
  onClose,
  onSubmit,
  submitLabel,
  disabled = false,
}: {
  onClose: () => void
  onSubmit: () => Promise<void>
  submitLabel: string
  disabled?: boolean
}) => (
  <div className="flex justify-end gap-3 pt-2">
    <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
      Cancel
    </button>
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onSubmit()}
      className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {submitLabel}
    </button>
  </div>
)

export default PromotionEnginePage
