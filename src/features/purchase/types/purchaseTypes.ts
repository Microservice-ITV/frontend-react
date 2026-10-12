export const SUPPLIER_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number]

export type Supplier = {
  id: string
  name: string
  code: string | null
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  paymentTerms: string | null
  taxNumber: string | null
  currency: string
  status: SupplierStatus
  createdAt: string
  updatedAt: string
}

export type SupplierPayload = {
  name: string
  code?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  paymentTerms?: string | null
  taxNumber?: string | null
  currency?: string
  status?: SupplierStatus
}

export const PURCHASE_ORDER_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'PENDING',
  'APPROVED',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CLOSED',
  'CANCELLED',
] as const
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number]

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  ORDERED: 'Ordered',
  PARTIALLY_RECEIVED: 'Partially received',
  RECEIVED: 'Received',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export const COST_ALLOCATION_METHODS = [
  'QUANTITY',
  'WEIGHT',
  'VOLUME',
  'VALUE',
  'MANUAL',
] as const
export type CostAllocationMethod = (typeof COST_ALLOCATION_METHODS)[number]

export const COST_ALLOCATION_METHOD_LABELS: Record<CostAllocationMethod, string> = {
  QUANTITY: 'Quantity',
  WEIGHT: 'Weight',
  VOLUME: 'Volume / CBM',
  VALUE: 'Purchase value',
  MANUAL: 'Manual',
}

export const ADDITIONAL_COST_CATEGORIES = [
  'HANDLING',
  'CUSTOMS',
  'INSURANCE',
  'TAX',
  'FREIGHT',
  'OTHER',
] as const
export type AdditionalCostCategory = (typeof ADDITIONAL_COST_CATEGORIES)[number]

export const ADDITIONAL_COST_CATEGORY_LABELS: Record<AdditionalCostCategory, string> = {
  HANDLING: 'Handling',
  CUSTOMS: 'Customs duty',
  INSURANCE: 'Insurance',
  TAX: 'Tax',
  FREIGHT: 'Freight',
  OTHER: 'Other',
}

export const COST_STATUSES = ['ESTIMATED', 'ACTUAL'] as const
export type CostStatus = (typeof COST_STATUSES)[number]

export const COST_STATUS_LABELS: Record<CostStatus, string> = {
  ESTIMATED: 'Estimated',
  ACTUAL: 'Actual',
}

export const PURCHASE_COST_ADJUSTMENT_TYPES = ['FREIGHT', 'INVOICE', 'OTHER'] as const
export type PurchaseCostAdjustmentType = (typeof PURCHASE_COST_ADJUSTMENT_TYPES)[number]

export const PURCHASE_COST_ADJUSTMENT_TYPE_LABELS: Record<
  PurchaseCostAdjustmentType,
  string
> = {
  FREIGHT: 'Freight',
  INVOICE: 'Invoice',
  OTHER: 'Other',
}

export type PurchaseOrderItem = {
  id: string
  purchaseOrderId: string
  productId: string
  variantId: string
  sku: string | null
  productName: string | null
  description: string | null
  unit: string | null
  quantity: number
  unitCost: string
  discountAmount: string
  weightPerUnit: string
  volumePerUnit: string
  receivedQty: number
  acceptedQty: number
  rejectedQty: number
  lineTotal: string
}

export type PurchaseOrderStatusHistory = {
  id: string
  purchaseOrderId: string
  status: PurchaseOrderStatus
  note: string | null
  changedBy: string | null
  createdAt: string
}

