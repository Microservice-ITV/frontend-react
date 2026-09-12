import axios, { AxiosResponse } from 'axios'
import { productClient } from '@/lib/api/productClient'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import type {
  AdminCampaignStatus,
  AdminCampaignCreateInput,
  AdminCampaignUpdateInput,
  AdminItemAllocationInput,
  AdminProductOption,
  AdminSlotCreateInput,
  RawAdminCampaign,
} from '../types/adminFlashDealTypes'

type AdminCampaignsResponse = {
  success: boolean
  data: RawAdminCampaign[]
}

type ProductsListResponse = {
  success: boolean
  data: Array<{
    id: string
    name: string
    price?: string | number
    stock?: number
    images?: string[]
  }>
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.error?.message
    if (typeof msg === 'string' && msg.trim()) return msg
    const detail = error.response?.data?.message
    if (typeof detail === 'string' && detail.trim()) return detail
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/**
 * REST client for the flash-deal admin endpoints exposed by product-service
 * at `/flash-deals/admin`. All mutation responses are normalised to `data.data`.
 */
export const adminFlashDealApi = {
  listCampaigns(status?: AdminCampaignStatus): Promise<AxiosResponse<AdminCampaignsResponse>> {
    return productClient.get('/flash-deals/admin/campaigns', {
      params: status ? { status } : {},
    })
  },

  getCampaign(campaignId: string): Promise<AxiosResponse<{ success: boolean; data: RawAdminCampaign }>> {
    return productClient.get(`/flash-deals/admin/campaigns/${campaignId}`)
  },

  createCampaign(input: AdminCampaignCreateInput): Promise<AxiosResponse<{ success: boolean; data: RawAdminCampaign }>> {
    return productClient.post('/flash-deals/admin/campaigns', input)
  },

  updateCampaign(
    campaignId: string,
    input: AdminCampaignUpdateInput,
  ): Promise<AxiosResponse<{ success: boolean; data: RawAdminCampaign }>> {
    return productClient.patch(`/flash-deals/admin/campaigns/${campaignId}`, input)
  },

  createSlot(campaignId: string, input: AdminSlotCreateInput): Promise<AxiosResponse<{ success: boolean; data: unknown }>> {
    return productClient.post(`/flash-deals/admin/campaigns/${campaignId}/slots`, input)
  },

  activateSlot(slotId: string): Promise<AxiosResponse<{ success: boolean }>> {
    return productClient.post(`/flash-deals/admin/slots/${slotId}/activate`)
  },

  deactivateSlot(slotId: string): Promise<AxiosResponse<{ success: boolean }>> {
    return productClient.post(`/flash-deals/admin/slots/${slotId}/deactivate`)
  },

  assignProducts(
    slotId: string,
    items: AdminItemAllocationInput[],
  ): Promise<AxiosResponse<{ success: boolean; data: unknown }>> {
    return productClient.post(`/flash-deals/admin/slots/${slotId}/items`, { items })
  },

  setItemStatus(itemId: string, status: 'ACTIVE' | 'DISABLED'): Promise<AxiosResponse<{ success: boolean; data: unknown }>> {
    return productClient.post(`/flash-deals/admin/items/${itemId}/${status === 'ACTIVE' ? 'enable' : 'disable'}`)
  },

  updateItem(
    itemId: string,
    input: Partial<Pick<AdminItemAllocationInput, 'originalPrice' | 'dealPrice' | 'allocatedStock' | 'maxPerUser'>>,
  ): Promise<AxiosResponse<{ success: boolean; data: unknown }>> {
    return productClient.patch(`/flash-deals/admin/items/${itemId}`, input)
  },

  /** Search approved catalogue products for the item-allocation picker. */
  async searchProducts(query: string): Promise<AdminProductOption[]> {
    const clean = query.trim()
    const response = await productClient.get<ProductsListResponse>('/products', {
      params: {
        limit: 50,
        isActive: true,
        ...(clean ? { search: clean, page: 1 } : { page: 1 }),
      },
    })

    return (response.data.data ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price ?? 0),
      stock: Number(product.stock ?? 0),
      image: productServiceAssetUrl(product.images?.[0]),
    }))
  },

  getApiErrorMessage,
}