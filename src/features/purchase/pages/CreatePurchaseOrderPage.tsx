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
import { productClient } from '@/lib/api/productClient'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { useSuppliers } from '../hooks/usePurchaseData'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import {
  ADDITIONAL_COST_CATEGORIES,
  ADDITIONAL_COST_CATEGORY_LABELS,
  COST_ALLOCATION_METHODS,
  COST_ALLOCATION_METHOD_LABELS,
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
  'w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[var(--dni-primary)]'
const labelClass = 'mb-1 block text-xs font-medium text-slate-600'
const thClass =
  'px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500'

const DELIVERY_TERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'CIP', 'DAP', 'DPU', 'DDP']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'VND', 'SGD', 'THB', 'MMK']
const UNITS = ['pcs', 'box', 'carton', 'pallet', 'kg', 'unit']

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
  quantity: string
  unitCost: string
  discount: string
  weightPerUnit: string
  volumePerUnit: string
}

type DraftStage = {
  key: string
  name: string
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

type AttachmentRow = { name: string; size: number }

type ProductRow = {
  id: string
  name?: string
  title?: string
  sku?: string
  description?: string
  price?: number | string
}
type ProductEnvelope = { success?: boolean; data?: ProductRow | ProductRow[] }

type ProductSnapshot = {
  name: string
  sku: string | null
  description: string | null
}

const emptyItem = (): DraftItem => ({
  key: nextKey(),
  productId: '',
  unit: 'pcs',
  quantity: '1',
  unitCost: '0',
  discount: '0',
  weightPerUnit: '0',
  volumePerUnit: '0',
})

const defaultStages = (): DraftStage[] => [
  { key: nextKey(), name: 'Pickup', carrier: '', feeAmount: '0', allocationMethod: 'QUANTITY', applicableProductIds: [] },
  { key: nextKey(), name: 'Main Freight', carrier: '', feeAmount: '0', allocationMethod: 'QUANTITY', applicableProductIds: [] },
  { key: nextKey(), name: 'Final Delivery', carrier: '', feeAmount: '0', allocationMethod: 'QUANTITY', applicableProductIds: [] },
]

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
    <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--dni-primary)] text-[11px] font-semibold text-white">
        {index}
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </header>
    <div className="p-4">{children}</div>
  </section>
)

const Field = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) => (
  <div className="min-w-0">
    <label className={labelClass}>{label}</label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
  </div>
)

