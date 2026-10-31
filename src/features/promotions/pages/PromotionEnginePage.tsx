import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import AdminFlashDealsPage from '@/features/flash-deals/pages/AdminFlashDealsPage'
import { useFlashDealPaths } from '@/features/flash-deals/config/flashDealPaths'
import { useAuthRole } from '@/app/rbac/hooks'
import {
  promotionApi,
  type PromotionAssetKind,
  type PromotionConditionRecord,
  type PromotionCodeRecord,
  type PromotionRecord,
  type PromotionRewardRecord,
  type PromotionTargetRecord,
  type PromotionTargetCatalogProduct,
  type PromotionUsageLimitRecord,
} from '../api/promotionApi'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Flame,
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
type ManagementTab = 'rewards' | 'conditions' | 'targets' | 'codes' | 'usageLimits'
type OwnerType = 'PLATFORM' | 'SELLER'
type PromotionScope = 'PRODUCT' | 'CATEGORY' | 'SHOP' | 'ORDER' | 'SHIPPING'
type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'FREE_SHIPPING' | 'BUNDLE'
type TargetType = 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'SHOP'
type PromotionCodeStatus = PromotionCodeRecord['status']
type UsageLimitType = PromotionUsageLimitRecord['limit_type']
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
  conditionAmount?: string
  conditionUserId?: string
  conditionShopId?: string
  value?: string
  targetType?: TargetType
  targetId?: string
  code?: string
  codeStatus?: PromotionCodeStatus
  reservedByUserId?: string
  expiresAt?: string
  used?: boolean
  limitType?: UsageLimitType
  maxCount?: string
  maxAmount?: string
  shopId?: string
}

type AssetFormState = {
  promotionId: string
  rewardType: RewardType
  percentage: string
  fixedAmount: string
  maxDiscount: string
  conditionType: string
  operator: string
  conditionAmount: string
  conditionUserId: string
  conditionShopId: string
  value: string
  targetType: TargetType
  targetId: string
  code: string
  codeStatus: PromotionCodeStatus
  reservedByUserId: string
  expiresAt: string
  limitType: UsageLimitType
  maxCount: string
  maxAmount: string
  shopId: string
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
  percentage: '',
  fixedAmount: '',
  maxDiscount: '',
  conditionType: 'MINIMUM_ORDER_AMOUNT',
  operator: 'GTE',
  conditionAmount: '',
  conditionUserId: '',
  conditionShopId: '',
  value: '{}',
  targetType: 'PRODUCT',
  targetId: '',
  code: '',
  codeStatus: 'ACTIVE',
  reservedByUserId: '',
  expiresAt: '',
  limitType: 'PER_USER',
  maxCount: '1',
  maxAmount: '',
  shopId: '',
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

const toDateTimeLocal = (value: string | null | undefined): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

const fromDateTimeLocal = (value: string): string | null =>
  value ? new Date(value).toISOString() : null

const parseJsonObject = (value: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null
  } catch {
    return null
  }
}

const ASSET_LABELS: Record<ManagementTab, string> = {
  rewards: 'Rewards',
  conditions: 'Conditions',
  targets: 'Targets',
  codes: 'Promo Codes',
  usageLimits: 'Usage Limits',
}

const ASSET_SINGULAR_LABELS: Record<ManagementTab, string> = {
  rewards: 'reward',
  conditions: 'condition',
  targets: 'target',
  codes: 'promo code',
  usageLimits: 'usage limit',
}

const targetTypeForScope = (scope: PromotionScope | undefined): TargetType | undefined => {
  if (scope === 'PRODUCT') return 'PRODUCT'
  if (scope === 'CATEGORY') return 'CATEGORY'
  if (scope === 'SHOP') return 'SHOP'
  return undefined
}

const promotionScopeSupportsTargets = (scope: PromotionScope | undefined): boolean =>
  scope === 'PRODUCT'

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

const summarizeReward = (asset: PromotionAsset): string => {
  if (asset.rewardType === 'PERCENTAGE') {
    return `${asset.percentage || '0'}% off${asset.maxDiscount ? ` · up to $${asset.maxDiscount}` : ''}`
  }
  if (asset.rewardType === 'FIXED_AMOUNT') {
    return `$${asset.fixedAmount || '0'} off${asset.maxDiscount ? ` · max $${asset.maxDiscount}` : ''}`
  }
  return 'Free shipping'
}

const summarizeCondition = (
  asset: PromotionAsset,
  activeShopId?: string | null,
  activeShopName?: string,
): string => {
  if (asset.conditionType === 'MINIMUM_ORDER_AMOUNT') {
    return `Order subtotal at least $${asset.conditionAmount || '0'}`
  }
  if (asset.conditionType === 'USER_SHOP_MEMBER') {
    const shop = asset.conditionShopId === activeShopId
      ? activeShopName || 'your shop'
      : asset.conditionShopId || 'selected shop'
    return `Customer ${asset.conditionUserId || 'not specified'} must order from ${shop}`
  }
  return `${asset.conditionType || 'Condition'} · ${asset.operator || 'No operator configured'}`
}

const summarizeUsageLimit = (asset: PromotionAsset): string => {
  if (asset.limitType === 'PER_USER') {
    return `Up to ${asset.maxCount || '0'} redemption${asset.maxCount === '1' ? '' : 's'} per customer`
  }
  if (asset.limitType === 'GLOBAL') {
    return `Up to ${asset.maxCount || '0'} total redemption${asset.maxCount === '1' ? '' : 's'}`
  }
  return `Discount budget up to $${asset.maxAmount || '0'}`
}

const summarizeTarget = (asset: PromotionAsset): string => {
  const name = asset.detail.split(' · ').slice(1).join(' · ') || 'Name unavailable'
  const type = asset.targetType === 'PRODUCT'
    ? 'Product'
    : asset.targetType === 'CATEGORY'
      ? 'Category'
      : asset.targetType === 'BRAND'
        ? 'Brand'
        : asset.targetType === 'SHOP'
          ? 'Shop'
          : 'Target'
  return `${type}: ${name}`
}

const summarizePromoCode = (asset: PromotionAsset): string => {
  const status = asset.codeStatus === 'ACTIVE'
    ? 'Ready to use'
    : asset.codeStatus === 'DISABLED'
      ? 'Disabled'
      : 'Already redeemed'
  const expiry = asset.expiresAt ? ` · expires ${formatDate(asset.expiresAt)}` : ''
  const reservation = asset.reservedByUserId ? ' · reserved for a customer' : ''
  return `${asset.code || 'Code'} · ${status}${expiry}${reservation}`
}

