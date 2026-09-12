import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { useAuthRole } from '@/app/rbac/hooks'
import { promotionApi, type PromotionAssetKind, type PromotionConditionRecord, type PromotionRewardRecord, type PromotionTargetRecord } from '../api/promotionApi'
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

type PromotionAsset = {
  id: string
  promotionId: string
  promotion: string
  detail: string
  status: 'Ready' | 'Draft'
}

type Promotion = {
  id: string
  name: string
  scope: 'ORDER' | 'PRODUCT' | 'SHOP'
  reward: string
  rewardType: RewardType
  status: PromotionStatus
  audience: string
  performance: string
  starts: string
  ends: string
  accent: string
}

const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'platform-welcome',
    name: 'Platform welcome discount',
    scope: 'ORDER',
    reward: '10% off',
    rewardType: 'PERCENTAGE',
    status: 'ACTIVE',
    audience: 'All shoppers',
    performance: '342 uses',
    starts: '01 Jan 2026',
    ends: 'No end date',
    accent: 'bg-emerald-500',
  },
  {
    id: 'main-store-laptop',
    name: 'Main store laptop discount',
    scope: 'PRODUCT',
    reward: '$25 off',
    rewardType: 'FIXED_AMOUNT',
    status: 'ACTIVE',
    audience: 'Main Store customers',
    performance: '86 uses',
    starts: '01 Jan 2026',
    ends: 'No end date',
    accent: 'bg-sky-500',
  },
  {
    id: 'weekend-shipping',
    name: 'Weekend free shipping',
    scope: 'SHOP',
    reward: 'Free shipping',
    rewardType: 'FREE_SHIPPING',
    status: 'DRAFT',
    audience: 'Main Store customers',
    performance: 'Not started',
    starts: '15 Sep 2026',
    ends: '30 Sep 2026',
    accent: 'bg-amber-500',
  },
]

const STATUS_STYLES: Record<PromotionStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  PAUSED: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  EXPIRED: 'bg-rose-50 text-rose-700 ring-rose-600/15',
}

const INITIAL_REWARDS: PromotionAsset[] = [
  { id: 'reward-1', promotionId: 'f3f4a1b2-5c6d-4e7f-8091-a2b3c4d5e6f7', promotion: 'Platform welcome discount', detail: 'PERCENTAGE · 10% · max $50', status: 'Ready' },
  { id: 'reward-2', promotionId: 'a7b8c9d0-1e2f-4a3b-8c5d-6e7f8091a2b3', promotion: 'Main store laptop discount', detail: 'FIXED_AMOUNT · $25', status: 'Ready' },
]

const INITIAL_CONDITIONS: PromotionAsset[] = [
  { id: 'condition-1', promotionId: 'f3f4a1b2-5c6d-4e7f-8091-a2b3c4d5e6f7', promotion: 'Platform welcome discount', detail: 'MINIMUM_ORDER_AMOUNT · GTE · $100', status: 'Ready' },
  { id: 'condition-2', promotionId: 'a7b8c9d0-1e2f-4a3b-8c5d-6e7f8091a2b3', promotion: 'Main store laptop discount', detail: 'USER_SHOP_MEMBER · EQUALS · Main Store', status: 'Ready' },
]

const INITIAL_TARGETS: PromotionAsset[] = [
  { id: 'target-1', promotionId: 'a7b8c9d0-1e2f-4a3b-8c5d-6e7f8091a2b3', promotion: 'Main store laptop discount', detail: 'PRODUCT · Seed laptop', status: 'Ready' },
  { id: 'target-2', promotionId: 'f3f4a1b2-5c6d-4e7f-8091-a2b3c4d5e6f7', promotion: 'Platform welcome discount', detail: 'SHOP · Main Store', status: 'Ready' },
]

const PROMOTION_IDS = {
  platform: 'f3f4a1b2-5c6d-4e7f-8091-a2b3c4d5e6f7',
  seller: 'a7b8c9d0-1e2f-4a3b-8c5d-6e7f8091a2b3',
}