export type PurchaseDeliveryStage = {
  id: string
  purchaseOrderId: string
  sequence: number
  name: string
  carrier: string | null
  feeAmount: string
  currency: string
  allocationMethod: CostAllocationMethod
  applicableProductIds: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type PurchaseDeliveryStagePayload = {
  sequence?: number
  name: string
  carrier?: string | null
  feeAmount: number
  currency?: string
  allocationMethod?: CostAllocationMethod
  applicableProductIds?: string[]
  notes?: string | null
}

export type PurchaseAdditionalCost = {
  id: string
  purchaseOrderId: string
  name: string
  category: AdditionalCostCategory
  amount: string
  currency: string
  allocationMethod: CostAllocationMethod
  status: CostStatus
  applicableProductIds: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type PurchaseAdditionalCostPayload = {
  name: string
  category?: AdditionalCostCategory
  amount: number
  currency?: string
  allocationMethod?: CostAllocationMethod
  status?: CostStatus
  applicableProductIds?: string[]
  notes?: string | null
}

export type PurchaseCostAdjustment = {
  id: string
  adjustmentNumber: string
  purchaseOrderId: string
  type: PurchaseCostAdjustmentType
  amount: string
  currency: string
  allocationMethod: CostAllocationMethod
  reason: string | null
  isApplied: boolean
  appliedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type PurchaseCostAdjustmentPayload = {
  type?: PurchaseCostAdjustmentType
  amount: number
  currency?: string
  allocationMethod?: CostAllocationMethod
  reason?: string | null
}

export type PurchaseOrder = {
  id: string
  orderNumber: string
  supplierId: string
  warehouseId: string
  status: PurchaseOrderStatus
  currency: string
  exchangeRate: string
  paymentTerms: string | null
  deliveryTerms: string | null
  notes: string | null
  supplierContact?: string | null
  orderDate?: string | null
  orderedAt: string | null
  expectedAt: string | null
  subtotal: string
  discountAmount: string
  taxAmount: string
  shippingAmount: string
  totalAmount: string
  createdBy: string | null
  createdAt: string
  updatedAt: string
  supplier?: Supplier
  warehouse?: { id: string; name: string; code?: string | null } | null
  items?: PurchaseOrderItem[]
  receipts?: PurchaseReceipt[]
  statusHistory?: PurchaseOrderStatusHistory[]
  deliveryStages?: PurchaseDeliveryStage[]
  additionalCosts?: PurchaseAdditionalCost[]
  costAdjustments?: PurchaseCostAdjustment[]
  attachments?: PurchaseOrderAttachment[]
}

export type PurchaseOrderAttachment = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export type PurchaseOrderItemPayload = {
  productId: string
  variantId?: string
  sku?: string | null
  productName?: string | null
  description?: string | null
  unit?: string | null
  quantity: number
  unitCost: number
  discountAmount?: number
  weightPerUnit?: number
  volumePerUnit?: number
}

export type PurchaseOrderPayload = {
  supplierId: string
  warehouseId: string
  currency?: string
  exchangeRate?: number
  paymentTerms?: string | null
  deliveryTerms?: string | null
  notes?: string | null
  supplierContact?: string | null
  orderDate?: string | null
  expectedAt?: string | null
  discountAmount?: number
  taxAmount?: number
  shippingAmount?: number
  items: PurchaseOrderItemPayload[]
  deliveryStages?: PurchaseDeliveryStagePayload[]
  additionalCosts?: PurchaseAdditionalCostPayload[]
  attachments?: Array<{
    fileName: string
    mimeType: string
    sizeBytes: number
    contentBase64: string
  }>
}

export const PURCHASE_RECEIPT_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const
export type PurchaseReceiptStatus = (typeof PURCHASE_RECEIPT_STATUSES)[number]

export const PURCHASE_RECEIPT_STATUS_LABELS: Record<PurchaseReceiptStatus, string> = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
  CANCELLED: 'Cancelled',
}

export type PurchaseReceiptItem = {
  id: string
  purchaseReceiptId: string
  purchaseOrderItemId: string | null
  productId: string
  variantId: string
  quantity: number
  acceptedQty: number | null
  rejectedQty: number
  unitCost: string
  lineTotal: string
  batchNumber: string | null
  expiryAt: string | null
}

export type PurchaseReceipt = {
  id: string
  receiptNumber: string
  purchaseOrderId: string
  warehouseId: string
  status: PurchaseReceiptStatus
  notes: string | null
  receivedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  items?: PurchaseReceiptItem[]
}

export type PurchaseReceiptItemPayload = {
  purchaseOrderItemId?: string
  productId: string
  variantId?: string
  quantity: number
  acceptedQty?: number | null
  rejectedQty?: number | null
  unitCost: number
  batchNumber?: string | null
  expiryAt?: string | null
}

export type PurchaseReceiptPayload = {
  purchaseOrderId: string
  warehouseId?: string
  notes?: string | null
  items: PurchaseReceiptItemPayload[]
}

export const PURCHASE_RETURN_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const
export type PurchaseReturnStatus = (typeof PURCHASE_RETURN_STATUSES)[number]

export const PURCHASE_RETURN_STATUS_LABELS: Record<PurchaseReturnStatus, string> = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
  CANCELLED: 'Cancelled',
}

export type PurchaseReturnItem = {
  id: string
  purchaseReturnId: string
  productId: string
  variantId: string
  quantity: number
  unitCost: string
  lineTotal: string
}

export type PurchaseReturn = {
  id: string
  returnNumber: string
  supplierId: string
  purchaseOrderId: string | null
  warehouseId: string
  status: PurchaseReturnStatus
  reason: string | null
  returnedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  supplier?: Supplier
  purchaseOrder?: Pick<PurchaseOrder, 'orderNumber'> | null
  items?: PurchaseReturnItem[]
}

export type PurchaseReturnItemPayload = {
  productId: string
  variantId?: string
  quantity: number
  unitCost: number
}

export type PurchaseReturnPayload = {
  supplierId: string
  warehouseId: string
  purchaseOrderId?: string | null
  reason?: string | null
  items: PurchaseReturnItemPayload[]
}

export const formatMoney = (value: string | number | null | undefined): string => {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return '—'
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}