const toAsset = (
  kind: PromotionAssetKind,
  record:
    | PromotionRewardRecord
    | PromotionConditionRecord
    | PromotionTargetRecord
    | PromotionCodeRecord
    | PromotionUsageLimitRecord,
  promotionNameById: Map<string, string>,
  targetNameByRef: Map<string, string> = new Map(),
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
      percentage: reward.percentage != null ? String(reward.percentage) : '',
      fixedAmount: reward.fixed_amount != null ? String(reward.fixed_amount) : '',
      maxDiscount: reward.max_discount_amount != null ? String(reward.max_discount_amount) : '',
    }
  }

  if (kind === 'conditions') {
    const condition = record as PromotionConditionRecord
    const value = condition.value && typeof condition.value === 'object'
      ? condition.value
      : {}
    return {
      id: condition.id,
      promotionId: condition.promotion_id,
      promotion: promotionNameById.get(condition.promotion_id) ?? condition.promotion_id,
      detail: `${condition.condition_type} · ${condition.operator} · ${JSON.stringify(condition.value)}`,
      conditionType: condition.condition_type,
      operator: condition.operator,
      conditionAmount: value.amount == null ? '' : String(value.amount),
      conditionUserId: typeof value.user_id === 'string' ? value.user_id : '',
      conditionShopId: typeof value.shop_id === 'string' ? value.shop_id : '',
      value: JSON.stringify(condition.value ?? {}, null, 2),
    }
  }

  if (kind === 'codes') {
    const code = record as PromotionCodeRecord
    const expiry = code.expires_at ? ` · Expires ${formatDate(code.expires_at)}` : ' · No expiry'
    return {
      id: code.id,
      promotionId: code.promotion_id,
      promotion: promotionNameById.get(code.promotion_id) ?? code.promotion_id,
      detail: `${code.code} · ${code.status}${expiry}`,
      code: code.code,
      codeStatus: code.status,
      reservedByUserId: code.reserved_by_user_id ?? '',
      expiresAt: toDateTimeLocal(code.expires_at),
      used: code.status === 'USED',
    }
  }

  if (kind === 'usageLimits') {
    const limit = record as PromotionUsageLimitRecord
    const detail = limit.limit_type === 'SHOP_BUDGET'
      ? `SHOP BUDGET · max $${limit.max_amount ?? 0}`
      : `${limit.limit_type.replace('_', ' ')} · max ${limit.max_count ?? 0} redemption${limit.max_count === 1 ? '' : 's'}`
    return {
      id: limit.id,
      promotionId: limit.promotion_id,
      promotion: promotionNameById.get(limit.promotion_id) ?? limit.promotion_id,
      detail,
      limitType: limit.limit_type,
      maxCount: limit.max_count == null ? '' : String(limit.max_count),
      maxAmount: limit.max_amount == null ? '' : String(limit.max_amount),
      shopId: limit.shop_id ?? '',
    }
  }

  const target = record as PromotionTargetRecord
  return {
    id: target.id,
    promotionId: target.promotion_id,
    promotion: promotionNameById.get(target.promotion_id) ?? target.promotion_id,
    detail: `${target.target_type} · ${targetNameByRef.get(`${target.target_type}:${target.target_id}`) ?? 'Name unavailable'}`,
    targetType: target.target_type,
    targetId: target.target_id,
  }
}

