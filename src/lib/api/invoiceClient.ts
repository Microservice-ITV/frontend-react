import axios from 'axios'
import { INVOICE_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'
import { extractRoleFromUser } from '@/app/rbac/normalizers'

export type InvoiceStatus =
  | 'UNPAID'
  | 'PENDING_VERIFICATION'
  | 'PAID'
  | 'REJECTED'
  | 'VOID'
  | 'REFUNDED'

export type InvoiceDocument = {
  id: string
  invoiceNumber: string
  orderId: string
  orderReference: string | null
  shopId: string
  shopName?: string | null
  shopContactName: string | null
  shopContactEmail: string | null
  shopContactPhone: string | null
  shopAddress: string | null
  customerId: string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone: string | null
  billingAddress: Record<string, unknown> | null
  shippingAddress: Record<string, unknown> | null
  lineItems: Array<{
    orderItemId?: string
    name: string
    sku?: string | null
    imageUrl?: string | null
    quantity: number
    unitPrice: string
    total: string
  }> | null
  items?: Array<{
    orderItemId: string
    productId: string
    productSku: string | null
    productName: string
    imageUrl?: string | null
    quantity: number
    unitPrice: string
    totalPrice: string
  }>
  subtotal: string
  deliveryFee: string
  taxAmount: string
  discountAmount: string
  grandTotal: string
  currency: string
  otherCharges?: Array<{
    label: string
    amount: string | number | null
  }> | null
  paymentMethod: string | null
  paymentGatewayRef: string | null
  paymentSlipUrl: string | null
  status: InvoiceStatus
  pdfUrl: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  rejectionReason: string | null
  verificationNote: string | null
  refundAmount: string | null
  refundMethod: string | null
  refundReason: string | null
  createdAt: string
  updatedAt: string
}

type InvoiceListResponse = {
  success: boolean
  data: InvoiceDocument[]
}

export type InvoiceReplayResult = {
  orderId: string
  status: 'CREATED' | 'ALREADY_EXISTS' | 'INELIGIBLE' | 'FAILED'
  reason?: string
}

export type InvoiceReplaySummary = {
  total: number
  created: number
  skipped_existing: number
  skipped_ineligible: number
  failed: number
  results: InvoiceReplayResult[]
}

export type MissingInvoiceShop = {
  shopId: string
  shopName: string | null
  expectedInvoiceStatus: 'PAID' | 'UNPAID'
  subtotal: string
  deliveryFee: string
  discountAmount: string
  grandTotal: string
  reason: 'NO_INVOICE_FOR_SHOP'
}

export type MissingInvoiceOrder = {
  orderId: string
  customerId: string
  customerName: string | null
  paymentStatus: string
  paymentMethod: string | null
  currency: string | null
  createdAt: string
  missingShops: MissingInvoiceShop[]
}

export type MissingInvoicePage = {
  data: MissingInvoiceOrder[]
  nextCursor: string | null
  hasMore: boolean
}

export type MissingInvoiceReplayResult = {
  orderId: string
  shopId: string
  status: 'CREATED' | 'ALREADY_EXISTS' | 'INELIGIBLE' | 'FAILED'
  reason?: string
}

export type MissingInvoiceReplaySummary = {
  total: number
  created: number
  skipped_existing: number
  skipped_ineligible: number
  failed: number
  hasMore: boolean
  nextCursor: string | null
  results: MissingInvoiceReplayResult[]
}

type InvoiceReplayResponse = {
  success: boolean
  data: InvoiceReplaySummary
}

type InvoiceApiResponse<T> = {
  success: boolean
  data: T
}

export type AdminInvoiceQueryParams = {
  status?: string
  shopId?: string
  page?: number
}

export type RefundInvoicePayload = {
  amount: number
  method: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'SYSTEM_CREDIT'
  reason: string
}

export type PartialInvoiceItemRequest = {
  orderItemId: string
  quantity: number
}

export type PartialInvoiceRequest = {
  orderId: string
  items: PartialInvoiceItemRequest[]
  customerName?: string | null
  customerEmail?: string | null
  paymentMethod?: string
}

export const invoiceClient = axios.create({
  baseURL: INVOICE_SERVICE_BASE_URL,
})

setupAuthInterceptors(invoiceClient)

invoiceClient.interceptors.request.use(async (config) => {
  const { store } = await import('@/app/store')
  const user = store.getState().auth.user
  const url = config.url ?? ''
  const isMyInvoicesRequest = url.endsWith('/invoices/my-invoices')
  const isCustomerInvoiceRequest = url.startsWith('/invoices/by-number/')
    && config.headers.get('x-user-role') === 'customer'
  const isCustomerPdfRequest = /^\/invoices\/[^/]+\/pdf$/.test(url)
    && config.headers.get('x-user-role') === 'customer'
  const isCustomerScopedRequest = isMyInvoicesRequest || isCustomerInvoiceRequest || isCustomerPdfRequest
  const isAllShopInvoicesRequest = url.endsWith('/invoices/shop-invoices')
  const isAdminInvoiceRequest = url.includes('/invoices/admin/') || url.startsWith('/admin/invoices/')
  const isSellerInvoiceRequest = url.includes('/invoices/shop-invoices') || url.includes('/invoices/manage')
  const role = {
    SUPER_ADMIN: 'admin',
    SHOP_OWNER: 'shopAdmin',
    SHOP_ADMIN: 'shopAdmin',
    USER: 'customer',
  }[extractRoleFromUser(user)]

  if (isCustomerScopedRequest) {
    config.headers.set('x-user-role', 'customer')
    config.headers.delete('x-shop-id')
  } else if (isAdminInvoiceRequest) {
    config.headers.set('x-user-role', 'admin')
  } else if (isSellerInvoiceRequest) {
    config.headers.set('x-user-role', 'shopAdmin')
  } else if (role) {
    config.headers.set('x-user-role', role)
  }

  if (!isCustomerScopedRequest && user?.active_shop_id) {
    config.headers.set('x-shop-id', user.active_shop_id)
  }
  if (user?.id) {
    config.headers.set('x-user-id', user.id)
    config.headers.set('x-customer-id', user.id)
  }

  return config
})

export const getShopInvoices = async (
  status?: InvoiceStatus,
): Promise<InvoiceDocument[]> => {
  const response = await invoiceClient.get<InvoiceListResponse>(
    '/invoices/shop-invoices',
    { params: status ? { status } : undefined },
  )

  return response.data.data.map(normalizeInvoiceItems)
}

export const getMyInvoices = async (): Promise<InvoiceDocument[]> => {
  const response = await invoiceClient.get<InvoiceListResponse>(
    '/invoices/my-invoices',
  )

  return response.data.data.map(normalizeInvoiceItems)
}

export const getCustomerInvoiceByNumber = async (
  invoiceNumber: string,
): Promise<InvoiceDocument> => {
  const response = await invoiceClient.get<InvoiceApiResponse<InvoiceDocument>>(
    `/invoices/by-number/${encodeURIComponent(invoiceNumber)}`,
    { headers: { 'x-user-role': 'customer' } },
  )
  return normalizeInvoiceItems(response.data.data)
}

export const getInvoiceByNumber = async (
  invoiceNumber: string,
): Promise<InvoiceDocument> => {
  const response = await invoiceClient.get<InvoiceApiResponse<InvoiceDocument>>(
    `/invoices/by-number/${encodeURIComponent(invoiceNumber)}`,
  )
  return normalizeInvoiceItems(response.data.data)
}

export const createPartialInvoice = async (
  payload: PartialInvoiceRequest,
  idempotencyKey: string,
): Promise<InvoiceDocument> => {
  const response = await invoiceClient.post<InvoiceApiResponse<InvoiceDocument>>(
    '/invoices/partial',
    payload,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    },
  )

  return response.data.data
}

