import { createAsyncThunk } from '@reduxjs/toolkit'
import { flashDealApi } from '../api/flashDealApi'
import type {
  GqlFlashDealCampaign,
  GqlFlashDealTimeSlot,
  NormalisedFlashDealProduct,
  NormalisedFlashDealTimeSlot,
} from '../types/flashDealTypes'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

// ─────────────────────────────────────────────
// Normalisation helpers
// ─────────────────────────────────────────────
function normalizeImageUrl(url: string | undefined | null): string {
  if (!url || url.trim() === '') return ''
  return productServiceAssetUrl(url)
}

function normaliseTimeSlot(slot: GqlFlashDealTimeSlot): NormalisedFlashDealTimeSlot {
  const now = new Date()
  const start = new Date(slot.startTime)
  const end = new Date(slot.endTime)

  let status: NormalisedFlashDealTimeSlot['status'] = 'coming_soon'
  if (slot.status === 'ACTIVE' && start <= now && end >= now) {
    status = 'ongoing'
  } else if (slot.status === 'COMPLETED' || end < now) {
    status = 'ended'
  }

  const timeParts = slot.slotTime || start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return {
    id: slot.slotId,
    label: timeParts,
    time: timeParts,
    status,
    startTime: start,
    endTime: end,
  }
}

function normaliseProduct(
  item: GqlFlashDealCampaign['slots'][0]['products'][0],
  slotId: string,
): NormalisedFlashDealProduct {
  return {
    id: item.productId,
    name: item.title || 'Untitled Product',
    image: normalizeImageUrl(item.imageUrl),
    originalPrice: Number(item.originalPrice) || 0,
    dealPrice: Number(item.dealPrice) || 0,
    discountPercent: Number(item.discountPercent) || 0,
    soldCount: Number(item.soldStock) || 0,
    totalStock: Number(item.allocatedStock) || 0,
    slotId,
    shopName: item.shopName || 'Seller store',
  }
}

// ─────────────────────────────────────────────
// Thunk: fetch all campaigns (primary data source)
// ─────────────────────────────────────────────
export const fetchFlashDealCampaigns = createAsyncThunk<
  GqlFlashDealCampaign[],
  void,
  { rejectValue: string }
>('flashDeals/fetchCampaigns', async (_, { rejectWithValue }) => {
  try {
    const data = await flashDealApi.getFlashDealCampaigns()
    return data.getFlashDealCampaigns ?? []
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      (error instanceof Error ? error.message : 'Failed to load flash deals')
    return rejectWithValue(message)
  }
})

// ─────────────────────────────────────────────
// Thunk: fetch products for a specific slot (paginated)
// ─────────────────────────────────────────────
export const fetchFlashDealsBySlot = createAsyncThunk<
  { products: NormalisedFlashDealProduct[]; slot: NormalisedFlashDealTimeSlot | null; total: number; page: number; limit: number },
  { slotId: string; page?: number; limit?: number },
  { rejectValue: string }
>('flashDeals/fetchBySlot', async ({ slotId, page = 1, limit = 50 }, { rejectWithValue }) => {
  try {
    const data = await flashDealApi.getFlashDeals(slotId, page, limit)
    const result = data.getFlashDeals

    if (!result) {
      return { products: [], slot: null, total: 0, page, limit }
    }

    const products = result.items.map((item) => normaliseProduct(item, slotId))
    const slot = result.slot ? normaliseTimeSlot(result.slot) : null

    return { products, slot, total: result.total, page: result.page, limit: result.limit }
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      (error instanceof Error ? error.message : 'Failed to load flash deal products')
    return rejectWithValue(message)
  }
})

// ─────────────────────────────────────────────
// Thunk: fetch active time slots only
// ─────────────────────────────────────────────
export const fetchActiveTimeSlots = createAsyncThunk<
  NormalisedFlashDealTimeSlot[],
  void,
  { rejectValue: string }
>('flashDeals/fetchTimeSlots', async (_, { rejectWithValue }) => {
  try {
    const data = await flashDealApi.getActiveTimeSlots()
    return data.getActiveTimeSlots.map(normaliseTimeSlot)
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      (error instanceof Error ? error.message : 'Failed to load time slots')
    return rejectWithValue(message)
  }
})