const toAsset = (kind: PromotionAssetKind, record: PromotionRewardRecord | PromotionConditionRecord | PromotionTargetRecord): PromotionAsset => {
  if (kind === 'rewards') {
    const reward = record as PromotionRewardRecord
    const amount = reward.reward_type === 'PERCENTAGE' ? `${reward.percentage}%` : reward.reward_type === 'FIXED_AMOUNT' ? `$${reward.fixed_amount}` : 'Free shipping'
    return { id: reward.id, promotionId: reward.promotion_id, promotion: reward.promotion_id === PROMOTION_IDS.platform ? 'Platform welcome discount' : 'Main store laptop discount', detail: `${reward.reward_type} · ${amount}`, status: 'Ready' }
  }
  if (kind === 'conditions') {
    const condition = record as PromotionConditionRecord
    return { id: condition.id, promotionId: condition.promotion_id, promotion: condition.promotion_id === PROMOTION_IDS.platform ? 'Platform welcome discount' : 'Main store laptop discount', detail: `${condition.condition_type} · ${condition.operator} · ${JSON.stringify(condition.value)}`, status: 'Ready' }
  }
  const target = record as PromotionTargetRecord
  return { id: target.id, promotionId: target.promotion_id, promotion: target.promotion_id === PROMOTION_IDS.platform ? 'Platform welcome discount' : 'Main store laptop discount', detail: `${target.target_type} · ${target.target_id}`, status: 'Ready' }
}

