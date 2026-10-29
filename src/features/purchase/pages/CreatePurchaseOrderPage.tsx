import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Paperclip,
  Plus,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import ProductSearchSelect from '@/features/warehouse/components/ProductSearchSelect'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouseData'
import { productApi } from '@/features/products/api/productApi'
import { sellerProductApi } from '@/features/seller/api/sellerProductApi'
import { productClient } from '@/lib/api/productClient'
import { sanitizeIntegerInput, sanitizeMoneyInput } from '@/utils/decimalInput'
import { notifyDashboardMenuBadgesChanged } from '@/features/dashboard/dashboardMenuBadges'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { useSuppliers } from '../hooks/usePurchaseData'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import {
  ADDITIONAL_COST_CATEGORIES,
  ADDITIONAL_COST_CATEGORY_LABELS,
  COST_STATUS_LABELS,
  formatMoney,
  type AdditionalCostCategory,
  type CostAllocationMethod,
  type CostStatus,
  type PurchaseOrderPayload,
} from '../types/purchaseTypes'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-50'
const subtleButtonClass =
  'inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40'
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)]'
const cellInputClass =
  'w-full min-w-0 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[var(--dni-primary)]'
const labelClass = 'mb-1 block text-xs font-medium text-slate-600'
const thClass =
  'px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500'

const DELIVERY_TERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'CIP', 'DAP', 'DPU', 'DDP']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'VND', 'SGD', 'THB', 'MMK']

let uid = 0
const nextKey = () => `row-${(uid += 1)}`

const num = (value: string): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

const round2 = (value: number): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Number((parsed + Number.EPSILON).toFixed(2))
}

const numberParam = (value: string | null): number => {
  const parsed = Number(value ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const suggestPoNumber = (): string => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `PO-${stamp}-${suffix}`
}

type DraftItem = {
  key: string
  productId: string
  unit: string
  colorId: string
  sizeId: string
  length: string
  width: string
  height: string
  quantity: string
  unitCost: string
  discount: string
  weightPerUnit: string
  volumePerUnit: string
  /** Prefills from product catalog; variant fields stay read-only. */
  fromCatalog: boolean
}

type DraftStage = {
  key: string
  fromLocation: string
  toLocation: string
  carrier: string
  feeAmount: string
  allocationMethod: CostAllocationMethod
  applicableProductIds: string[]
}

type DraftCost = {
  key: string
  name: string
  category: AdditionalCostCategory
  amount: string
  status: CostStatus
  allocationMethod: CostAllocationMethod
  applicableProductIds: string[]
}

type AttachmentRow = {
  name: string
  size: number
  mimeType: string
  contentBase64: string
}

type ProductVariantRow = {
  id?: string
  colorId?: string
  sizeId?: string
  basePrice?: number | string
  listPrice?: number | string
  effectiveSellingPrice?: number | string
  price?: number | string
  stock?: number | string
  warehouseStockMirror?: number | string
  availableStock?: number | string
  length?: number | string | null
  width?: number | string | null
  height?: number | string | null
  weight?: number | string | null
  color?: { id?: string; name?: string }
  size?: { id?: string; name?: string }
}

type ProductRow = {
  id: string
  name?: string
  title?: string
  sku?: string
  description?: string
  price?: number | string
  variants?: ProductVariantRow[]
}
type ProductEnvelope = { success?: boolean; data?: ProductRow | ProductRow[] }

type ProductVariantSnapshot = {
  id: string
  colorId: string
  sizeId: string
  colorName: string | null
  sizeName: string | null
  length: number | null
  width: number | null
  height: number | null
  weight: number | null
  /** Catalog sellable qty (shop + warehouse mirror) when destination stock is unavailable. */
  availableStock: number
}

type ProductSnapshot = {
  name: string
  sku: string | null
  description: string | null
  variants: ProductVariantSnapshot[]
}

const dimText = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return ''
  const parsed = Number(value)
  return Number.isFinite(parsed) ? String(parsed) : ''
}

const mapProductVariants = (rows: ProductVariantRow[] | undefined): ProductVariantSnapshot[] =>
  (rows ?? [])
    .map((variant) => {
      const colorId = variant.colorId ?? variant.color?.id ?? ''
      const sizeId = variant.sizeId ?? variant.size?.id ?? ''
      if (!colorId || !sizeId) return null
      const available =
        Number(variant.availableStock) ||
        Math.max(0, Number(variant.stock) || 0) +
          Math.max(0, Number(variant.warehouseStockMirror) || 0)
      return {
        id: variant.id ?? `${colorId}:${sizeId}`,
        colorId,
        sizeId,
        colorName: variant.color?.name ?? null,
        sizeName: variant.size?.name ?? null,
        length: variant.length != null && variant.length !== '' ? Number(variant.length) : null,
        width: variant.width != null && variant.width !== '' ? Number(variant.width) : null,
        height: variant.height != null && variant.height !== '' ? Number(variant.height) : null,
        weight: variant.weight != null && variant.weight !== '' ? Number(variant.weight) : null,
        availableStock: Number.isFinite(available) ? available : 0,
      } satisfies ProductVariantSnapshot
    })
    .filter((row): row is ProductVariantSnapshot => row != null)

const snapshotFromProductRow = (id: string, row?: ProductRow | null): ProductSnapshot => ({
  name: row?.name ?? row?.title ?? id,
  sku: row?.sku ?? null,
  description: row?.description ?? null,
  variants: mapProductVariants(row?.variants),
})

const emptyItem = (): DraftItem => ({
  key: nextKey(),
  productId: '',
  unit: 'pcs',
  colorId: '',
  sizeId: '',
  length: '',
  width: '',
  height: '',
  quantity: '1',
  unitCost: '0',
  discount: '0',
  weightPerUnit: '0',
  volumePerUnit: '0',
  fromCatalog: false,
})