const CreatePurchaseOrderPage = ({ base }: CreatePurchaseOrderPageProps) => {
  const paths = purchasePaths(base)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { suppliers } = useSuppliers()
  const { warehouses } = useWarehouses()

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
  const [exchangeRate, setExchangeRate] = useState('1')
  const [expectedAt, setExpectedAt] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [warehouseId, setWarehouseId] = useState(searchParams.get('warehouse_id') ?? '')
  const [deliveryTerms, setDeliveryTerms] = useState('FOB')

  // Section 2 — line items
  const [items, setItems] = useState<DraftItem[]>([emptyItem()])

  // Section 3 — delivery stages
  const [stages, setStages] = useState<DraftStage[]>(defaultStages)

  // Section 4 — additional costs
  const [costs, setCosts] = useState<DraftCost[]>(defaultCosts)

  // Section 5 — summary & submission
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])
  const [discountAmount, setDiscountAmount] = useState('0')
  const [taxAmount, setTaxAmount] = useState('0')
  const [shippingAmount, setShippingAmount] = useState(String(initialShipping))
  const [shippingTouched, setShippingTouched] = useState(initialShipping > 0)

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [productMeta, setProductMeta] = useState<Record<string, ProductSnapshot>>({})
  const lastSupplierRef = useRef('')

  const sourceRoute = searchParams.get('source_route') ?? searchParams.get('origin_route') ?? ''

  const lineNet = (item: DraftItem) =>
    round2(num(item.quantity) * num(item.unitCost) - num(item.discount))

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

  const discount = num(discountAmount)
  const tax = num(taxAmount)
  const ship = num(shippingAmount)
  const totalAmount = round2(subtotal - discount + tax + ship)

  const selectableProducts = useMemo(() => {
    const seen = new Set<string>()
    return items
      .filter((item) => item.productId && !seen.has(item.productId))
      .map((item) => {
        seen.add(item.productId)
        return { id: item.productId, label: productMeta[item.productId]?.name ?? item.productId }
      })
  }, [items, productMeta])

  useEffect(() => {
    if (shippingTouched) return
    setShippingAmount(String(stageFeeTotal))
  }, [stageFeeTotal, shippingTouched])

  // Pre-fill supplier contact / payment terms / currency when the supplier changes.
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

  // Resolve product snapshots (name, SKU, description) for selected products.
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
        try {
          const response = await productClient.get<ProductEnvelope>(`/products/${id}`)
          const payload = response.data?.data
          const row = Array.isArray(payload) ? payload[0] : payload
          if (cancelled) return
          setProductMeta((current) => ({
            ...current,
            [id]: {
              name: row?.name ?? row?.title ?? id,
              sku: row?.sku ?? null,
              description: row?.description ?? null,
            },
          }))
        } catch {
          if (cancelled) return
          setProductMeta((current) => ({
            ...current,
            [id]: { name: id, sku: null, description: null },
          }))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [items, productMeta])

  const updateItem = (key: string, patch: Partial<DraftItem>) =>
    setItems((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const removeItem = (key: string) =>
    setItems((current) => (current.length > 1 ? current.filter((row) => row.key !== key) : current))

  const updateStage = (key: string, patch: Partial<DraftStage>) =>
    setStages((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    )

  const updateCost = (key: string, patch: Partial<DraftCost>) =>
    setCosts((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const toggleScope = (key: string, productId: string, kind: 'stage' | 'cost') => {
    const nextScope = (scope: string[]) =>
      scope.includes(productId)
        ? scope.filter((id) => id !== productId)
        : [...scope, productId]
    if (kind === 'stage') {
      setStages((current) =>
        current.map((row) =>
          row.key === key
            ? { ...row, applicableProductIds: nextScope(row.applicableProductIds) }
            : row,
        ),
      )
      return
    }
    setCosts((current) =>
      current.map((row) =>
        row.key === key
          ? { ...row, applicableProductIds: nextScope(row.applicableProductIds) }
          : row,
      ),
    )
  }

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const incoming = Array.from(fileList).map((file) => ({ name: file.name, size: file.size }))
    setAttachments((current) => {
      const seen = new Set(current.map((row) => row.name))
      return [...current, ...incoming.filter((row) => !seen.has(row.name))]
    })
  }

  const validate = (): string | null => {
    if (!supplierId) return 'Select a supplier.'
    if (!warehouseId) return 'Select a destination warehouse.'
    const validItems = items.filter((item) => item.productId)
    if (validItems.length === 0) return 'Add at least one product line item.'
    if (validItems.some((item) => num(item.quantity) <= 0))
      return 'Every line item needs a quantity greater than zero.'
    return null
  }

  const buildPayload = (): PurchaseOrderPayload => ({
    supplierId,
    warehouseId,
    currency,
    exchangeRate: num(exchangeRate) || 1,
    paymentTerms: paymentTerms || null,
    deliveryTerms: deliveryTerms || null,
    notes: notes || null,
    expectedAt: expectedAt ? new Date(expectedAt).toISOString() : null,
    discountAmount: discount,
    taxAmount: tax,
    shippingAmount: ship,
    items: items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        productName: productMeta[item.productId]?.name ?? null,
        sku: productMeta[item.productId]?.sku ?? null,
        description: productMeta[item.productId]?.description ?? null,
        unit: item.unit || null,
        quantity: Math.max(1, Math.round(num(item.quantity))),
        unitCost: num(item.unitCost),
        discountAmount: num(item.discount),
        weightPerUnit: num(item.weightPerUnit),
        volumePerUnit: num(item.volumePerUnit),
      })),
    deliveryStages: stages
      .filter((stage) => stage.name.trim() && num(stage.feeAmount) > 0)
      .map((stage, index) => ({
        sequence: index + 1,
        name: stage.name.trim(),
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
  })

  const submit = async (mode: 'draft' | 'approval') => {
    setFormError(null)
    const error = validate()
    if (error) {
      setFormError(error)
      return
    }
    setSaving(true)
    try {
      const response = await purchaseApi.createPurchaseOrder(buildPayload())
      const created = response.data?.data
      if (mode === 'approval' && created?.id) {
        await purchaseApi.updatePurchaseOrderStatus(created.id, 'PENDING_APPROVAL')
      }
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
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900">Create Purchase Order</h1>
          <p className="text-sm text-slate-500">
            Build the order, plan multi-stage freight and submit for approval.
          </p>
        </div>
        <Link to={paths.orders} className={secondaryButtonClass}>
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
          <Field label="Order date">
            <input
              type="date"
              className={inputClass}
              value={orderDate}
              onChange={(event) => setOrderDate(event.target.value)}
            />
          </Field>
          <Field label="Supplier">
            <select
              className={inputClass}
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
          <Field label="Supplier contact">
            <input
              className={inputClass}
              placeholder="Name, email or phone"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
            />
          </Field>
          <Field label="Currency">
            <select
              className={inputClass}
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
          <Field label="Exchange rate">
            <input
              type="number"
              min={0}
              step="0.000001"
              className={inputClass}
              value={exchangeRate}
              onChange={(event) => setExchangeRate(event.target.value)}
            />
          </Field>
          <Field label="Expected arrival">
            <input
              type="date"
              className={inputClass}
              value={expectedAt}
              onChange={(event) => setExpectedAt(event.target.value)}
            />
          </Field>
          <Field label="Payment terms">
            <input
              className={inputClass}
              placeholder="e.g. Net 30"
              value={paymentTerms}
              onChange={(event) => setPaymentTerms(event.target.value)}
            />
          </Field>
          <Field label="Destination warehouse">
            <select
              className={inputClass}
              value={warehouseId}
              onChange={(event) => setWarehouseId(event.target.value)}
            >
              <option value="">Select warehouse…</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Delivery terms">
            <select
              className={inputClass}
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
        subtitle="Products, pricing, weight and volume per unit"
        action={
          <button
            type="button"
            className={subtleButtonClass}
            onClick={() => setItems((current) => [...current, emptyItem()])}
          >
            <Plus size={13} />
            Add item
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className={thClass}>Product</th>
                <th className={`${thClass} w-20`}>Unit</th>
                <th className={`${thClass} w-24 text-right`}>Qty</th>
                <th className={`${thClass} w-28 text-right`}>Unit price</th>
                <th className={`${thClass} w-24 text-right`}>Discount</th>
                <th className={`${thClass} w-28 text-right`}>Net amount</th>
                <th className={`${thClass} w-28 text-right`}>Weight/unit (kg)</th>
                <th className={`${thClass} w-28 text-right`}>Volume/unit (m³)</th>
                <th className={`${thClass} w-10`} />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <ProductSearchSelect
                      value={item.productId}
                      onChange={(productId) => updateItem(item.key, { productId })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className={cellInputClass}
                      value={item.unit}
                      onChange={(event) => updateItem(item.key, { unit: event.target.value })}
                    >
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      className={`${cellInputClass} text-right`}
                      value={item.quantity}
                      onChange={(event) => updateItem(item.key, { quantity: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${cellInputClass} text-right`}
                      value={item.unitCost}
                      onChange={(event) => updateItem(item.key, { unitCost: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${cellInputClass} text-right`}
                      value={item.discount}
                      onChange={(event) => updateItem(item.key, { discount: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-medium text-slate-800">
                    {formatMoney(lineNet(item))}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.0001"
                      className={`${cellInputClass} text-right`}
                      value={item.weightPerUnit}
                      onChange={(event) =>
                        updateItem(item.key, { weightPerUnit: event.target.value })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.000001"
                      className={`${cellInputClass} text-right`}
                      value={item.volumePerUnit}
                      onChange={(event) =>
                        updateItem(item.key, { volumePerUnit: event.target.value })
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      aria-label="Remove line"
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-40"
                      disabled={items.length === 1}
                      onClick={() => removeItem(item.key)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-800">{formatMoney(subtotal)}</span>
        </div>
      </SectionCard>

      {/* Section 3 — delivery stages & charges */}
      <SectionCard
        index={3}
        title="Delivery Stages & Charges"
        subtitle="Multi-stage freight legs, carrier and how each leg is allocated"
        action={
          <button
            type="button"
            className={subtleButtonClass}
            onClick={() =>
              setStages((current) => [
                ...current,
                {
                  key: nextKey(),
                  name: '',
                  carrier: '',
                  feeAmount: '0',
                  allocationMethod: 'QUANTITY',
                  applicableProductIds: [],
                },
              ])
            }
          >
            <Plus size={13} />
            Add stage
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className={thClass}>Route</th>
                <th className={`${thClass} w-44`}>Carrier</th>
                <th className={`${thClass} w-32 text-right`}>Charge fee</th>
                <th className={`${thClass} w-44`}>Allocation method</th>
                <th className={`${thClass} w-56`}>Applicable products</th>
                <th className={`${thClass} w-10`} />
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => (
                <tr key={stage.key} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-2">
                    <input
                      className={cellInputClass}
                      placeholder="e.g. Shenzhen → Ho Chi Minh"
                      value={stage.name}
                      onChange={(event) => updateStage(stage.key, { name: event.target.value })}
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
                      onChange={(event) => {
                        setShippingTouched(false)
                        updateStage(stage.key, { feeAmount: event.target.value })
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className={cellInputClass}
                      value={stage.allocationMethod}
                      onChange={(event) =>
                        updateStage(stage.key, {
                          allocationMethod: event.target.value as CostAllocationMethod,
                        })
                      }
                    >
                      {COST_ALLOCATION_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {COST_ALLOCATION_METHOD_LABELS[method]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="max-h-24 space-y-1 overflow-y-auto pr-1">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <input
                          type="checkbox"
                          checked={stage.applicableProductIds.length === 0}
                          onChange={() => updateStage(stage.key, { applicableProductIds: [] })}
                        />
                        All products
                      </label>
                      {selectableProducts.length === 0 ? (
                        <p className="text-[11px] text-slate-400">Add products first</p>
                      ) : (
                        selectableProducts.map((product) => (
                          <label
                            key={product.id}
                            className="flex items-center gap-1.5 text-[11px] text-slate-600"
                          >
                            <input
                              type="checkbox"
                              checked={stage.applicableProductIds.includes(product.id)}
                              onChange={() => toggleScope(stage.key, product.id, 'stage')}
                            />
                            <span className="truncate" title={product.label}>
                              {product.label}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
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
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className={thClass}>Cost item</th>
                <th className={`${thClass} w-40`}>Category</th>
                <th className={`${thClass} w-32 text-right`}>Amount</th>
                <th className={`${thClass} w-40`}>Mode</th>
                <th className={`${thClass} w-44`}>Allocation method</th>
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
                  <td className="px-3 py-2">
                    <select
                      className={cellInputClass}
                      value={cost.allocationMethod}
                      onChange={(event) =>
                        updateCost(cost.key, {
                          allocationMethod: event.target.value as CostAllocationMethod,
                        })
                      }
                    >
                      {COST_ALLOCATION_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {COST_ALLOCATION_METHOD_LABELS[method]}
                        </option>
                      ))}
                    </select>
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
                  addFiles(event.dataTransfer.files)
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
                    addFiles(event.target.files)
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
                Files are kept for this session only.
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-900">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">Discount</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-right text-sm outline-none focus:border-[var(--dni-primary)]"
                value={discountAmount || ''}
                placeholder="0.00"
                onChange={(event) => setDiscountAmount(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">Tax</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-right text-sm outline-none focus:border-[var(--dni-primary)]"
                value={taxAmount || ''}
                placeholder="0.00"
                onChange={(event) => setTaxAmount(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">
                Shipping / freight
                {!shippingTouched && (
                  <span className="ml-1 text-xs text-sky-600">(from stages)</span>
                )}
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-right text-sm outline-none focus:border-[var(--dni-primary)]"
                value={shippingAmount || ''}
                placeholder="0.00"
                onChange={(event) => {
                  setShippingTouched(true)
                  setShippingAmount(event.target.value)
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <span className="text-sm font-semibold text-slate-800">
                Total = Subtotal − Discount + Tax + Shipping
              </span>
              <span className="text-base font-bold text-[var(--dni-primary)]">
                {formatMoney(totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
              <span>Additional costs</span>
              <span className="font-medium text-slate-700">
                {formatMoney(additionalCostsTotal)}
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
                className={secondaryButtonClass}
                disabled={saving}
                onClick={() => void submit('draft')}
              >
                Save Draft
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={saving}
                onClick={() => void submit('approval')}
              >
                {saving ? 'Saving…' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

export default CreatePurchaseOrderPage
