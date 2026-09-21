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
  shopId: string
  shopName?: string
  customerId: string
  customerName?: string
  customerEmail?: string
  subtotal: string
  taxAmount: string
  discountAmount: string
  grandTotal: string
  currency: string
  paymentMethod: string
  paymentGatewayRef: string | null
  paymentSlipUrl: string | null
  status: InvoiceStatus
  pdfUrl: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  rejectionReason: string | null
  verificationNote: string | null
  createdAt: string
  updatedAt: string
}

type InvoiceListResponse = {
  success: boolean
  data: InvoiceDocument[]
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
  const isAdminInvoiceRequest = url.includes('/invoices/admin/')
  const isSellerInvoiceRequest = url.includes('/invoices/shop-invoices') || url.includes('/invoices/manage')
  const role = {
    SUPER_ADMIN: 'admin',
    SHOP_OWNER: 'shopAdmin',
    SHOP_ADMIN: 'shopAdmin',
    USER: 'customer',
  }[extractRoleFromUser(user)]

  if (isMyInvoicesRequest) {
    config.headers.set('x-user-role', 'customer')
    config.headers.delete('x-shop-id')
  } else if (isAdminInvoiceRequest) {
    config.headers.set('x-user-role', 'admin')
  } else if (isSellerInvoiceRequest) {
    config.headers.set('x-user-role', 'shopAdmin')
  } else if (role) {
    config.headers.set('x-user-role', role)
  }

  if (!isMyInvoicesRequest && user?.active_shop_id) {
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

  return response.data.data
}

export const getMyInvoices = async (): Promise<InvoiceDocument[]> => {
  const response = await invoiceClient.get<InvoiceListResponse>(
    '/invoices/my-invoices',
  )

  return response.data.data
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