export const verifyInvoice = async (
  invoiceId: string,
  approved: boolean,
  reason?: string,
): Promise<InvoiceDocument> => {
  const response = await invoiceClient.post<InvoiceApiResponse<InvoiceDocument>>(
    `/invoices/${invoiceId}/verify-slip`,
    { approved, reason },
  )

  return response.data.data
}

export const uploadPaymentSlip = async (
  invoiceId: string,
  paymentSlipUrl: string,
): Promise<InvoiceDocument> => {
  const response = await invoiceClient.post<InvoiceApiResponse<InvoiceDocument>>(
    `/invoices/${invoiceId}/upload-slip`,
    { paymentSlipUrl },
  )

  return response.data.data
}

export const generateInvoicePdf = async (
  invoiceId: string,
): Promise<InvoiceDocument> => {
  const response = await invoiceClient.post<InvoiceApiResponse<InvoiceDocument>>(
    `/invoices/${invoiceId}/generate-pdf`,
  )

  return response.data.data
}

export const batchGeneratePdfs = async (
  invoiceIds: string[],
): Promise<InvoiceDocument[]> => {
  const response = await invoiceClient.post<InvoiceApiResponse<InvoiceDocument[]>>(
    '/invoices/batch/generate-pdf',
    { invoiceIds },
  )

  return response.data.data
}