const draftFromVariant = (
  productId: string,
  variant: ProductVariantSnapshot,
  quantity = '1',
): DraftItem => ({
  ...emptyItem(),
  productId,
  colorId: variant.colorId,
  sizeId: variant.sizeId,
  length: dimText(variant.length),
  width: dimText(variant.width),
  height: dimText(variant.height),
  weightPerUnit: dimText(variant.weight) || '0',
  // Unit price is entered on the PO line (Order stock × Unit price → Line total).
  unitCost: '',
  quantity,
  fromCatalog: true,
})

const variantPairKey = (productId: string, colorId: string, sizeId: string) =>
  `${productId}:${colorId}:${sizeId}`

/** Expand bare product rows into one line per catalog variant (skipping pairs already present). */
const expandItemsWithVariants = (
  rows: DraftItem[],
  meta: Record<string, ProductSnapshot>,
): DraftItem[] => {
  const result: DraftItem[] = []
  const covered = new Set<string>()

  for (const item of rows) {
    if (item.productId && (item.colorId || item.sizeId)) {
      covered.add(variantPairKey(item.productId, item.colorId, item.sizeId))
    }
  }

  for (const item of rows) {
    if (!item.productId || item.colorId || item.sizeId) {
      result.push(item)
      continue
    }
    const variants = meta[item.productId]?.variants ?? []
    if (variants.length === 0) {
      result.push(item)
      continue
    }
    let added = 0
    for (const variant of variants) {
      const pair = variantPairKey(item.productId, variant.colorId, variant.sizeId)
      if (covered.has(pair)) continue
      covered.add(pair)
      result.push(draftFromVariant(item.productId, variant, item.quantity))
      added += 1
    }
    if (added === 0) result.push(item)
  }

  return result.length > 0 ? result : rows
}

const defaultStages = (): DraftStage[] => [
  {
    key: nextKey(),
    fromLocation: 'China',
    toLocation: 'Lashio',
    carrier: '',
    feeAmount: '0',
    allocationMethod: 'QUANTITY',
    applicableProductIds: [],
  },
  {
    key: nextKey(),
    fromLocation: 'Lashio',
    toLocation: 'Mandalay',
    carrier: '',
    feeAmount: '0',
    allocationMethod: 'QUANTITY',
    applicableProductIds: [],
  },
  {
    key: nextKey(),
    fromLocation: 'Mandalay',
    toLocation: 'Yangon (AungMingalar)',
    carrier: '',
    feeAmount: '0',
    allocationMethod: 'QUANTITY',
    applicableProductIds: [],
  },
]

const stageRouteLabel = (stage: DraftStage) => {
  const from = stage.fromLocation.trim()
  const to = stage.toLocation.trim()
  if (from && to) return `${from} → ${to}`
  return from || to || ''
}

/** Build ordered checkpoints from chained delivery legs (from → to). */
const routeStopsFromStages = (rows: DraftStage[]): string[] => {
  const stops: string[] = []
  for (const stage of rows) {
    const from = stage.fromLocation.trim()
    const to = stage.toLocation.trim()
    if (!from || !to) continue
    if (stops.length === 0) stops.push(from)
    else if (stops[stops.length - 1] !== from) stops.push(from)
    if (stops[stops.length - 1] !== to) stops.push(to)
  }
  return stops
}

const defaultCosts = (): DraftCost[] => [
  { key: nextKey(), name: 'Handling', category: 'HANDLING', amount: '0', status: 'ESTIMATED', allocationMethod: 'QUANTITY', applicableProductIds: [] },
  { key: nextKey(), name: 'Customs duty', category: 'CUSTOMS', amount: '0', status: 'ESTIMATED', allocationMethod: 'QUANTITY', applicableProductIds: [] },
  { key: nextKey(), name: 'Insurance', category: 'INSURANCE', amount: '0', status: 'ESTIMATED', allocationMethod: 'QUANTITY', applicableProductIds: [] },
  { key: nextKey(), name: 'Taxes', category: 'TAX', amount: '0', status: 'ESTIMATED', allocationMethod: 'QUANTITY', applicableProductIds: [] },
]

export type CreatePurchaseOrderPageProps = {
  base: PurchaseAreaBase
  platform?: boolean
}

const SectionCard = ({
  index,
  title,
  subtitle,
  action,
  children,
}: {
  index: number
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <header className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--dni-primary)] text-[11px] font-semibold text-white">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </header>
    <div className="p-4">{children}</div>
  </section>
)

