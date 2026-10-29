export const WAREHOUSE_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number]

export const WAREHOUSE_STATUS_LABELS: Record<WarehouseStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

export const MOVEMENT_TYPES = [
  'PURCHASE_RECEIVED',
  'PURCHASE_RETURNED',
  'SALE_ISSUED',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'RETURN_RECEIVED',
  'INITIAL_BALANCE',
] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  PURCHASE_RECEIVED: 'Purchase Received',
  PURCHASE_RETURNED: 'Purchase Returned',
  SALE_ISSUED: 'Sale Issued',
  TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out',
  RETURN_RECEIVED: 'Return Received',
  INITIAL_BALANCE: 'Initial Balance',
}

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
}

export const REFERENCE_TYPE_OPTIONS = [
  'PURCHASE_RECEIPT',
  'PURCHASE_RETURN',
  'TRANSFER',
  'RETURN_RECEIVED',
  'INITIAL_BALANCE',
] as const

export interface Warehouse {
  id: string
  code: string | null
  name: string
  address: string | null
  status: WarehouseStatus
  capacityUnits?: number | null
  usedUnits?: number
  remainingUnits?: number | null
  isAtCapacity?: boolean
  createdBy?: string | null
  sellerUserId?: string | null
}

export interface InventoryStock {
  id: string
  warehouseId: string
  productId: string
  variantId: string
  onHandQty: number
  reservedQty: number
  availableQty: number
  updatedAt: string
  availability?: AvailabilityStatus
  colorName?: string | null
  sizeName?: string | null
  variantLabel?: string | null
  /** Unit price in effect: the seller's override, else the PO calculation. */
  unitPrice?: number | null
  /** Landed cost per unit from the purchase order that supplied the stock. */
  poUnitPrice?: number | null
  /** Seller-entered unit price (null = follow the PO). */
  unitPriceOverride?: number | null
  /** Posted POs that supplied this variant, newest first. */
  poHistory?: Array<{
    purchaseOrderId: string
    orderNumber: string
    receivedAt: string | null
    quantity: number
    unitPrice: number
    currency: string
    /** Rate entered on the PO. */
    poExchangeRate: number
    /** Received rate if set, else the PO rate; unitPrice is based on it. */
    exchangeRate: number
  }>
  length?: number | null
  width?: number | null
  height?: number | null
  weightPerUnit?: number | null
  volumePerUnit?: number | null
  unit?: string | null
}

export interface InventoryMovement {
  id: string
  warehouseId: string
  productId: string
  variantId: string
  movementType: MovementType
  quantity: number
  beforeQty: number
  afterQty: number
  referenceType: string | null
  referenceId: string | null
  unitCost: string | null
  createdBy: string | null
  /** Readable actor label resolved by warehouse-service (name or email). */
  createdByName?: string | null
  createdAt: string
  /**
   * Routing labels enriched when listing: transfer warehouses, supplier name for
   * purchase receive/return, seller shop name for warehouse orders.
   */
  fromWarehouseId?: string | null
  toWarehouseId?: string | null
  fromWarehouseName?: string | null
  toWarehouseName?: string | null
}

export interface StockMutationPayload {
  warehouseId: string
  productId: string
  variantId?: string
  quantity: number
  referenceId: string
  referenceType?: string
  unitCost?: number
  createdBy?: string
}

export interface TransferPayload {
  fromWarehouseId?: string
  toWarehouseId: string
  fromSeller?: boolean
  /** Seller W→W: skip seller approval; warehouse manager completes. */
  sellerInitiated?: boolean
  productId: string
  variantId?: string
  quantity: number
  referenceId: string
  referenceType?: string
  createdBy?: string
}

export interface SellerStock {
  id: string
  userId: string
  productId: string
  variantId: string
  onHandQty: number
  availableQty: number
  updatedAt: string
}

export const TRANSFER_STATUSES = ['PENDING', 'SELLER_APPROVED', 'AWAITING_RECEIPT', 'APPROVED', 'REJECTED'] as const
export type TransferStatus = (typeof TRANSFER_STATUSES)[number]

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  PENDING: 'Pending',
  SELLER_APPROVED: 'Approved',
  AWAITING_RECEIPT: 'Awaiting receipt',
  APPROVED: 'Received',
  REJECTED: 'Rejected',
}

export const transferStatusLabel = (row: {
  status: TransferStatus
  approvalSellerUserId?: string | null
  fromSellerUserId?: string | null
  requestedBy?: string | null
}) => {
  // WM-initiated warehouse→warehouse still waiting on the seller.
  if (row.status === 'PENDING' && row.approvalSellerUserId && !row.fromSellerUserId) {
    return 'Waiting for seller'
  }
  // Seller-approved or seller-initiated: waiting for warehouse manager to complete.
  if (row.status === 'SELLER_APPROVED' && !row.fromSellerUserId) {
    return 'Approved — complete transfer'
  }
  return TRANSFER_STATUS_LABELS[row.status]
}

/** A stock transfer awaiting approval. Stock only moves once APPROVED. */
export interface WarehouseTransfer {
  id: string
  fromWarehouseId: string | null
  fromSellerUserId?: string | null
  toWarehouseId: string
  productId: string
  variantId: string
  quantity: number
  status: TransferStatus
  referenceId: string | null
  referenceType: string | null
  requestedBy: string | null
  approvalSellerUserId?: string | null
  decidedBy: string | null
  decidedAt: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface WarehousePayload {
  name: string
  code?: string | null
  address?: string | null
  status?: WarehouseStatus
  capacityUnits: number
  managerUserId?: string
}

export const warehouseCapacityLabel = (warehouse: Pick<
  Warehouse,
  'capacityUnits' | 'usedUnits' | 'isAtCapacity'
>): string => {
  if (warehouse.capacityUnits == null) return 'Unlimited'
  const used = warehouse.usedUnits ?? 0
  return `${used}/${warehouse.capacityUnits} units${warehouse.isAtCapacity ? ' · Full' : ''}`
}

/** Mirrors the service rule: <= 0 out, <= 5 low, otherwise in stock. */
export const toAvailability = (availableQty: number): AvailabilityStatus => {
  if (availableQty <= 0) return 'OUT_OF_STOCK'
  if (availableQty <= 5) return 'LOW_STOCK'
  return 'IN_STOCK'
}

export const resolveAvailability = (stock: InventoryStock): AvailabilityStatus =>
  stock.availability ?? toAvailability(stock.availableQty)

/** Inventory row enriched with the warehouse it belongs to (cross-warehouse views). */
export interface InventoryRow extends InventoryStock {
  warehouseName: string
  availabilityStatus: AvailabilityStatus
}

export interface StockOperationResult {
  stock: InventoryStock | null
  fromStock?: InventoryStock | null
  toStock?: InventoryStock | null
}

export type StockOperationKind = 'transfer'