const PromotionEnginePage = () => {
  const authUser = useAppSelector((state) => state.auth.user)
  const authRole = useAuthRole()
  const isPlatformAdmin = authRole === 'SUPER_ADMIN'
  const activeShopId = authUser?.active_shop_id
  const [promotions, setPromotions] = useState(INITIAL_PROMOTIONS)
  const [activeTab, setActiveTab] = useState<'all' | PromotionStatus>('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showFullCreate, setShowFullCreate] = useState(false)
  const [selectedId, setSelectedId] = useState(INITIAL_PROMOTIONS[0]?.id ?? '')
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newOwnerType, setNewOwnerType] = useState<OwnerType>(isPlatformAdmin ? 'PLATFORM' : 'SELLER')
  const [newShopId, setNewShopId] = useState(activeShopId ?? '')
  const [newScope, setNewScope] = useState<PromotionScope>('ORDER')
  const [newPromotionType, setNewPromotionType] = useState<PromotionType>('PERCENTAGE')
  const [newPriority, setNewPriority] = useState('0')
  const [newStackable, setNewStackable] = useState(false)
  const [newStartAt, setNewStartAt] = useState('2026-09-11T00:00')
  const [newEndAt, setNewEndAt] = useState('')
  const [newStatus, setNewStatus] = useState<PromotionStatus>('DRAFT')
  const [newReward, setNewReward] = useState<RewardType>('PERCENTAGE')
  const [newValue, setNewValue] = useState('10')
  const [showAssetCreate, setShowAssetCreate] = useState(false)
  const [assetPromotionId, setAssetPromotionId] = useState(PROMOTION_IDS.platform)
  const [assetRewardType, setAssetRewardType] = useState<RewardType>('PERCENTAGE')
  const [assetPercentage, setAssetPercentage] = useState('10')
  const [assetFixedAmount, setAssetFixedAmount] = useState('25')
  const [assetMaxDiscount, setAssetMaxDiscount] = useState('50')
  const [assetConditionType, setAssetConditionType] = useState('MINIMUM_ORDER_AMOUNT')
  const [assetOperator, setAssetOperator] = useState('GTE')
  const [assetValue, setAssetValue] = useState('{"amount":100}')
  const [assetTargetType, setAssetTargetType] = useState<'PRODUCT' | 'CATEGORY' | 'BRAND' | 'SHOP'>('SHOP')
  const [assetTargetId, setAssetTargetId] = useState(activeShopId ?? '')
  const [managementTab, setManagementTab] = useState<ManagementTab>('rewards')
  const [assets, setAssets] = useState<Record<ManagementTab, PromotionAsset[]>>({
    rewards: INITIAL_REWARDS,
    conditions: INITIAL_CONDITIONS,
    targets: INITIAL_TARGETS,
  })
  const [assetError, setAssetError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPlatformAdmin) return
    Promise.all((['rewards', 'conditions', 'targets'] as ManagementTab[]).map(async (kind) => {
      const records = await promotionApi.list<PromotionRewardRecord | PromotionConditionRecord | PromotionTargetRecord>(kind)
      return [kind, records.map((record) => toAsset(kind, record))] as const
    }))
      .then((results) => setAssets(Object.fromEntries(results) as Record<ManagementTab, PromotionAsset[]>))
      .catch(() => setAssetError('Could not load promotion rewards, conditions, and targets.'))
  }, [isPlatformAdmin])

  const filteredPromotions = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()
    return promotions.filter((promotion) => {
      const matchesTab = activeTab === 'all' || promotion.status === activeTab
      const matchesSearch = !normalizedSearch || `${promotion.name} ${promotion.scope} ${promotion.audience}`.toLowerCase().includes(normalizedSearch)
      return matchesTab && matchesSearch
    })
  }, [activeTab, promotions, search])

  const selectedPromotion = promotions.find((promotion) => promotion.id === selectedId) ?? filteredPromotions[0]
  const activeCount = promotions.filter((promotion) => promotion.status === 'ACTIVE').length
  const totalUses = 428

  const createPromotion = async (payload: PromotionCreatePayload) => {
    const name = payload.name
    try {
      const created = await promotionApi.createPromotion(payload)
      const value = payload.promotion_type === 'PERCENTAGE' ? 'Percentage reward' : payload.promotion_type === 'FIXED_AMOUNT' ? 'Fixed amount reward' : payload.promotion_type === 'FREE_SHIPPING' ? 'Free shipping' : payload.promotion_type
      const promotion: Promotion = { id: created.id, name: created.name, scope: created.scope === 'CATEGORY' || created.scope === 'SHIPPING' ? 'ORDER' : created.scope, reward: value, rewardType: payload.promotion_type === 'PERCENTAGE' || payload.promotion_type === 'FIXED_AMOUNT' || payload.promotion_type === 'FREE_SHIPPING' ? payload.promotion_type : 'PERCENTAGE', status: created.status, audience: payload.owner_type === 'PLATFORM' ? 'All shoppers' : 'Active shop customers', performance: 'Not started', starts: payload.start_at, ends: payload.end_at || 'No end date', accent: 'bg-violet-500' }
      setPromotions((current) => [promotion, ...current])
      setSelectedId(promotion.id)
      setNewName('')
      setShowCreate(false)
    } catch {
      setAssetError('Could not create the promotion. Check the service connection and fields.')
    }
  }

  const togglePromotion = (id: string) => {
    setPromotions((current) => current.map((promotion) => promotion.id === id
      ? { ...promotion, status: promotion.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
      : promotion))
  }

  const addAsset = () => {
    setAssetPromotionId(isPlatformAdmin ? PROMOTION_IDS.platform : (activeShopId ?? PROMOTION_IDS.seller))
    setAssetTargetId(activeShopId ?? '')
    setShowAssetCreate(true)
  }

  const createAsset = async () => {
    try {
      const payload = managementTab === 'rewards'
        ? { promotion_id: assetPromotionId, reward_type: assetRewardType, percentage: assetRewardType === 'PERCENTAGE' ? Number(assetPercentage) : undefined, fixed_amount: assetRewardType === 'FIXED_AMOUNT' ? Number(assetFixedAmount) : undefined, max_discount_amount: assetMaxDiscount ? Number(assetMaxDiscount) : undefined }
        : managementTab === 'conditions'
          ? { promotion_id: assetPromotionId, condition_type: assetConditionType, operator: assetOperator, value: JSON.parse(assetValue) as Record<string, unknown> }
          : { promotion_id: assetPromotionId, target_type: assetTargetType, target_id: assetTargetId }
      const record = await promotionApi.create<PromotionRewardRecord | PromotionConditionRecord | PromotionTargetRecord>(managementTab, payload)
      const asset = { ...toAsset(managementTab, record), status: 'Ready' as const }
      setAssets((current) => ({ ...current, [managementTab]: [asset, ...current[managementTab]] }))
      setAssetError(null)
      setShowAssetCreate(false)
    } catch {
      setAssetError(`Could not create this ${managementTab.slice(0, -1)}. Check the values and JSON.`)
    }
  }

  const updateAsset = async (asset: PromotionAsset) => {
    const detail = window.prompt(`Update ${managementTab} detail`, asset.detail)
    if (!detail || detail === asset.detail) return
    try {
      const payload = managementTab === 'rewards'
        ? { promotion_id: asset.promotionId, reward_type: 'PERCENTAGE', percentage: Number.parseFloat(detail) || 10 }
        : managementTab === 'conditions'
          ? { promotion_id: asset.promotionId, condition_type: 'MINIMUM_ORDER_AMOUNT', operator: 'GTE', value: { amount: Number.parseFloat(detail) || 100 } }
          : { promotion_id: asset.promotionId, target_type: 'SHOP', target_id: detail }
      await promotionApi.update(managementTab, asset.id, payload)
      setAssets((current) => ({ ...current, [managementTab]: current[managementTab].map((item) => item.id === asset.id ? { ...item, detail } : item) }))
    } catch {
      setAssetError(`Could not update this ${managementTab.slice(0, -1)}.`)
    }
  }

  const removeAsset = async (id: string) => {
    try {
      await promotionApi.remove(managementTab, id)
      setAssets((current) => ({ ...current, [managementTab]: current[managementTab].filter((asset) => asset.id !== id) }))
    } catch {
      setAssetError(`Could not delete this ${managementTab.slice(0, -1)}.`)
    }
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
        <button type="button" onClick={() => setShowFullCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
          <Plus size={17} /> Create promotion
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon={Percent} label="Active promotions" value={String(activeCount)} detail="Across your workspace" tone="emerald" />
        <MetricCard icon={CircleDollarSign} label="Discount uses" value={String(totalUses)} detail="This promotion cycle" tone="sky" />
        <MetricCard icon={Target} label="Target coverage" value="4" detail="Products, shops & orders" tone="violet" />
      </div>

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
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search promotions" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white" />
              </div>
            </div>
            <div className="mt-5 flex gap-5 overflow-x-auto text-xs font-semibold">
              {(['all', 'ACTIVE', 'DRAFT', 'PAUSED', 'EXPIRED'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`border-b-2 pb-3 whitespace-nowrap transition ${activeTab === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  {tab === 'all' ? 'All promotions' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredPromotions.map((promotion) => (
              <button key={promotion.id} type="button" onClick={() => setSelectedId(promotion.id)} className={`flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 ${selectedPromotion?.id === promotion.id ? 'bg-emerald-50/40' : ''}`}>
                <span className={`h-10 w-1 rounded-full ${promotion.accent}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{promotion.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${STATUS_STYLES[promotion.status]}`}>{promotion.status}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{promotion.scope}</span><span>{promotion.audience}</span><span>{promotion.performance}</span>
                  </span>
                </span>
                <span className="hidden text-right sm:block"><span className="block text-sm font-bold text-slate-900">{promotion.reward}</span><span className="mt-1 block text-[11px] text-slate-500">{promotion.starts}</span></span>
                <ChevronDown size={16} className="-rotate-90 text-slate-400" />
              </button>
            ))}
            {filteredPromotions.length === 0 && <div className="px-5 py-14 text-center text-sm text-slate-500">No promotions match this view.</div>}
          </div>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          {selectedPromotion ? (
            <>
              <div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Promotion detail</span><h2 className="mt-2 text-xl font-bold">{selectedPromotion.name}</h2></div><button type="button" aria-label="More promotion actions" className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"><MoreHorizontal size={18} /></button></div>
              <div className="mt-6 grid grid-cols-2 gap-3"><DetailCell label="Reward" value={selectedPromotion.reward} /><DetailCell label="Scope" value={selectedPromotion.scope} /><DetailCell label="Audience" value={selectedPromotion.audience} /><DetailCell label="Performance" value={selectedPromotion.performance} /></div>
              <div className="mt-6 space-y-3 border-t border-white/10 pt-5"><div className="flex items-center gap-3 text-xs text-slate-300"><CalendarDays size={16} className="text-emerald-300" /><span>{selectedPromotion.starts} <span className="text-slate-500">to</span> {selectedPromotion.ends}</span></div><div className="flex items-center gap-3 text-xs text-slate-300"><Layers3 size={16} className="text-emerald-300" /><span>Stacking is disabled for this offer</span></div></div>
              <button type="button" onClick={() => togglePromotion(selectedPromotion.id)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15">{selectedPromotion.status === 'ACTIVE' ? <><Clock3 size={15} /> Pause promotion</> : <><Check size={15} /> Activate promotion</>}</button>
            </>
          ) : <p className="text-sm text-slate-300">Select a promotion to inspect it.</p>}
        </aside>
      </div>

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Store size={18} /></div><div><p className="text-sm font-semibold text-slate-900">{isPlatformAdmin ? 'Platform promotion workspace' : 'Shop promotion workspace'}</p><p className="text-xs text-slate-500">{isPlatformAdmin ? 'Offers can apply across the marketplace.' : activeShopId ? `Connected to shop ${activeShopId.slice(0, 8)}…` : 'Choose an active shop to target offers.'}</p></div></div><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><ArrowUpRight size={15} /> Ready to launch</span></div>

      {isPlatformAdmin && <PromotionAssetManager activeTab={managementTab} assets={assets[managementTab]} error={assetError} onTabChange={setManagementTab} onAdd={addAsset} onEdit={updateAsset} onRemove={removeAsset} />}

      {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">New campaign</p><h2 className="mt-1 text-xl font-bold text-slate-950">Create promotion</h2></div><button type="button" onClick={() => setShowCreate(false)} aria-label="Close create promotion dialog" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></div><div className="mt-6 space-y-4"><label className="block text-xs font-semibold text-slate-700">Promotion name<input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. Weekend checkout offer" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-700">Reward type<select value={newReward} onChange={(event) => setNewReward(event.target.value as RewardType)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"><option value="PERCENTAGE">Percentage off</option><option value="FIXED_AMOUNT">Fixed amount</option><option value="FREE_SHIPPING">Free shipping</option></select></label><label className="block text-xs font-semibold text-slate-700">Value<input disabled={newReward === 'FREE_SHIPPING'} value={newReward === 'FREE_SHIPPING' ? '' : newValue} onChange={(event) => setNewValue(event.target.value)} placeholder="10" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 focus:border-emerald-500" /></label></div></div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" onClick={createPromotion} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Save as draft</button></div></div></div>}
      <PromotionCreateModal open={showFullCreate} isPlatformAdmin={isPlatformAdmin} activeShopId={activeShopId} onClose={() => setShowFullCreate(false)} onCreate={createPromotion} />
      <PromotionAssetCreateModal open={showAssetCreate} kind={managementTab} promotionId={assetPromotionId} rewardType={assetRewardType} percentage={assetPercentage} fixedAmount={assetFixedAmount} maxDiscount={assetMaxDiscount} conditionType={assetConditionType} operator={assetOperator} value={assetValue} targetType={assetTargetType} targetId={assetTargetId} onClose={() => setShowAssetCreate(false)} onPromotionIdChange={setAssetPromotionId} onRewardTypeChange={setAssetRewardType} onPercentageChange={setAssetPercentage} onFixedAmountChange={setAssetFixedAmount} onMaxDiscountChange={setAssetMaxDiscount} onConditionTypeChange={setAssetConditionType} onOperatorChange={setAssetOperator} onValueChange={setAssetValue} onTargetTypeChange={setAssetTargetType} onTargetIdChange={setAssetTargetId} onCreate={createAsset} />
    </section>
  )
}

const MetricCard = ({ icon: Icon, label, value, detail, tone }: { icon: typeof Percent; label: string; value: string; detail: string; tone: 'emerald' | 'sky' | 'violet' }) => {
  const tones = { emerald: 'bg-emerald-50 text-emerald-700', sky: 'bg-sky-50 text-sky-700', violet: 'bg-violet-50 text-violet-700' }
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div><div className={`rounded-lg p-2.5 ${tones[tone]}`}><Icon size={18} /></div></div><p className="mt-3 text-[11px] text-slate-500">{detail}</p></div>
}

const DetailCell = ({ label, value }: { label: string; value: string }) => <div className="rounded-lg bg-white/5 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xs font-semibold text-slate-100">{value}</p></div>

const PromotionAssetManager = ({ activeTab, assets, error, onTabChange, onAdd, onEdit, onRemove }: { activeTab: ManagementTab; assets: PromotionAsset[]; error: string | null; onTabChange: (tab: ManagementTab) => void; onAdd: () => void; onEdit: (asset: PromotionAsset) => void; onRemove: (id: string) => void }) => {
  const labels: Record<ManagementTab, string> = { rewards: 'Rewards', conditions: 'Conditions', targets: 'Targets' }
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><Layers3 size={17} className="text-violet-600" /><h2 className="text-base font-bold text-slate-950">Promotion building blocks</h2></div><p className="mt-1 text-xs text-slate-500">Platform administrators can control how offers are rewarded, qualified, and targeted.</p></div><button type="button" onClick={onAdd} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"><Plus size={15} /> Add {activeTab.slice(0, -1)}</button></div>{error && <p className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-xs font-medium text-rose-700">{error}</p>}<div className="flex gap-1 border-b border-slate-100 px-5 pt-3">{(['rewards', 'conditions', 'targets'] as ManagementTab[]).map((tab) => <button key={tab} type="button" onClick={() => onTabChange(tab)} className={`border-b-2 px-3 pb-3 text-xs font-semibold ${activeTab === tab ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{labels[tab]}</button>)}</div><div className="divide-y divide-slate-100">{assets.map((asset) => <div key={asset.id} className="flex items-center gap-4 px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">{activeTab === 'rewards' ? <CircleDollarSign size={17} /> : activeTab === 'conditions' ? <Check size={17} /> : <Target size={17} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{asset.promotion}</p><p className="mt-1 text-xs text-slate-500">{asset.detail}</p></div><span className={`hidden rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide sm:inline-flex ${asset.status === 'Ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{asset.status}</span><button type="button" onClick={() => onEdit(asset)} aria-label={`Edit ${labels[activeTab].toLowerCase()} item`} className="rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800">Edit</button><button type="button" onClick={() => onRemove(asset.id)} aria-label={`Delete ${labels[activeTab].toLowerCase()} item`} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X size={15} /></button></div>)}{assets.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No {labels[activeTab].toLowerCase()} configured.</p>}</div></section>
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
    await onCreate({ owner_type: ownerType, shop_id: shopId || null, scope, name: name.trim() || 'New promotion', description: description || null, promotion_type: promotionType, priority: Number(priority) || 0, stackable, start_at: new Date(startAt).toISOString(), end_at: endAt ? new Date(endAt).toISOString() : null, status })
  }

  return <ModalShell title="Create promotion" eyebrow="New campaign" onClose={onClose}>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Owner type"><select value={ownerType} onChange={(event) => setOwnerType(event.target.value as OwnerType)} className={INPUT_CLASS}><option value="PLATFORM">Platform</option><option value="SELLER">Seller</option></select></FormField>
      <FormField label="Shop ID" hint="Required for seller promotions"><input value={shopId} onChange={(event) => setShopId(event.target.value)} placeholder="UUID or leave blank" className={INPUT_CLASS} /></FormField>
      <FormField label="Scope"><select value={scope} onChange={(event) => setScope(event.target.value as PromotionScope)} className={INPUT_CLASS}>{['PRODUCT', 'CATEGORY', 'SHOP', 'ORDER', 'SHIPPING'].map((value) => <option key={value}>{value}</option>)}</select></FormField>
      <FormField label="Promotion type"><select value={promotionType} onChange={(event) => setPromotionType(event.target.value as PromotionType)} className={INPUT_CLASS}>{['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING', 'BUNDLE'].map((value) => <option key={value}>{value}</option>)}</select></FormField>
    </div>
    <FormField label="Name"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Weekend checkout offer" className={INPUT_CLASS} /></FormField>
    <FormField label="Description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="Explain when this promotion applies" className={INPUT_CLASS} /></FormField>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Priority"><input type="number" min="0" max="1000" value={priority} onChange={(event) => setPriority(event.target.value)} className={INPUT_CLASS} /></FormField>
      <FormField label="Status"><select value={status} onChange={(event) => setStatus(event.target.value as PromotionStatus)} className={INPUT_CLASS}>{['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED'].map((value) => <option key={value}>{value}</option>)}</select></FormField>
      <FormField label="Start at"><input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className={INPUT_CLASS} /></FormField>
      <FormField label="End at"><input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className={INPUT_CLASS} /></FormField>
    </div>
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={stackable} onChange={(event) => setStackable(event.target.checked)} className="h-4 w-4 accent-emerald-600" /> Stackable promotion</label>
    <ModalActions onClose={onClose} onSubmit={submit} submitLabel="Create promotion" />
  </ModalShell>
}

const PromotionAssetCreateModal = (props: { open: boolean; kind: ManagementTab; promotionId: string; rewardType: RewardType; percentage: string; fixedAmount: string; maxDiscount: string; conditionType: string; operator: string; value: string; targetType: 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'SHOP'; targetId: string; onClose: () => void; onPromotionIdChange: (value: string) => void; onRewardTypeChange: (value: RewardType) => void; onPercentageChange: (value: string) => void; onFixedAmountChange: (value: string) => void; onMaxDiscountChange: (value: string) => void; onConditionTypeChange: (value: string) => void; onOperatorChange: (value: string) => void; onValueChange: (value: string) => void; onTargetTypeChange: (value: 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'SHOP') => void; onTargetIdChange: (value: string) => void; onCreate: () => Promise<void> }) => {
  if (!props.open) return null
  return <ModalShell title={`Create ${props.kind.slice(0, -1)}`} eyebrow="Promotion building block" onClose={props.onClose}>
    <FormField label="Promotion ID"><input value={props.promotionId} onChange={(event) => props.onPromotionIdChange(event.target.value)} className={INPUT_CLASS} /></FormField>
    {props.kind === 'rewards' && <><FormField label="Reward type"><select value={props.rewardType} onChange={(event) => props.onRewardTypeChange(event.target.value as RewardType)} className={INPUT_CLASS}><option>PERCENTAGE</option><option>FIXED_AMOUNT</option><option>FREE_SHIPPING</option></select></FormField><div className="grid gap-4 sm:grid-cols-3"><FormField label="Percentage"><input type="number" min="0" max="100" value={props.percentage} onChange={(event) => props.onPercentageChange(event.target.value)} className={INPUT_CLASS} /></FormField><FormField label="Fixed amount"><input type="number" min="0" value={props.fixedAmount} onChange={(event) => props.onFixedAmountChange(event.target.value)} className={INPUT_CLASS} /></FormField><FormField label="Max discount"><input type="number" min="0" value={props.maxDiscount} onChange={(event) => props.onMaxDiscountChange(event.target.value)} className={INPUT_CLASS} /></FormField></div></>}
    {props.kind === 'conditions' && <><div className="grid gap-4 sm:grid-cols-2"><FormField label="Condition type"><input value={props.conditionType} onChange={(event) => props.onConditionTypeChange(event.target.value)} className={INPUT_CLASS} /></FormField><FormField label="Operator"><input value={props.operator} onChange={(event) => props.onOperatorChange(event.target.value)} className={INPUT_CLASS} /></FormField></div><FormField label="Value (JSONB)"><textarea value={props.value} onChange={(event) => props.onValueChange(event.target.value)} rows={5} className={`${INPUT_CLASS} font-mono text-xs`} /></FormField></>}
    {props.kind === 'targets' && <><FormField label="Target type"><select value={props.targetType} onChange={(event) => props.onTargetTypeChange(event.target.value as typeof props.targetType)} className={INPUT_CLASS}>{['PRODUCT', 'CATEGORY', 'BRAND', 'SHOP'].map((value) => <option key={value}>{value}</option>)}</select></FormField><FormField label="Target ID"><input value={props.targetId} onChange={(event) => props.onTargetIdChange(event.target.value)} placeholder="UUID" className={INPUT_CLASS} /></FormField></>}
    <ModalActions onClose={props.onClose} onSubmit={props.onCreate} submitLabel={`Create ${props.kind.slice(0, -1)}`} />
  </ModalShell>
}

const INPUT_CLASS = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500'

const FormField = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => <label className="block text-xs font-semibold text-slate-700">{label}{hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}{children}</label>

const ModalShell = ({ eyebrow, title, onClose, children }: { eyebrow: string; title: string; onClose: () => void; children: React.ReactNode }) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2></div><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></div><div className="mt-6 space-y-4">{children}</div></div></div>

const ModalActions = ({ onClose, onSubmit, submitLabel }: { onClose: () => void; onSubmit: () => Promise<void>; submitLabel: string }) => <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" onClick={() => void onSubmit()} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">{submitLabel}</button></div>

export default PromotionEnginePage