const buildAssetPayload = (kind: ManagementTab, form: AssetFormState, mode: AssetMode) => {
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
    const value = form.conditionType === 'MINIMUM_ORDER_AMOUNT'
      ? { amount: Number(form.conditionAmount) }
      : form.conditionType === 'USER_SHOP_MEMBER'
        ? {
            user_id: form.conditionUserId.trim(),
            shop_id: form.conditionShopId.trim(),
          }
        : JSON.parse(form.value) as Record<string, unknown>
    return {
      promotion_id: form.promotionId,
      condition_type: form.conditionType,
      operator: form.operator,
      value,
    }
  }
  if (kind === 'codes') {
    const payload = {
      promotion_id: form.promotionId,
      code: form.code.trim(),
      reserved_by_user_id: toNullableString(form.reservedByUserId),
      expires_at: fromDateTimeLocal(form.expiresAt),
    }
    return mode === 'edit' ? { ...payload, status: form.codeStatus } : payload
  }
  if (kind === 'usageLimits') {
    return {
      promotion_id: form.promotionId,
      limit_type: form.limitType,
      max_count: form.limitType === 'SHOP_BUDGET' || !form.maxCount
        ? undefined
        : Number(form.maxCount),
      max_amount: form.limitType !== 'SHOP_BUDGET' || !form.maxAmount
        ? undefined
        : Number(form.maxAmount),
      shop_id: form.limitType === 'SHOP_BUDGET'
        ? toNullableString(form.shopId)
        : undefined,
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
  const isShopAdmin = isShopOwner || authRole === 'SHOP_ADMIN'
  const canManageDeliveryAward = isPlatformAdmin || (isShopAdmin && Boolean(authUser?.active_shop_id))
  const canManagePromotionAssets = isPlatformAdmin || isShopAdmin
  const activeShopId = authUser?.active_shop_id
  const activeShopName = authUser?.active_shop_name?.trim()
  const navigate = useNavigate()
  const flashDealPaths = useFlashDealPaths()

  const [promotions, setPromotions] = useState<PromotionListItem[]>([])
  const [promotionsLoading, setPromotionsLoading] = useState(true)
  const [promotionLoadFailed, setPromotionLoadFailed] = useState(false)
  const [promotionsError, setPromotionsError] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | PromotionStatus | 'FLASH_DEALS'>('all')
  const [search, setSearch] = useState('')
  const [showFullCreate, setShowFullCreate] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const createMenuRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState('')
  const [managementTab, setManagementTab] = useState<ManagementTab>('rewards')
  const [isAwardPromotionTab, setIsAwardPromotionTab] = useState(false)
  const [assets, setAssets] = useState<Record<ManagementTab, PromotionAsset[]>>({
    rewards: [],
    conditions: [],
    targets: [],
    codes: [],
    usageLimits: [],
  })
  const [assetError, setAssetError] = useState<string | null>(null)
  const [assetModalOpen, setAssetModalOpen] = useState(false)
  const [assetMode, setAssetMode] = useState<AssetMode>('create')
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [assetForm, setAssetForm] = useState<AssetFormState>(DEFAULT_ASSET_FORM)
  const [assetSaving, setAssetSaving] = useState(false)
  const [deliveryAwardPromotionId, setDeliveryAwardPromotionId] = useState('')
  const [deliveryAwardPromotionName, setDeliveryAwardPromotionName] = useState('')
  const [deliveryAwardPromotionStatus, setDeliveryAwardPromotionStatus] = useState<PromotionRecord['status'] | null>(null)
  const [deliveryAwardModalOpen, setDeliveryAwardModalOpen] = useState(false)
  const [deliveryAwardLoading, setDeliveryAwardLoading] = useState(false)
  const [deliveryAwardSaving, setDeliveryAwardSaving] = useState(false)
  const [deliveryAwardError, setDeliveryAwardError] = useState<string | null>(null)

  const promotionNameById = useMemo(
    () => new Map(promotions.map((promotion) => [promotion.id, promotion.name])),
    [promotions],
  )
  const promotionIds = useMemo(
    () => promotions.map(({ id }) => id),
    [promotions],
  )

  const defaultAssetPromotionId = useMemo(() => {
    if (selectedId) return selectedId
    if (promotions[0]?.id) return promotions[0].id
    return ''
  }, [promotions, selectedId])

  useEffect(() => {
    if (!showCreateMenu) return
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCreateMenu])

  useEffect(() => {
    let cancelled = false
    if (!isPlatformAdmin && !activeShopId) {
      setPromotions([])
      setSelectedId('')
      setPromotionsError('Select an active shop to view its promotions.')
      setPromotionsLoading(false)
      return () => {
        cancelled = true
      }
    }

    setPromotionsLoading(true)
    setPromotionLoadFailed(false)
    setPromotionsError(null)
    promotionApi.listPromotions(isPlatformAdmin ? undefined : activeShopId ?? undefined)
      .then((records) => {
        if (cancelled) return
        const scopedRecords = isPlatformAdmin
          ? records
          : records.filter(
              (record) =>
                record.owner_type === 'SELLER' &&
                record.shop_id === activeShopId,
            )
        const items = scopedRecords.map(toListItem)
        setPromotions(items)
        setSelectedId((current) =>
          items.some((item) => item.id === current) ? current : items[0]?.id ?? '',
        )
        setPromotionsError(null)
      })
      .catch(() => {
        if (cancelled) return
        setPromotions([])
        setSelectedId('')
        setPromotionLoadFailed(true)
        setPromotionsError(null)
      })
      .finally(() => {
        if (!cancelled) setPromotionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeShopId, isPlatformAdmin])

  useEffect(() => {
    if (!isPlatformAdmin && !isShopAdmin) return
    let cancelled = false
    setDeliveryAwardLoading(true)
    promotionApi.getDeliveryAwardPromotion()
      .then((setting) => {
        if (cancelled) return
        setDeliveryAwardPromotionId(setting.promotion_id ?? '')
        setDeliveryAwardPromotionName(setting.promotion?.name ?? '')
        setDeliveryAwardPromotionStatus(setting.promotion?.status ?? null)
        setDeliveryAwardError(null)
      })
      .catch((error: any) => {
        if (cancelled) return
        const apiMessage = error?.response?.data?.message
        const message = Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage
        setDeliveryAwardError(
          message || (error?.response?.status
            ? `Could not load the delivered-order voucher setting (HTTP ${error.response.status}).`
            : 'Could not reach the promotion service to load the delivered-order voucher setting.'),
        )
      })
      .finally(() => { if (!cancelled) setDeliveryAwardLoading(false) })
    return () => { cancelled = true }
  }, [isPlatformAdmin, isShopAdmin])

  useEffect(() => {
    if (!canManagePromotionAssets) return
    if (!isPlatformAdmin && !activeShopId) {
      setAssets({ rewards: [], conditions: [], targets: [], codes: [], usageLimits: [] })
      return
    }
    let cancelled = false
    setAssets({ rewards: [], conditions: [], targets: [], codes: [], usageLimits: [] })
    const loadAssets = async (kind: ManagementTab) => {
      const records = isPlatformAdmin
        ? await promotionApi.list<PromotionRewardRecord | PromotionConditionRecord | PromotionTargetRecord | PromotionCodeRecord | PromotionUsageLimitRecord>(kind)
        : (await Promise.all(
            promotionIds.map((promotionId) =>
              promotionApi.list<PromotionRewardRecord | PromotionConditionRecord | PromotionTargetRecord | PromotionCodeRecord | PromotionUsageLimitRecord>(kind, promotionId),
            ),
          )).flat()
      return [kind, records] as const
    }
    Promise.all((['rewards', 'conditions', 'targets', 'codes', 'usageLimits'] as ManagementTab[]).map(loadAssets))
      .then(async (results) => {
        const targetRecords = results.find(([kind]) => kind === 'targets')?.[1] ?? []
        const targetNames = await promotionApi.resolveTargetNames(
          targetRecords as PromotionTargetRecord[],
        )
        if (cancelled) return
        const next = Object.fromEntries(
          results.map(([kind, records]) => [
            kind,
             records.map((record) => toAsset(kind, record, promotionNameById, targetNames)),
          ]),
        ) as Record<ManagementTab, PromotionAsset[]>
        setAssets(next)
        setAssetError(null)
      })
      .catch(() => {
        if (!cancelled) setAssetError('Could not load promotion building blocks.')
      })
    return () => {
      cancelled = true
    }
  }, [
    activeShopId,
    canManagePromotionAssets,
    isPlatformAdmin,
    promotionIds,
    promotionNameById,
  ])

  const filteredPromotions = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()
    return promotions.filter((promotion) => {
      const matchesTab = activeTab === 'all'
        || (activeTab !== 'FLASH_DEALS' && promotion.status === activeTab)
      const matchesSearch = !normalizedSearch
        || `${promotion.name} ${promotion.scope} ${promotion.audience} ${promotion.reward}`.toLowerCase().includes(normalizedSearch)
      return matchesTab && matchesSearch
    })
  }, [activeTab, promotions, search])

  const selectedPromotion = promotions.find((promotion) => promotion.id === selectedId) ?? filteredPromotions[0]
  const selectedPromotionAssets = {
    rewards: selectedPromotion
      ? assets.rewards.filter((asset) => asset.promotionId === selectedPromotion.id)
      : [],
    conditions: selectedPromotion
      ? assets.conditions.filter((asset) => asset.promotionId === selectedPromotion.id)
      : [],
    targets: selectedPromotion
      ? assets.targets.filter((asset) => asset.promotionId === selectedPromotion.id)
      : [],
    codes: selectedPromotion
      ? assets.codes.filter((asset) => asset.promotionId === selectedPromotion.id)
      : [],
    usageLimits: selectedPromotion
      ? assets.usageLimits.filter((asset) => asset.promotionId === selectedPromotion.id)
      : [],
  }
  const activeCount = promotions.filter((promotion) => promotion.status === 'ACTIVE').length
  const targetCoverage = assets.targets.length
  const availableDeliveryAwardPromotions = promotions.filter(({ record }) => {
    const now = Date.now()
    const startsAt = new Date(record.start_at).getTime()
    const endsAt = record.end_at ? new Date(record.end_at).getTime() : Number.POSITIVE_INFINITY
    return record.status === 'ACTIVE' && startsAt <= now && endsAt > now
  })

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

  const saveDeliveryAwardPromotion = async (): Promise<boolean> => {
    setDeliveryAwardSaving(true)
    setDeliveryAwardError(null)
    try {
      const setting = await promotionApi.setDeliveryAwardPromotion(
        deliveryAwardPromotionId || null,
        isPlatformAdmin ? undefined : activeShopId,
      )
      setDeliveryAwardPromotionId(setting.promotion_id ?? '')
      setDeliveryAwardPromotionName(setting.promotion?.name ?? '')
      setDeliveryAwardPromotionStatus(setting.promotion?.status ?? null)
      return true
    } catch (error: any) {
      setDeliveryAwardError(error?.response?.data?.message ?? 'Could not save the delivered-order voucher promotion.')
      return false
    } finally {
      setDeliveryAwardSaving(false)
    }
  }

  const openCreateAsset = () => {
    setAssetMode('create')
    setEditingAssetId(null)
    const targetPromotion = managementTab === 'targets'
      ? promotions.find(({ id, record }) =>
          id === defaultAssetPromotionId && promotionScopeSupportsTargets(record.scope),
        ) ?? promotions.find(({ record }) => promotionScopeSupportsTargets(record.scope))
      : promotions.find(({ id }) => id === defaultAssetPromotionId)
    const targetType = targetTypeForScope(targetPromotion?.record.scope) ?? 'PRODUCT'
    setAssetForm({
      ...DEFAULT_ASSET_FORM,
      promotionId: targetPromotion?.id ?? '',
      targetType,
      targetId: targetType === 'SHOP' ? targetPromotion?.record.shop_id ?? '' : '',
      conditionShopId: activeShopId ?? '',
      shopId: activeShopId ?? '',
    })
    setAssetModalOpen(true)
  }

  const openEditAsset = (asset: PromotionAsset) => {
    setAssetMode('edit')
    setEditingAssetId(asset.id)
    const targetPromotion = promotions.find(({ id }) => id === asset.promotionId)
    const requiredTargetType = targetTypeForScope(targetPromotion?.record.scope)
    const targetType = requiredTargetType ?? asset.targetType ?? 'PRODUCT'
    const targetId = requiredTargetType === 'SHOP'
      ? targetPromotion?.record.shop_id ?? ''
      : requiredTargetType && requiredTargetType !== asset.targetType
        ? ''
        : asset.targetId ?? ''
    setAssetForm({
      promotionId: asset.promotionId,
      rewardType: asset.rewardType ?? 'PERCENTAGE',
      percentage: asset.percentage ?? '',
      fixedAmount: asset.fixedAmount ?? '',
      maxDiscount: asset.maxDiscount ?? '',
      conditionType: asset.conditionType ?? 'MINIMUM_ORDER_AMOUNT',
      operator: asset.operator ?? 'GTE',
      conditionAmount: asset.conditionAmount ?? '',
      conditionUserId: asset.conditionUserId ?? '',
      conditionShopId: asset.conditionShopId ?? '',
      value: asset.value ?? '{}',
      targetType,
      targetId,
      code: asset.code ?? '',
      codeStatus: asset.codeStatus ?? 'ACTIVE',
      reservedByUserId: asset.reservedByUserId ?? '',
      expiresAt: asset.expiresAt ?? '',
      limitType: asset.limitType ?? 'PER_USER',
      maxCount: asset.maxCount ?? '',
      maxAmount: asset.maxAmount ?? '',
      shopId: asset.shopId ?? '',
    })
    setAssetModalOpen(true)
  }

  const saveAsset = async () => {
    setAssetSaving(true)
    try {
      const payload = buildAssetPayload(managementTab, assetForm, assetMode)
      type PromotionAssetRecord =
        | PromotionRewardRecord
        | PromotionConditionRecord
        | PromotionTargetRecord
        | PromotionCodeRecord
        | PromotionUsageLimitRecord
      const record = assetMode === 'create'
        ? await promotionApi.create<PromotionAssetRecord>(managementTab, payload)
        : await promotionApi.update<PromotionAssetRecord>(managementTab, editingAssetId!, payload)
      const targetNames = managementTab === 'targets'
        ? await promotionApi.resolveTargetNames([record as PromotionTargetRecord])
        : new Map<string, string>()
      const asset = toAsset(managementTab, record, promotionNameById, targetNames)
      setAssets((current) => ({
        ...current,
        [managementTab]: assetMode === 'create'
          ? [asset, ...current[managementTab]]
          : current[managementTab].map((item) => (item.id === asset.id ? asset : item)),
      }))
      setAssetError(null)
      setAssetModalOpen(false)
    } catch {
      setAssetError(`Could not ${assetMode === 'create' ? 'create' : 'update'} this ${ASSET_SINGULAR_LABELS[managementTab]}. Check the values and JSON.`)
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
      setAssetError(`Could not delete this ${ASSET_SINGULAR_LABELS[managementTab]}.`)
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
        <div ref={createMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowCreateMenu((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={showCreateMenu}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={17} /> Create promotion
            <ChevronDown size={15} className={`transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
          </button>
          {showCreateMenu && (
            <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setShowCreateMenu(false)
                  setShowFullCreate(true)
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 no-underline transition hover:bg-slate-50 hover:no-underline"
              >
                <Sparkles size={15} className="text-emerald-600" />
                Standard Promotion
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateMenu(false)
                  navigate(flashDealPaths.list)
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 no-underline transition hover:bg-slate-50 hover:no-underline"
              >
                <Flame size={15} className="text-emerald-600" />
                Flash Deal Campaign
              </button>
            </div>
          )}
        </div>
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

      {activeTab === 'FLASH_DEALS' ? (
        <AdminFlashDealsPage />
      ) : (
        <>
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
              {(['all', 'ACTIVE', 'DRAFT', 'PAUSED', 'EXPIRED', 'FLASH_DEALS'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 pb-3 whitespace-nowrap transition ${activeTab === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  {tab === 'all'
                    ? 'All promotions'
                    : tab === 'FLASH_DEALS'
                      ? 'Flash Deals'
                      : tab.charAt(0) + tab.slice(1).toLowerCase()}
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
              <div className="px-5 py-14 text-center text-sm text-slate-500">
                {promotionLoadFailed ? 'No promotions for now.' : 'No promotions match this view.'}
              </div>
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
              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-300">How this offer works</h3>
                  <span className="text-[10px] text-slate-500">{selectedPromotion.scope}</span>
                </div>
                <div className="space-y-2">
                  <PromotionDetailGroup
                    title="Reward"
                    items={selectedPromotionAssets.rewards.map(summarizeReward)}
                    emptyText="No reward configured."
                  />
                  <PromotionDetailGroup
                    title="Conditions"
                    items={selectedPromotionAssets.conditions.map((asset) =>
                      summarizeCondition(asset, activeShopId, activeShopName),
                    )}
                    emptyText="No extra conditions."
                  />
                  <PromotionDetailGroup
                    title="Applies to"
                    items={selectedPromotionAssets.targets.map(summarizeTarget)}
                    emptyText="All eligible cart items; no target restrictions."
                  />
                  <PromotionDetailGroup
                    title="Promo codes"
                    items={selectedPromotionAssets.codes.map(summarizePromoCode)}
                    emptyText="No promo code required."
                  />
                  <PromotionDetailGroup
                    title="Usage limits"
                    items={selectedPromotionAssets.usageLimits.map(summarizeUsageLimit)}
                    emptyText="No redemption cap configured."
                  />
                  <PromotionDetailGroup
                    title="Delivered-order award"
                    items={selectedPromotion.id === deliveryAwardPromotionId
                      ? ['Selected to supply voucher codes after delivery.']
                      : []}
                    emptyText={deliveryAwardLoading
                      ? 'Checking award setting…'
                      : deliveryAwardError
                        ? 'Award setting could not be loaded.'
                        : 'Not selected for delivered-order awards.'}
                  />
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

      {canManagePromotionAssets && (
        <PromotionAssetManager
          isPlatformAdmin={isPlatformAdmin}
          activeTab={managementTab}
          isAwardPromotionTab={isAwardPromotionTab}
          assets={assets[managementTab]}
          deliveryAwardPromotionId={deliveryAwardPromotionId}
          deliveryAwardPromotionName={deliveryAwardPromotionName}
          deliveryAwardPromotionStatus={deliveryAwardPromotionStatus}
          deliveryAwardLoading={deliveryAwardLoading}
          deliveryAwardError={deliveryAwardError}
          canCreateTargets={promotions.some((promotion) =>
            promotionScopeSupportsTargets(promotion.record.scope),
          )}
          onTabChange={(tab) => {
            setManagementTab(tab)
            setIsAwardPromotionTab(false)
          }}
          onAwardPromotionTabChange={() => setIsAwardPromotionTab(true)}
          onAdd={openCreateAsset}
          onAddAwardPromotion={() => {
            setDeliveryAwardModalOpen(true)
          }}
          onEdit={openEditAsset}
          onRemove={removeAsset}
        />
      )}
        </>
      )}

      <PromotionCreateModal
        open={showFullCreate}
        isPlatformAdmin={isPlatformAdmin}
        activeShopId={activeShopId}
        activeShopName={activeShopName}
        onClose={() => setShowFullCreate(false)}
        onCreate={createPromotion}
      />

      <PromotionAssetFormModal
        open={assetModalOpen}
        mode={assetMode}
        kind={managementTab}
        isPlatformAdmin={isPlatformAdmin}
        activeShopId={activeShopId}
        activeShopName={activeShopName}
        form={assetForm}
        saving={assetSaving}
        promotions={promotions}
        onClose={() => setAssetModalOpen(false)}
        onChange={updateAssetForm}
        onSubmit={saveAsset}
      />

      {deliveryAwardModalOpen && (
        <DeliveryAwardPromotionModal
          canManage={canManageDeliveryAward}
          hasActiveShop={Boolean(activeShopId)}
          promotionId={deliveryAwardPromotionId}
          promotionName={deliveryAwardPromotionName}
          promotions={availableDeliveryAwardPromotions}
          loading={deliveryAwardLoading}
          saving={deliveryAwardSaving}
          error={deliveryAwardError}
          onPromotionChange={(promotionId) => {
            setDeliveryAwardPromotionId(promotionId)
            setDeliveryAwardError(null)
          }}
          onClose={() => setDeliveryAwardModalOpen(false)}
          onSave={async () => {
            if (await saveDeliveryAwardPromotion()) setDeliveryAwardModalOpen(false)
          }}
        />
      )}
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

const PromotionDetailGroup = ({
  title,
  items,
  emptyText,
}: {
  title: string
  items: string[]
  emptyText: string
}) => (
  <section className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
    <div className="flex items-center justify-between gap-2">
      <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</h4>
      {items.length > 0 && (
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
          {items.length}
        </span>
      )}
    </div>
    {items.length === 0 ? (
      <p className="mt-1 text-[11px] text-slate-500">{emptyText}</p>
    ) : (
      <ul className="mt-1.5 space-y-1.5">
        {items.slice(0, 3).map((item, index) => (
          <li key={`${title}-${index}`} className="break-words text-[11px] leading-relaxed text-slate-200">
            {item}
          </li>
        ))}
        {items.length > 3 && (
          <li className="text-[10px] font-medium text-slate-400">+{items.length - 3} more</li>
        )}
      </ul>
    )}
  </section>
)

const PromotionAssetManager = ({
  isPlatformAdmin,
  activeTab,
  isAwardPromotionTab,
  assets,
  deliveryAwardPromotionId,
  deliveryAwardPromotionName,
  deliveryAwardPromotionStatus,
  deliveryAwardLoading,
  deliveryAwardError,
  canCreateTargets,
  onTabChange,
  onAwardPromotionTabChange,
  onAdd,
  onAddAwardPromotion,
  onEdit,
  onRemove,
}: {
  isPlatformAdmin: boolean
  activeTab: ManagementTab
  isAwardPromotionTab: boolean
  assets: PromotionAsset[]
  deliveryAwardPromotionId: string
  deliveryAwardPromotionName: string
  deliveryAwardPromotionStatus: PromotionRecord['status'] | null
  deliveryAwardLoading: boolean
  deliveryAwardError: string | null
  canCreateTargets: boolean
  onTabChange: (tab: ManagementTab) => void
  onAwardPromotionTabChange: () => void
  onAdd: () => void
  onAddAwardPromotion: () => void
  onEdit: (asset: PromotionAsset) => void
  onRemove: (id: string) => void
}) => {
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
              ? 'Control codes, limits, rewards, conditions, and targets for promotions.'
              : 'Define codes, usage limits, rewards, conditions, and targets for your shop promotions.'}
          </p>
        </div>
        <button
          type="button"
          onClick={isAwardPromotionTab ? onAddAwardPromotion : onAdd}
          disabled={!isAwardPromotionTab && activeTab === 'targets' && !canCreateTargets}
          title={!isAwardPromotionTab && activeTab === 'targets' && !canCreateTargets ? 'Targets are only available for Product-scope promotions.' : undefined}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
        >
          <Plus size={15} /> {isAwardPromotionTab ? 'Add Award Promotion' : `Add ${ASSET_SINGULAR_LABELS[activeTab]}`}
        </button>
      </div>
      <div className="flex flex-wrap items-end gap-x-1 border-b border-slate-100 px-5 pt-3">
        {(['rewards', 'conditions', 'targets', 'codes', 'usageLimits'] as ManagementTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`border-b-2 px-3 pb-3 text-xs font-semibold ${activeTab === tab ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {ASSET_LABELS[tab]}
          </button>
        ))}
        <button
          type="button"
          onClick={onAwardPromotionTabChange}
          className={`border-b-2 px-3 pb-3 text-xs font-semibold ${isAwardPromotionTab ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Award Promotion
        </button>
      </div>
      {!isAwardPromotionTab && activeTab === 'targets' && !canCreateTargets && (
        <p className="border-b border-slate-100 px-5 py-3 text-xs text-slate-500">
          Targets are only available for Product-scope promotions.
        </p>
      )}
      <div className="divide-y divide-slate-100">
        {isAwardPromotionTab ? (
          <>
            {deliveryAwardLoading && <p className="px-5 py-8 text-center text-sm text-slate-500">Loading award promotion…</p>}
            {!deliveryAwardLoading && deliveryAwardError && (
              <p role="alert" className="px-5 py-6 text-center text-sm text-rose-700">{deliveryAwardError}</p>
            )}
            {!deliveryAwardLoading && !deliveryAwardError && deliveryAwardPromotionId && (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{deliveryAwardPromotionName || 'Selected promotion'}</p>
                  <p className="mt-1 text-xs text-slate-500">Supplies voucher codes for delivered orders</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${deliveryAwardPromotionStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {deliveryAwardPromotionStatus ?? 'CONFIGURED'}
                </span>
              </div>
            )}
            {!deliveryAwardLoading && !deliveryAwardError && !deliveryAwardPromotionId && (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No delivered-order award promotion configured.</p>
            )}
          </>
        ) : assets.map((asset) => (
          <div key={asset.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              {activeTab === 'rewards' || activeTab === 'usageLimits'
                ? <CircleDollarSign size={17} />
                : activeTab === 'conditions'
                  ? <Check size={17} />
                  : activeTab === 'codes'
                    ? <Sparkles size={17} />
                    : <Target size={17} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{asset.promotion}</p>
              <p className="mt-1 text-xs text-slate-500">{asset.detail}</p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(asset)}
              aria-label={`Edit ${ASSET_SINGULAR_LABELS[activeTab]} item`}
              disabled={asset.used}
              title={asset.used ? 'Redeemed promo codes are read-only' : undefined}
              className="rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRemove(asset.id)}
              aria-label={`Delete ${ASSET_SINGULAR_LABELS[activeTab]} item`}
              disabled={asset.used}
              title={asset.used ? 'Redeemed promo codes are read-only' : undefined}
              className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={15} />
            </button>
          </div>
        ))}
        {!isAwardPromotionTab && assets.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No {ASSET_LABELS[activeTab].toLowerCase()} configured.</p>
        )}
      </div>
    </section>
  )
}

type PromotionCreateModalProps = {
  open: boolean
  isPlatformAdmin: boolean
  activeShopId: string | null | undefined
  activeShopName: string | undefined
  onClose: () => void
  onCreate: (payload: PromotionCreatePayload) => Promise<void>
}

const PromotionCreateModal = ({ open, isPlatformAdmin, activeShopId, activeShopName, onClose, onCreate }: PromotionCreateModalProps) => {
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
  const resolvedOwnerType: OwnerType = isPlatformAdmin ? ownerType : 'SELLER'
  const resolvedShopId = isPlatformAdmin
    ? toNullableString(shopId)
    : toNullableString(activeShopId)
  const shopScopeMissingShop = scope === 'SHOP' && !resolvedShopId

  if (!open) return null

  const submit = async () => {
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
        {isPlatformAdmin ? (
          <FormField label="Shop ID" hint={scope === 'SHOP' ? 'Required for SHOP scope' : 'Required for seller promotions'}>
            <input
              value={shopId}
              onChange={(event) => setShopId(event.target.value)}
              placeholder="UUID or leave blank"
              className={INPUT_CLASS}
            />
          </FormField>
        ) : (
          <FormField label="Shop">
            <input
              value={activeShopName || 'No active shop selected'}
              readOnly
              aria-readonly="true"
              className={INPUT_CLASS}
            />
          </FormField>
        )}
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
      <ModalActions
        onClose={onClose}
        onSubmit={submit}
        submitLabel="Create promotion"
        disabled={(!isPlatformAdmin && !activeShopId) || shopScopeMissingShop}
      />
    </ModalShell>
  )
}

type PromotionAssetFormModalProps = {
  open: boolean
  mode: AssetMode
  kind: ManagementTab
  isPlatformAdmin: boolean
  activeShopId: string | null | undefined
  activeShopName: string | undefined
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
  isPlatformAdmin,
  activeShopId,
  activeShopName,
  form,
  saving,
  promotions,
  onClose,
  onChange,
  onSubmit,
}: PromotionAssetFormModalProps) => {
  const [targetCatalogProducts, setTargetCatalogProducts] = useState<PromotionTargetCatalogProduct[]>([])
  const [targetCatalogLoading, setTargetCatalogLoading] = useState(false)
  const [targetCatalogError, setTargetCatalogError] = useState<string | null>(null)
  const selectedPromotion = promotions.find((promotion) => promotion.id === form.promotionId)
  const requiredTargetType = targetTypeForScope(selectedPromotion?.record.scope)
  const targetShopId = selectedPromotion?.record.shop_id ?? undefined

  useEffect(() => {
    if (
      !open ||
      kind !== 'targets' ||
      !requiredTargetType ||
      requiredTargetType === 'SHOP'
    ) {
      setTargetCatalogProducts([])
      setTargetCatalogError(null)
      setTargetCatalogLoading(false)
      return
    }

    let cancelled = false
    setTargetCatalogProducts([])
    setTargetCatalogLoading(true)
    setTargetCatalogError(null)
    promotionApi.listTargetCatalogProducts(targetShopId)
      .then((products) => {
        if (!cancelled) setTargetCatalogProducts(products)
      })
      .catch(() => {
        if (!cancelled) setTargetCatalogError('Could not load this shop’s catalog options.')
      })
      .finally(() => {
        if (!cancelled) setTargetCatalogLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [kind, open, requiredTargetType, targetShopId])

  if (!open) return null

  const singular = ASSET_SINGULAR_LABELS[kind]
  const title = mode === 'create' ? `Create ${singular}` : `Edit ${singular}`
  const invalidReward = kind === 'rewards' && (
    form.rewardType === 'PERCENTAGE' ? !form.percentage :
      form.rewardType === 'FIXED_AMOUNT' ? !form.fixedAmount : false
  )
  const invalidCondition = kind === 'conditions' && (
    form.conditionType === 'MINIMUM_ORDER_AMOUNT'
      ? !form.conditionAmount || !Number.isFinite(Number(form.conditionAmount))
      : form.conditionType === 'USER_SHOP_MEMBER'
        ? !form.conditionUserId.trim() || !form.conditionShopId.trim()
        : parseJsonObject(form.value) === null
  )
  const conditionValuePreview = form.conditionType === 'MINIMUM_ORDER_AMOUNT'
    ? { amount: form.conditionAmount === '' ? '' : Number(form.conditionAmount) }
    : form.conditionType === 'USER_SHOP_MEMBER'
      ? {
          user_id: form.conditionUserId,
          shop_id: form.conditionShopId,
        }
      : parseJsonObject(form.value) ?? {}
  const knownConditionTypes = ['MINIMUM_ORDER_AMOUNT', 'USER_SHOP_MEMBER']
  const conditionOperators = form.conditionType === 'MINIMUM_ORDER_AMOUNT'
    ? [{ value: 'GTE', label: 'At least' }]
    : form.conditionType === 'USER_SHOP_MEMBER'
      ? [{ value: 'EQ', label: 'User and shop match' }]
      : [{ value: form.operator, label: form.operator }]
  const invalidCode = kind === 'codes' && !form.code.trim()
  const invalidUsageLimit = kind === 'usageLimits' && (
    form.limitType === 'SHOP_BUDGET' ? !form.maxAmount : !form.maxCount
  )
  const invalidTarget = kind === 'targets' && (
    !requiredTargetType ||
    form.targetType !== requiredTargetType ||
    !form.targetId ||
    (requiredTargetType === 'SHOP' && form.targetId !== selectedPromotion?.record.shop_id)
  )
  const targetOptions = requiredTargetType === 'PRODUCT'
    ? targetCatalogProducts.map((product) => ({ id: product.id, label: product.name }))
    : requiredTargetType === 'CATEGORY'
      ? Array.from(new Map(
          targetCatalogProducts.flatMap((product) => {
            const id = product.category?.id ?? product.categoryId
            if (!id) return []
            return [[id, product.category?.name || id] as const]
          }),
        )).map(([id, label]) => ({ id, label }))
      : []
  const searchableTargetOptions = targetOptions
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((option) => ({ value: option.id, label: option.label }))
  if (form.targetId && !searchableTargetOptions.some((option) => option.value === form.targetId)) {
    searchableTargetOptions.push({ value: form.targetId, label: form.targetId })
  }
  const selectablePromotions = kind === 'targets'
    ? promotions.filter(({ id, record }) =>
        promotionScopeSupportsTargets(record.scope) || (mode === 'edit' && id === form.promotionId),
      )
    : promotions

  return (
    <ModalShell title={title} eyebrow="Promotion building block" onClose={onClose}>
      <FormField label="Promotion">
        <select
          value={form.promotionId}
          onChange={(event) => {
            const promotionId = event.target.value
            const promotion = promotions.find((item) => item.id === promotionId)
            onChange('promotionId', promotionId)
            if (kind === 'targets') {
              const targetType = targetTypeForScope(promotion?.record.scope)
              onChange('targetType', targetType ?? 'PRODUCT')
              onChange(
                'targetId',
                targetType === 'SHOP' ? promotion?.record.shop_id ?? '' : '',
              )
            }
          }}
          className={INPUT_CLASS}
        >
          <option value="">Select a promotion</option>
          {selectablePromotions.map((promotion) => (
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
                placeholder="e.g. 10"
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
                placeholder="e.g. 25"
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
                placeholder="No limit"
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
              <select
                value={form.conditionType}
                onChange={(event) => {
                  const nextType = event.target.value
                  onChange('conditionType', nextType)
                  if (nextType === 'MINIMUM_ORDER_AMOUNT') onChange('operator', 'GTE')
                  if (nextType === 'USER_SHOP_MEMBER') onChange('operator', 'EQ')
                }}
                className={INPUT_CLASS}
              >
                {!knownConditionTypes.includes(form.conditionType) && (
                  <option value={form.conditionType}>{form.conditionType} (legacy)</option>
                )}
                <option value="MINIMUM_ORDER_AMOUNT">Minimum order amount</option>
                <option value="USER_SHOP_MEMBER">Specific customer and shop</option>
              </select>
            </FormField>
            <FormField label="Operator">
              <select
                value={form.operator}
                onChange={(event) => onChange('operator', event.target.value)}
                className={INPUT_CLASS}
              >
                {!conditionOperators.some(({ value }) => value === form.operator) && (
                  <option value={form.operator}>{form.operator} (saved value)</option>
                )}
                {conditionOperators.map((operator) => (
                  <option key={operator.value} value={operator.value}>{operator.label}</option>
                ))}
              </select>
            </FormField>
          </div>
          {form.conditionType === 'MINIMUM_ORDER_AMOUNT' && (
            <FormField label="Minimum order subtotal">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.conditionAmount}
                onChange={(event) => onChange('conditionAmount', event.target.value)}
                placeholder="e.g. 100"
                required
                className={INPUT_CLASS}
              />
            </FormField>
          )}
          {form.conditionType === 'USER_SHOP_MEMBER' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Customer user ID">
                <input
                  value={form.conditionUserId}
                  onChange={(event) => onChange('conditionUserId', event.target.value)}
                  placeholder="Customer UUID"
                  required
                  className={INPUT_CLASS}
                />
              </FormField>
              <FormField label={isPlatformAdmin ? 'Shop ID' : 'Shop'}>
                <input
                  value={isPlatformAdmin ? form.conditionShopId : activeShopName || 'Your shop'}
                  onChange={(event) => onChange('conditionShopId', event.target.value)}
                  placeholder="Shop UUID"
                  readOnly={!isPlatformAdmin}
                  aria-readonly={!isPlatformAdmin}
                  required
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>
          )}
          {!knownConditionTypes.includes(form.conditionType) && (
            <FormField label="Value (JSONB)">
              <textarea
                value={form.value}
                onChange={(event) => onChange('value', event.target.value)}
                rows={4}
                placeholder='{"key":"value"}'
                className={`${INPUT_CLASS} font-mono text-xs`}
              />
            </FormField>
          )}
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Value saved to JSONB</p>
            <pre className="mt-2 overflow-x-auto text-xs text-slate-700">{JSON.stringify(conditionValuePreview, null, 2)}</pre>
          </div>
        </>
      )}

      {kind === 'targets' && (
        <>
          {!requiredTargetType ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              {selectedPromotion?.scope} promotions apply to the order or shipping total and do not use catalog targets.
            </div>
          ) : (
            <>
              <FormField label="Target type (matched to promotion scope)">
                <input value={requiredTargetType} readOnly className={INPUT_CLASS} />
              </FormField>
              {requiredTargetType === 'SHOP' ? (
                <FormField label="Promotion shop">
                  <input
                    value={selectedPromotion?.record.shop_id
                      ? selectedPromotion.record.shop_id === activeShopId
                        ? activeShopName || selectedPromotion.record.shop_id
                        : selectedPromotion.record.shop_id
                      : 'Choose a shop on the promotion first'}
                    readOnly
                    className={INPUT_CLASS}
                  />
                  <span className="mt-1 block font-normal text-slate-500">
                    A SHOP target is automatically set to the shop selected on the promotion.
                  </span>
                </FormField>
              ) : (
                <FormField label={`Target ${requiredTargetType.toLowerCase()}`}>
                  <SearchableSelect
                    value={form.targetId}
                    onChange={(value) => onChange('targetId', value)}
                    options={searchableTargetOptions}
                    mode="search-and-scroll"
                    placeholder={`Search ${requiredTargetType.toLowerCase()}s…`}
                    emptyLabel={`Select ${requiredTargetType.toLowerCase()}`}
                    searchAriaLabel={`Search ${requiredTargetType.toLowerCase()}s in this shop`}
                    loading={targetCatalogLoading}
                    disabled={Boolean(targetCatalogError)}
                  />
                  {targetCatalogError ? (
                    <span className="mt-1 block font-normal text-rose-600">{targetCatalogError}</span>
                  ) : !targetCatalogLoading && targetOptions.length === 0 ? (
                    <span className="mt-1 block font-normal text-slate-500">
                      No {requiredTargetType.toLowerCase()}s with products in this promotion’s shop.
                    </span>
                  ) : null}
                </FormField>
              )}
            </>
          )}
        </>
      )}

      {kind === 'codes' && (
        <>
          <FormField label="Promo code">
            <input
              value={form.code}
              onChange={(event) => onChange('code', event.target.value.toUpperCase())}
              maxLength={64}
              placeholder="WELCOME10"
              required
              className={INPUT_CLASS}
            />
          </FormField>
          {mode === 'edit' && (
            <FormField label="Status">
              <select
                value={form.codeStatus}
                onChange={(event) => onChange('codeStatus', event.target.value as PromotionCodeStatus)}
                className={INPUT_CLASS}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </FormField>
          )}
          <FormField label="Reserved user ID" hint="Optional">
            <input
              value={form.reservedByUserId}
              onChange={(event) => onChange('reservedByUserId', event.target.value)}
              placeholder="Leave blank for any customer"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Expiry" hint="Optional">
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) => onChange('expiresAt', event.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>
        </>
      )}

      {kind === 'usageLimits' && (
        <>
          <FormField label="Limit type">
            <select
              value={form.limitType}
              onChange={(event) => onChange('limitType', event.target.value as UsageLimitType)}
              className={INPUT_CLASS}
            >
              <option value="PER_USER">PER_USER</option>
              <option value="GLOBAL">GLOBAL</option>
              <option value="SHOP_BUDGET">SHOP_BUDGET</option>
            </select>
          </FormField>
          {form.limitType === 'SHOP_BUDGET' ? (
            <>
              <FormField label="Maximum discount budget">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxAmount}
                  onChange={(event) => onChange('maxAmount', event.target.value)}
                  required
                  className={INPUT_CLASS}
                />
              </FormField>
              <FormField label="Shop ID" hint="Optional scope">
                <input
                  value={form.shopId}
                  onChange={(event) => onChange('shopId', event.target.value)}
                  placeholder="UUID"
                  className={INPUT_CLASS}
                />
              </FormField>
            </>
          ) : (
            <FormField label="Maximum redemptions">
              <input
                type="number"
                min="1"
                step="1"
                value={form.maxCount}
                onChange={(event) => onChange('maxCount', event.target.value)}
                required
                className={INPUT_CLASS}
              />
            </FormField>
          )}
        </>
      )}

      <ModalActions
        onClose={onClose}
        onSubmit={onSubmit}
        submitLabel={saving ? 'Saving…' : mode === 'create' ? `Create ${singular}` : `Save ${singular}`}
        disabled={saving || !form.promotionId || invalidReward || invalidCondition || invalidCode || invalidUsageLimit || invalidTarget}
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

const DeliveryAwardPromotionModal = ({
  canManage,
  hasActiveShop,
  promotionId,
  promotionName,
  promotions,
  loading,
  saving,
  error,
  onPromotionChange,
  onClose,
  onSave,
}: {
  canManage: boolean
  hasActiveShop: boolean
  promotionId: string
  promotionName: string
  promotions: PromotionListItem[]
  loading: boolean
  saving: boolean
  error: string | null
  onPromotionChange: (promotionId: string) => void
  onClose: () => void
  onSave: () => Promise<void>
}) => (
  <ModalShell eyebrow="Promotion setting" title="Delivered-order award promotion" onClose={onClose}>
    <p className="text-sm text-slate-600">
      Select the active promotion that supplies a voucher code after an order is confirmed delivered. Choose Disabled to turn off awards.
    </p>
    {canManage ? (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        This setting affects delivered-order awards across shops. Shop admins can select promotions from their active shop.
      </p>
    ) : (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        {hasActiveShop
          ? 'This is a platform-wide setting. Changes affect delivered-order awards across shops.'
          : 'Select an active shop before changing this setting.'}
      </p>
    )}
    <FormField label="Award promotion">
      <select
        value={promotionId}
        onChange={(event) => onPromotionChange(event.target.value)}
        disabled={!canManage || loading || saving}
        className={INPUT_CLASS}
      >
        <option value="">Disabled</option>
        {promotionId && !promotions.some(({ id }) => id === promotionId) && (
          <option value={promotionId}>{promotionName || 'Selected promotion'} (not currently active)</option>
        )}
        {promotions.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
      </select>
      {loading && <span className="mt-1 block text-xs font-normal text-slate-500">Loading setting…</span>}
    </FormField>
    {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
    {canManage ? (
      <ModalActions
        onClose={onClose}
        onSubmit={onSave}
        submitLabel={saving ? 'Saving…' : 'Save promotion'}
        disabled={loading || saving}
      />
    ) : (
      <div className="flex justify-end pt-2">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Close
        </button>
      </div>
    )}
  </ModalShell>
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