const Field = ({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  error?: string
  children: ReactNode
}) => (
  <div className="min-w-0">
    <label className={labelClass}>
      {label}
      {required ? <span className="text-rose-500"> *</span> : null}
    </label>
    {children}
    {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    {hint && !error ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
  </div>
)

const invalidInputClass = 'border-rose-400 focus:border-rose-500'

const CreatePurchaseOrderPage = ({ base }: CreatePurchaseOrderPageProps) => {
  const paths = purchasePaths(base)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { suppliers } = useSuppliers()
  const { warehouses } = useWarehouses({ catalog: true, status: 'ACTIVE' })

  const today = new Date().toISOString().slice(0, 10)
  const initialShipping =
    numberParam(searchParams.get('delivery_fee')) ||
    numberParam(searchParams.get('shipping_amount'))

  // Section 1 — order & supplier details
  const [poNumber] = useState(suggestPoNumber)
  const [orderDate, setOrderDate] = useState(today)
  const [supplierId, setSupplierId] = useState(searchParams.get('supplier_id') ?? '')
  const [contact, setContact] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState('4500')
  const [expectedAt, setExpectedAt] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [warehouseId, setWarehouseId] = useState(searchParams.get('warehouse_id') ?? '')
  const [deliveryTerms, setDeliveryTerms] = useState('FOB')

  // Section 2 — line items
  const orderKind = 'SUPPLIER' as const
  const prefilledLines = (searchParams.get('lines') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [productId, quantity] = part.split(':')
      return {
        ...emptyItem(),
        productId: productId ?? '',
        quantity: quantity && Number(quantity) > 0 ? quantity : '1',
      }
    })

  const [items, setItems] = useState<DraftItem[]>(prefilledLines.length > 0 ? prefilledLines : [emptyItem()])
  const [colorOptions, setColorOptions] = useState<Array<{ id: string; name: string }>>([])
  const [sizeOptions, setSizeOptions] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    let cancelled = false
    void Promise.all([sellerProductApi.listColors(), sellerProductApi.listSizes()])
      .then(([colors, sizes]) => {
        if (cancelled) return
        setColorOptions(colors.data?.data ?? [])
        setSizeOptions(sizes.data?.data ?? [])
      })
      .catch(() => {
        if (!cancelled) {
          setColorOptions([])
          setSizeOptions([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Section 3 — delivery stages (transit legs + freight charges)
  const [stages, setStages] = useState<DraftStage[]>(() => {
    const rows = defaultStages()
    if (initialShipping > 0 && rows[0]) {
      rows[0] = { ...rows[0], feeAmount: String(initialShipping) }
    }
    return rows
  })

  // Section 4 — additional costs
  const [costs, setCosts] = useState<DraftCost[]>(defaultCosts)

  // Section 5 — summary & submission
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showHeaderErrors, setShowHeaderErrors] = useState(false)

  const [productMeta, setProductMeta] = useState<Record<string, ProductSnapshot>>({})
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null)
  const lastSupplierRef = useRef('')
  const initialVariantExpandDone = useRef(false)

  const sourceRoute = searchParams.get('source_route') ?? searchParams.get('origin_route') ?? ''

  const lineNet = (item: DraftItem) =>
    round2(num(item.quantity) * num(item.unitCost) - num(item.discount))

  const resolveColorName = (item: DraftItem) =>
    productMeta[item.productId]?.variants.find((variant) => variant.colorId === item.colorId)
      ?.colorName ??
    colorOptions.find((color) => color.id === item.colorId)?.name ??
    null

  const resolveSizeName = (item: DraftItem) =>
    productMeta[item.productId]?.variants.find((variant) => variant.sizeId === item.sizeId)
      ?.sizeName ??
    sizeOptions.find((size) => size.id === item.sizeId)?.name ??
    null

  /** Existing stock from ecommerce-read (same source as storefront product UI). */
  const existingStockFor = (item: DraftItem): number => {
    if (!item.productId || !item.colorId || !item.sizeId) return 0
    const catalog = productMeta[item.productId]?.variants.find(
      (variant) => variant.colorId === item.colorId && variant.sizeId === item.sizeId,
    )
    return catalog?.availableStock ?? 0
  }

  const fetchProductSnapshot = async (id: string): Promise<ProductSnapshot> => {
    let snapshot = snapshotFromProductRow(id, null)
    try {
      const response = await productClient.get<ProductEnvelope>(`/products/${id}`)
      const payload = response.data?.data
      const row = Array.isArray(payload) ? payload[0] : payload
      snapshot = snapshotFromProductRow(id, row)
    } catch {
      // Keep empty meta if product-service is unavailable.
    }

    // Prefer ecommerce-read stock (warehouseStock + shopStock), same as product detail UI.
    try {
      const detail = await productApi.getDetail(id)
      const catalogVariants = detail.data?.data?.variants ?? []
      if (catalogVariants.length === 0) return snapshot

      const stockByPair = new Map<string, number>()
      for (const variant of catalogVariants) {
        const colorId = variant.colorId ?? ''
        const sizeId = variant.sizeId ?? ''
        if (!colorId || !sizeId) continue
        const sellable =
          Math.max(0, Number(variant.shopStock) || 0) +
          Math.max(0, Number(variant.warehouseStock) || 0)
        stockByPair.set(`${colorId}:${sizeId}`, sellable)
      }

      return {
        ...snapshot,
        variants: snapshot.variants.map((variant) => ({
          ...variant,
          availableStock:
            stockByPair.get(`${variant.colorId}:${variant.sizeId}`) ?? variant.availableStock,
        })),
      }
    } catch {
      return snapshot
    }
  }

  const stageFeeTotal = useMemo(
    () => round2(stages.reduce((sum, stage) => sum + num(stage.feeAmount), 0)),
    [stages],
  )

  const subtotal = useMemo(
    () => round2(items.reduce((sum, item) => sum + lineNet(item), 0)),
    [items],
  )
  const additionalCostsTotal = useMemo(
    () => round2(costs.reduce((sum, cost) => sum + num(cost.amount), 0)),
    [costs],
  )

  const rateValue = num(exchangeRate)
  const foreignSubtotal = rateValue > 0 ? round2(subtotal / rateValue) : 0
  const foreignSymbol = currency === 'USD' ? '$' : `${currency} `
  const deliveryTotal = stageFeeTotal
  const otherCostsTotal = additionalCostsTotal
  const totalAmount = round2(subtotal + deliveryTotal + otherCostsTotal)

  useEffect(() => {
    if (!supplierId || supplierId === lastSupplierRef.current) return
    const supplier = suppliers.find((entry) => entry.id === supplierId)
    if (!supplier) return
    lastSupplierRef.current = supplierId
    const parts = [supplier.contactName, supplier.email, supplier.phone].filter(
      (part): part is string => Boolean(part),
    )
    setContact(parts.length > 0 ? parts.join(' · ') : '')
    setPaymentTerms(supplier.paymentTerms ?? '')
    setCurrency(supplier.currency || 'USD')
  }, [suppliers, supplierId])

  // Resolve product snapshots (name, SKU, description, variants) for selected products.
  useEffect(() => {
    const missing = Array.from(
      new Set(
        items
          .map((item) => item.productId)
          .filter((id) => id && !productMeta[id]),
      ),
    )
    if (missing.length === 0) return
    let cancelled = false
    void (async () => {
      for (const id of missing) {
        const snapshot = await fetchProductSnapshot(id)
        if (cancelled) return
        setProductMeta((current) => ({
          ...current,
          [id]: snapshot,
        }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [items, productMeta])

  // Prefill / deep-link rows: expand catalog variants once metadata is ready.
  useEffect(() => {
    if (initialVariantExpandDone.current) return
    const bare = items.filter((item) => item.productId && !item.colorId && !item.sizeId)
    if (bare.length === 0) {
      initialVariantExpandDone.current = true
      return
    }
    if (bare.some((item) => !productMeta[item.productId])) return
    initialVariantExpandDone.current = true
    setItems((current) => expandItemsWithVariants(current, productMeta))
  }, [items, productMeta])

  const updateItem = (key: string, patch: Partial<DraftItem>) =>
    setItems((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const removeItem = (key: string) =>
    setItems((current) => {
      const next = current.filter((row) => row.key !== key)
      return next.length > 0 ? next : [emptyItem()]
    })

  const removeProductGroup = (productId: string, anchorKey: string) =>
    setItems((current) => {
      const next = productId
        ? current.filter((row) => row.productId !== productId)
        : current.filter((row) => row.key !== anchorKey)
      return next.length > 0 ? next : [emptyItem()]
    })

  /** One product picker per product; variants render as table rows under it. */
  const productGroups = useMemo(() => {
    const groups: Array<{ productId: string; anchorKey: string; rows: DraftItem[] }> = []
    const indexByProduct = new Map<string, number>()
    for (const item of items) {
      if (!item.productId) {
        groups.push({ productId: '', anchorKey: item.key, rows: [item] })
        continue
      }
      const existing = indexByProduct.get(item.productId)
      if (existing === undefined) {
        indexByProduct.set(item.productId, groups.length)
        groups.push({ productId: item.productId, anchorKey: item.key, rows: [item] })
      } else {
        groups[existing]?.rows.push(item)
      }
    }
    return groups
  }, [items])

  const handleProductChange = async (rowKey: string, productId: string) => {
    const replaceProductGroup = (
      current: DraftItem[],
      nextRows: DraftItem[],
    ): DraftItem[] => {
      const index = current.findIndex((row) => row.key === rowKey)
      if (index < 0) return current
      const previousProductId = current[index]?.productId ?? ''

      // Drop the whole previous product's variant group (not just this row),
      // and any existing rows for the newly selected product to avoid duplicates.
      const removeIds = new Set(
        [previousProductId, productId].filter((id): id is string => Boolean(id)),
      )
      const firstRemovedIndex =
        previousProductId
          ? current.findIndex((row) => row.productId === previousProductId)
          : index
      const kept = current.filter((row) => {
        if (row.key === rowKey) return false
        if (row.productId && removeIds.has(row.productId)) return false
        return true
      })
      const insertAt = Math.max(
        0,
        Math.min(firstRemovedIndex >= 0 ? firstRemovedIndex : index, kept.length),
      )
      const merged = [...kept.slice(0, insertAt), ...nextRows, ...kept.slice(insertAt)]
      return merged.length > 0 ? merged : [emptyItem()]
    }

    if (!productId) {
      setItems((current) => replaceProductGroup(current, [emptyItem()]))
      return
    }

    setLoadingProductId(productId)
    try {
      let snapshot = productMeta[productId]
      if (!snapshot) {
        snapshot = await fetchProductSnapshot(productId)
        setProductMeta((current) => ({ ...current, [productId]: snapshot }))
      }

      setItems((current) => {
        const index = current.findIndex((row) => row.key === rowKey)
        const quantity = current[index]?.quantity ?? '1'
        const variants = snapshot.variants ?? []
        const variantRows =
          variants.length > 0
            ? variants.map((variant) => draftFromVariant(productId, variant, quantity))
            : [{ ...emptyItem(), productId, quantity }]
        return replaceProductGroup(current, variantRows)
      })
    } finally {
      setLoadingProductId((current) => (current === productId ? null : current))
    }
  }

  const updateStage = (key: string, patch: Partial<DraftStage>) =>
    setStages((current) => {
      const index = current.findIndex((row) => row.key === key)
      if (index < 0) return current
      const next = current.map((row, i) => (i === index ? { ...row, ...patch } : row))
      // Keep the next leg's From in sync when this leg's To changes.
      if (typeof patch.toLocation === 'string' && next[index + 1]) {
        next[index + 1] = { ...next[index + 1], fromLocation: patch.toLocation }
      }
      return next
    })

  const updateCost = (key: string, patch: Partial<DraftCost>) =>
    setCosts((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList) return
    const incoming = Array.from(fileList)
    const tooLarge = incoming.find((file) => file.size > 4 * 1024 * 1024)
    if (tooLarge) {
      setFormError(`${tooLarge.name} is larger than 4 MB.`)
      return
    }
    const rows = await Promise.all(
      incoming.map(
        (file) =>
          new Promise<AttachmentRow>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = String(reader.result ?? '')
              const contentBase64 = result.includes(',') ? (result.split(',')[1] ?? '') : result
              resolve({
                name: file.name,
                size: file.size,
                mimeType: file.type || 'application/octet-stream',
                contentBase64,
              })
            }
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
          }),
      ),
    )
    setAttachments((current) => {
      const seen = new Set(current.map((row) => row.name))
      return [...current, ...rows.filter((row) => row.contentBase64 && !seen.has(row.name))].slice(0, 5)
    })
  }

  const headerFieldErrors = useMemo(() => {
    const errors: Partial<
      Record<
        | 'orderDate'
        | 'supplierId'
        | 'contact'
        | 'currency'
        | 'exchangeRate'
        | 'expectedAt'
        | 'paymentTerms'
        | 'warehouseId'
        | 'deliveryTerms',
        string
      >
    > = {}
    if (!orderDate.trim()) errors.orderDate = 'Order date is required.'
    if (!supplierId) errors.supplierId = 'Supplier is required.'
    if (!contact.trim()) errors.contact = 'Supplier contact is required.'
    if (!currency.trim()) errors.currency = 'Currency is required.'
    if (!(num(exchangeRate) > 0)) errors.exchangeRate = 'Exchange rate must be greater than zero.'
    if (!expectedAt.trim()) errors.expectedAt = 'Expected arrival is required.'
    if (!paymentTerms.trim()) errors.paymentTerms = 'Payment terms are required.'
    if (!warehouseId) errors.warehouseId = 'Destination warehouse is required.'
    if (!deliveryTerms.trim()) errors.deliveryTerms = 'Delivery terms are required.'
    return errors
  }, [
    orderDate,
    supplierId,
    contact,
    currency,
    exchangeRate,
    expectedAt,
    paymentTerms,
    warehouseId,
    deliveryTerms,
  ])

  const headerError = (field: keyof typeof headerFieldErrors) =>
    showHeaderErrors ? headerFieldErrors[field] : undefined

  const validate = (): string | null => {
    const firstHeaderError = Object.values(headerFieldErrors)[0]
    if (firstHeaderError) return firstHeaderError
    const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId)
    if (selectedWarehouse?.isAtCapacity) {
      return `${selectedWarehouse.name} is at full capacity. Choose another warehouse or free space before ordering.`
    }
    const validItems = items.filter((item) => item.productId)
    if (validItems.length === 0) return 'Add at least one product line item.'
    if (validItems.some((item) => !item.fromCatalog || !item.colorId || !item.sizeId)) {
      return 'Only existing product variants can be ordered. Choose a product that already has color/size variants.'
    }
    if (validItems.some((item) => num(item.quantity) <= 0))
      return 'Every line item needs a quantity greater than zero.'
    if (validItems.some((item) => num(item.unitCost) <= 0))
      return 'Enter a unit price greater than zero for every line item.'
    const incompleteLeg = stages.find(
      (stage) => !stage.fromLocation.trim() || !stage.toLocation.trim(),
    )
    if (stages.length === 0 || incompleteLeg) {
      return 'Fill From and To for every delivery stage (transit route).'
    }
    if (routeStopsFromStages(stages).length < 2) {
      return 'Add at least one transit leg with From and To locations.'
    }
    if (
      selectedWarehouse?.capacityUnits != null &&
      selectedWarehouse.remainingUnits != null
    ) {
      const orderedUnits = validItems.reduce((sum, item) => sum + num(item.quantity), 0)
      if (orderedUnits > selectedWarehouse.remainingUnits) {
        return `${selectedWarehouse.name} only has ${selectedWarehouse.remainingUnits} units of capacity remaining. Reduce the order quantity or choose another warehouse.`
      }
    }
    return null
  }

  const filledRouteStops = routeStopsFromStages(stages)

  const buildPayload = (asDraft = false): PurchaseOrderPayload => ({
    supplierId,
    warehouseId,
    orderKind,
    asDraft,
    currency,
    exchangeRate: num(exchangeRate) || 1,
    paymentTerms: paymentTerms || null,
    deliveryTerms: deliveryTerms || null,
    notes: notes || null,
    supplierContact: contact || null,
    orderDate: orderDate ? `${orderDate}T00:00:00.000Z` : null,
    expectedAt: expectedAt ? new Date(expectedAt).toISOString() : null,
    discountAmount: 0,
    taxAmount: 0,
    shippingAmount: deliveryTotal,
    routeStops: filledRouteStops,
    items: items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        productName: productMeta[item.productId]?.name ?? null,
        sku: productMeta[item.productId]?.sku ?? null,
        description: productMeta[item.productId]?.description ?? null,
        unit: item.unit || null,
        colorId: item.colorId || null,
        sizeId: item.sizeId || null,
        colorName: resolveColorName(item),
        sizeName: resolveSizeName(item),
        length: item.length ? num(item.length) : null,
        width: item.width ? num(item.width) : null,
        height: item.height ? num(item.height) : null,
        quantity: Math.max(1, Math.round(num(item.quantity))),
        unitCost: num(item.unitCost),
        discountAmount: num(item.discount),
        weightPerUnit: num(item.weightPerUnit),
        volumePerUnit: num(item.volumePerUnit),
      })),
    deliveryStages: stages
      .filter((stage) => stage.fromLocation.trim() && stage.toLocation.trim())
      .map((stage, index) => ({
        sequence: index + 1,
        name: stageRouteLabel(stage),
        carrier: stage.carrier.trim() || null,
        feeAmount: num(stage.feeAmount),
        currency,
        allocationMethod: stage.allocationMethod,
        applicableProductIds: stage.applicableProductIds,
      })),
    additionalCosts: costs
      .filter((cost) => cost.name.trim() && num(cost.amount) > 0)
      .map((cost) => ({
        name: cost.name.trim(),
        category: cost.category,
        amount: num(cost.amount),
        currency,
        allocationMethod: cost.allocationMethod,
        status: cost.status,
        applicableProductIds: cost.applicableProductIds,
      })),
    attachments: attachments.map((file) => ({
      fileName: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.size,
      contentBase64: file.contentBase64,
    })),
  })

  const submit = async (mode: 'draft' | 'approval') => {
    setFormError(null)
    setShowHeaderErrors(true)
    const error = validate()
    if (error) {
      setFormError(error)
      return
    }
    setSaving(true)
    try {
      const response = await purchaseApi.createPurchaseOrder(buildPayload(mode === 'draft'))
      const created = response.data?.data
      if (mode === 'approval' && orderKind !== 'SUPPLIER' && created?.id) {
        await purchaseApi.updatePurchaseOrderStatus(created.id, 'PENDING_APPROVAL')
      }
      notifyDashboardMenuBadgesChanged()
      navigate(paths.orders)
    } catch (err) {
      setFormError(purchaseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <Link to={paths.orders} className="hover:text-slate-700">
          Purchase Orders
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">New</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <h1 className="text-xl font-bold text-slate-900">Create Purchase Order</h1>
          <p className="text-sm text-slate-500">
            {orderKind === 'SUPPLIER'
              ? 'Order from a supplier, set the transit route, then track arrivals.'
              : 'Order from a warehouse that already has the stock.'}
          </p>
        </div>
        <Link to={paths.orders} className={`${secondaryButtonClass} shrink-0 gap-1.5 whitespace-nowrap`}>
          <ArrowLeft size={15} />
          Back to list
        </Link>
      </div>

      {sourceRoute && supplierId && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          Opened from <span className="font-medium">{sourceRoute}</span> — review the pre-filled
          entries before submitting.
        </div>
      )}

      {/* Section 1 — Order & supplier details */}
      <SectionCard index={1} title="Order & Supplier Details" subtitle="Header, parties and commercial terms">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="PO Number" hint="System assigns the final number on save.">
            <input className={inputClass} value={poNumber} disabled readOnly />
          </Field>
          <Field label="Order date" required error={headerError('orderDate')}>
            <input
              type="date"
              className={`${inputClass} ${headerError('orderDate') ? invalidInputClass : ''}`}
              value={orderDate}
              onChange={(event) => setOrderDate(event.target.value)}
            />
          </Field>
          <Field label="Supplier" required error={headerError('supplierId')}>
            <select
              className={`${inputClass} ${headerError('supplierId') ? invalidInputClass : ''}`}
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
            >
              <option value="">Select supplier…</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Supplier contact" required error={headerError('contact')}>
            <input
              className={`${inputClass} ${headerError('contact') ? invalidInputClass : ''}`}
              placeholder="Name, email or phone"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
            />
          </Field>
          <Field label="Currency" required error={headerError('currency')}>
            <select
              className={`${inputClass} ${headerError('currency') ? invalidInputClass : ''}`}
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Exchange rate" required error={headerError('exchangeRate')}>
            <input
              type="number"
              min={0}
              step="0.000001"
              className={`${inputClass} ${headerError('exchangeRate') ? invalidInputClass : ''}`}
              value={exchangeRate}
              onChange={(event) => setExchangeRate(event.target.value)}
            />
          </Field>
          <Field label="Expected arrival" required error={headerError('expectedAt')}>
            <input
              type="date"
              className={`${inputClass} ${headerError('expectedAt') ? invalidInputClass : ''}`}
              value={expectedAt}
              onChange={(event) => setExpectedAt(event.target.value)}
            />
          </Field>
          <Field label="Payment terms" required error={headerError('paymentTerms')}>
            <input
              className={`${inputClass} ${headerError('paymentTerms') ? invalidInputClass : ''}`}
              placeholder="e.g. Net 30"
              value={paymentTerms}
              onChange={(event) => setPaymentTerms(event.target.value)}
            />
          </Field>
          <Field label="Destination warehouse" required error={headerError('warehouseId')}>
            <select
              className={`${inputClass} ${headerError('warehouseId') ? invalidInputClass : ''}`}
              value={warehouseId}
              onChange={(event) => setWarehouseId(event.target.value)}
            >
              <option value="">Select warehouse…</option>
              {warehouses.map((warehouse) => {
                const capacity =
                  warehouse.capacityUnits != null
                    ? ` · ${warehouse.usedUnits ?? 0}/${warehouse.capacityUnits}${
                        warehouse.isAtCapacity ? ' full' : ''
                      }`
                    : ''
                return (
                  <option
                    key={warehouse.id}
                    value={warehouse.id}
                    disabled={Boolean(warehouse.isAtCapacity)}
                  >
                    {warehouse.name}
                    {capacity}
                  </option>
                )
              })}
            </select>
            {warehouses.some((warehouse) => warehouse.isAtCapacity) && (
              <p className="mt-1 text-xs text-rose-600">
                Warehouses marked full cannot receive purchase orders until space is available.
              </p>
            )}
          </Field>
          <Field label="Delivery terms" required error={headerError('deliveryTerms')}>
            <select
              className={`${inputClass} ${headerError('deliveryTerms') ? invalidInputClass : ''}`}
              value={deliveryTerms}
              onChange={(event) => setDeliveryTerms(event.target.value)}
            >
              {DELIVERY_TERMS.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* Section 2 — product line items */}
      <SectionCard
        index={2}
        title="Products Line Items"
        subtitle="Select a product, then set order stock for each variant."
        action={
          <div className="flex items-center gap-3">
            {currency !== 'MMK' && rateValue > 0 && (
              <span
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs tabular-nums text-slate-600"
                title={`Subtotal ÷ exchange rate (${rateValue.toLocaleString('en-US')})`}
              >
                MMK {subtotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                <span className="mx-1.5 text-slate-400">→</span>
                <span className="font-semibold text-slate-900">
                  {foreignSymbol}
                  {foreignSubtotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </span>
            )}
            <button
              type="button"
              className={subtleButtonClass}
              onClick={() => setItems((current) => [...current, emptyItem()])}
            >
              <Plus size={13} />
              Add product
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {productGroups.map((group) => {
            const catalogVariantCount = productMeta[group.productId]?.variants.length ?? 0
            const hasNoVariants =
              Boolean(group.productId) &&
              productMeta[group.productId] != null &&
              catalogVariantCount === 0
            const groupSubtotal = group.rows.reduce((sum, row) => sum + lineNet(row), 0)
            return (
              <div
                key={group.anchorKey}
                className="overflow-hidden rounded-lg border border-slate-200"
              >
                <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <Field label="Product">
                      <ProductSearchSelect
                        ownedOnly
                        value={group.productId}
                        disabled={loadingProductId === group.productId}
                        onChange={(productId) =>
                          void handleProductChange(group.anchorKey, productId)
                        }
                      />
                    </Field>
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-3 pb-0.5">
                    {group.productId && group.rows.some((row) => row.fromCatalog) && (
                      <p className="text-sm text-slate-600">
                        {group.rows.length} variant{group.rows.length === 1 ? '' : 's'} ·{' '}
                        {formatMoney(groupSubtotal)}
                      </p>
                    )}
                    <button
                      type="button"
                      aria-label="Remove product"
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-40"
                      disabled={productGroups.length === 1 && !group.productId}
                      onClick={() => removeProductGroup(group.productId, group.anchorKey)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {hasNoVariants && (
                  <p className="px-3 py-3 text-[11px] text-amber-700">
                    This product has no catalog variants yet. Add color/size variants on the
                    product before ordering stock.
                  </p>
                )}

                {!group.productId && (
                  <p className="px-3 py-3 text-[11px] text-slate-500">
                    Select a product to load its catalog variants.
                  </p>
                )}

                {group.productId && group.rows.some((row) => row.fromCatalog) && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-white">
                          <th className={thClass}>Color</th>
                          <th className={thClass}>Size</th>
                          <th className={`${thClass} whitespace-nowrap`}>Dimensions (cm)</th>
                          <th className={`${thClass} whitespace-nowrap`}>Weight / unit</th>
                          <th className={`${thClass} w-28 text-right`}>Existing stock</th>
                          <th className={`${thClass} w-28 text-right`}>Order stock</th>
                          <th className={`${thClass} w-28 text-right`}>Unit price</th>
                          <th className={`${thClass} w-28 text-right`}>Line total</th>
                          <th className={`${thClass} w-10`} />
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((item) => {
                          const colorLabel = resolveColorName(item) || '—'
                          const sizeLabel = resolveSizeName(item) || '—'
                          const dimensions =
                            item.length || item.width || item.height
                              ? `${item.length || '0'} × ${item.width || '0'} × ${item.height || '0'}`
                              : '—'
                          const existingStock = existingStockFor(item)
                          return (
                            <tr
                              key={item.key}
                              className="border-b border-slate-50 last:border-b-0"
                            >
                              <td className="px-3 py-2.5">
                                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-medium text-slate-700">
                                  {colorLabel}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-medium text-slate-700">
                                  {sizeLabel}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-sm text-slate-600">{dimensions}</td>
                              <td className="px-3 py-2.5 text-sm text-slate-600">
                                {item.weightPerUnit ? (
                                  <>
                                    {item.weightPerUnit}{' '}
                                    <span className="text-slate-400">kg</span>
                                  </>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right text-sm font-medium text-slate-700">
                                {existingStock}
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  className={`${cellInputClass} text-right text-sm`}
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateItem(item.key, {
                                      quantity: sanitizeIntegerInput(event.target.value),
                                    })
                                  }
                                  aria-label={`Order stock for ${colorLabel} / ${sizeLabel}`}
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  autoComplete="off"
                                  className={`${cellInputClass} text-right text-sm`}
                                  value={item.unitCost}
                                  placeholder="0.00"
                                  onChange={(event) =>
                                    updateItem(item.key, {
                                      unitCost: sanitizeMoneyInput(event.target.value),
                                    })
                                  }
                                  aria-label={`Unit price for ${colorLabel} / ${sizeLabel}`}
                                />
                              </td>
                              <td className="px-3 py-2.5 text-right text-sm font-medium text-slate-800">
                                {formatMoney(lineNet(item))}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  type="button"
                                  aria-label={`Remove ${colorLabel} / ${sizeLabel}`}
                                  className="text-slate-400 hover:text-rose-600"
                                  onClick={() => removeItem(item.key)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-800">{formatMoney(subtotal)}</span>
        </div>
      </SectionCard>

      {/* Section 3 — delivery stages (transit route + charges) */}
      <SectionCard
        index={3}
        title="Delivery Stages & Charges"
        subtitle="Each row is a transit leg (From → To). Confirm arrivals later in Purchase Order Tracking."
        action={
          <button
            type="button"
            className={subtleButtonClass}
            onClick={() =>
              setStages((current) => {
                const prevTo = current[current.length - 1]?.toLocation?.trim() ?? ''
                return [
                  ...current,
                  {
                    key: nextKey(),
                    fromLocation: prevTo,
                    toLocation: '',
                    carrier: '',
                    feeAmount: '0',
                    allocationMethod: 'QUANTITY' as CostAllocationMethod,
                    applicableProductIds: [],
                  },
                ]
              })
            }
          >
            <Plus size={13} />
            Add stage
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className={`${thClass} w-40`}>From</th>
                <th className={`${thClass} w-40`}>To</th>
                <th className={`${thClass} w-40`}>Carrier</th>
                <th className={`${thClass} w-28 text-right`}>Charge fee</th>
                <th className={`${thClass} w-10`} />
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => (
                <tr key={stage.key} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-2">
                    <input
                      className={cellInputClass}
                      placeholder="e.g. China"
                      value={stage.fromLocation}
                      onChange={(event) =>
                        updateStage(stage.key, { fromLocation: event.target.value })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={cellInputClass}
                      placeholder="e.g. Lashio"
                      value={stage.toLocation}
                      onChange={(event) =>
                        updateStage(stage.key, { toLocation: event.target.value })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={cellInputClass}
                      placeholder="Carrier"
                      value={stage.carrier}
                      onChange={(event) => updateStage(stage.key, { carrier: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${cellInputClass} text-right`}
                      value={stage.feeAmount}
                      onChange={(event) => updateStage(stage.key, { feeAmount: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      aria-label="Remove stage"
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-40"
                      disabled={stages.length === 1}
                      onClick={() => setStages((current) => current.filter((row) => row.key !== stage.key))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filledRouteStops.length >= 2 && (
          <p className="mt-3 text-xs text-slate-500">
            Route preview:{' '}
            <span className="font-medium text-slate-700">{filledRouteStops.join(' → ')}</span>
          </p>
        )}
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>Total freight</span>
          <span className="font-semibold text-slate-800">{formatMoney(stageFeeTotal)}</span>
        </div>
      </SectionCard>

      {/* Section 4 — additional costs */}
      <SectionCard
        index={4}
        title="Additional Costs"
        subtitle="Handling, customs, insurance and taxes — extra procurement expenses"
        action={
          <button
            type="button"
            className={subtleButtonClass}
            onClick={() =>
              setCosts((current) => [
                ...current,
                {
                  key: nextKey(),
                  name: '',
                  category: 'OTHER',
                  amount: '0',
                  status: 'ESTIMATED',
                  allocationMethod: 'QUANTITY',
                  applicableProductIds: [],
                },
              ])
            }
          >
            <Plus size={13} />
            Add cost
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className={thClass}>Cost item</th>
                <th className={`${thClass} w-40`}>Category</th>
                <th className={`${thClass} w-32 text-right`}>Amount</th>
                <th className={`${thClass} w-40`}>Mode</th>
                <th className={`${thClass} w-10`} />
              </tr>
            </thead>
            <tbody>
              {costs.map((cost) => (
                <tr key={cost.key} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <input
                      className={cellInputClass}
                      placeholder="e.g. Customs duty"
                      value={cost.name}
                      onChange={(event) => updateCost(cost.key, { name: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className={cellInputClass}
                      value={cost.category}
                      onChange={(event) =>
                        updateCost(cost.key, {
                          category: event.target.value as AdditionalCostCategory,
                        })
                      }
                    >
                      {ADDITIONAL_COST_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {ADDITIONAL_COST_CATEGORY_LABELS[category]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${cellInputClass} text-right`}
                      value={cost.amount}
                      onChange={(event) => updateCost(cost.key, { amount: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="inline-flex overflow-hidden rounded-md border border-slate-200">
                      {(['ESTIMATED', 'ACTUAL'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateCost(cost.key, { status: mode })}
                          className={
                            cost.status === mode
                              ? 'bg-[var(--dni-primary-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--dni-primary-700)]'
                              : 'bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50'
                          }
                        >
                          {COST_STATUS_LABELS[mode]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      aria-label="Remove cost"
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-40"
                      disabled={costs.length === 1}
                      onClick={() => setCosts((current) => current.filter((row) => row.key !== cost.key))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Total additional costs:{' '}
          <span className="font-semibold text-slate-800">{formatMoney(additionalCostsTotal)}</span>
        </div>
      </SectionCard>

      {/* Section 5 — summary & submission */}
      <SectionCard index={5} title="Summary & Submission" subtitle="Notes, attachments and order totals">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Notes">
              <textarea
                rows={4}
                className={`${inputClass} resize-y`}
                placeholder="Internal notes for the approver…"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>

            <div>
              <label className={labelClass}>Attachments</label>
              <label
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-[var(--dni-primary)] hover:bg-[var(--dni-primary-soft)]"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  void addFiles(event.dataTransfer.files)
                }}
              >
                <UploadCloud size={20} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-600">
                  Drop quotations or pro forma invoices here
                </span>
                <span className="text-[11px] text-slate-400">or click to browse</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    void addFiles(event.target.files)
                    event.target.value = ''
                  }}
                />
              </label>
              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachments.map((file) => (
                    <li
                      key={file.name}
                      className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <FileText size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-400">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                        <button
                          type="button"
                          aria-label="Remove attachment"
                          className="text-slate-400 hover:text-rose-600"
                          onClick={() =>
                            setAttachments((current) =>
                              current.filter((row) => row.name !== file.name),
                            )
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-[11px] text-slate-400">
                <Paperclip size={11} className="mr-1 inline" />
                Up to 5 files, 4 MB each. Saved with the purchase order.
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-900">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Delivery</span>
              <span className="font-medium text-slate-900">{formatMoney(deliveryTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Other costs</span>
              <span className="font-medium text-slate-900">{formatMoney(otherCostsTotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <span className="text-sm font-semibold text-slate-800">
                Total = Subtotal + Delivery + Other costs
              </span>
              <span className="text-base font-bold text-[var(--dni-primary)]">
                {formatMoney(totalAmount)}
              </span>
            </div>

            {formError && <p className="pt-2 text-sm text-red-600">{formError}</p>}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => navigate(paths.orders)}
                disabled={saving}
              >
                Discard
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={saving}
                onClick={() => void submit('approval')}
              >
                {saving ? 'Saving…' : 'Place order'}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

export default CreatePurchaseOrderPage