export const downloadBatchPdfs = async (
  invoiceIds: string[],
): Promise<Blob> => {
  const response = await invoiceClient.post<Blob>(
    '/invoices/batch/download',
    { invoiceIds },
    { responseType: 'blob' },
  )

  return response.data
}

export const getAllAdminInvoices = async (
  params?: AdminInvoiceQueryParams,
): Promise<InvoiceDocument[]> => {
  const response = await invoiceClient.get<InvoiceListResponse>(
    '/invoices/admin/all',
    { params },
  )

  return response.data.data
}

export const replayInvoices = async (orderIds: string[]): Promise<InvoiceReplaySummary> => {
  const response = await invoiceClient.post<InvoiceReplayResponse>(
    '/admin/invoices/replay',
    { orderIds },
  )

  return response.data.data
}

export const getMissingInvoices = async (
  params: { limit?: number; cursor?: string | null } = {},
): Promise<MissingInvoicePage> => {
  const response = await invoiceClient.get<InvoiceApiResponse<MissingInvoicePage>>(
    '/admin/invoices/missing',
    { params },
  )
  return response.data.data
}

export const replayMissingInvoice = async (
  orderId: string,
  shopId: string,
): Promise<MissingInvoiceReplayResult> => {
  const response = await invoiceClient.post<InvoiceApiResponse<MissingInvoiceReplayResult>>(
    '/admin/invoices/missing/replay',
    { orderId, shopId },
  )
  return response.data.data
}

export const replayAllMissingInvoices = async (
  cursor?: string | null,
): Promise<MissingInvoiceReplaySummary> => {
  const response = await invoiceClient.post<InvoiceApiResponse<MissingInvoiceReplaySummary>>(
    '/admin/invoices/missing/replay-all',
    cursor ? { cursor } : {},
  )
  return response.data.data
}

export const voidInvoice = async (
  invoiceId: string,
  reason: string,
): Promise<InvoiceDocument> => {
  const response = await invoiceClient.post<InvoiceApiResponse<InvoiceDocument>>(
    `/invoices/${invoiceId}/void`,
    { reason },
  )

  return response.data.data
}

export const refundInvoice = async (
  invoiceId: string,
  payload: RefundInvoicePayload,
): Promise<InvoiceDocument> => {
  const response = await invoiceClient.post<InvoiceApiResponse<InvoiceDocument>>(
    `/invoices/${invoiceId}/refund`,
    payload,
  )

  return response.data.data
}

const normalizeInvoiceItems = (invoice: InvoiceDocument): InvoiceDocument => {
  const storedItems = invoice.items ?? []
  const lineItems = invoice.lineItems ?? []

  return {
    ...invoice,
    lineItems: lineItems.length > 0
      ? lineItems.map((item, index) => ({
        ...item,
        orderItemId: item.orderItemId ?? storedItems[index]?.orderItemId,
      }))
      : storedItems.map((item) => ({
        orderItemId: item.orderItemId,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice,
        imageUrl: item.imageUrl,
      })),
  }
}

export const downloadInvoicePdf = async (
  invoiceId: string,
  options: { asCustomer?: boolean } = {},
): Promise<Blob> => {
  const response = await invoiceClient.get<Blob>(
    `/invoices/${invoiceId}/pdf`,
    {
      responseType: 'blob',
      ...(options.asCustomer ? { headers: { 'x-user-role': 'customer' } } : {}),
    },
  )
  return response.data
}

/**
 * Fetch an invoice for the print route using a short-lived, single-invoice print
 * token issued by the invoice service (used by the headless PDF renderer).
 * The token is verified server-side, including invoice ownership.
 */
export const getInvoiceForPrint = async (
  invoiceNumber: string,
  printToken: string,
): Promise<InvoiceDocument> => {
  const response = await invoiceClient.get<InvoiceApiResponse<InvoiceDocument>>(
    `/invoices/print/${encodeURIComponent(invoiceNumber)}`,
    { headers: { 'x-print-token': printToken } },
  )

  return normalizeInvoiceItems(response.data.data)
}