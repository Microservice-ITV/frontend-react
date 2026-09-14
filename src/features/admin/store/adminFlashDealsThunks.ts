import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AppDispatch } from '@/app/store'
import { adminFlashDealApi } from '../api/adminFlashDealApi'
import type {
  AdminFlashDealCampaign,
  AdminFlashDealItem,
  AdminFlashDealSlot,
  AdminCampaignCreateInput,
  AdminCampaignUpdateInput,
  AdminItemAllocationInput,
  AdminSlotCreateInput,
  RawAdminCampaign,
  RawAdminCampaignItem,
} from '../types/adminFlashDealTypes'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

const toNumber = (value: string | number | undefined | null): number =>
  Number(value ?? 0) || 0
const toInt = (value: string | number | undefined | null): number =>
  Math.floor(toNumber(value))

/** Slot time is a TIME column — normalise "14:30" / "14:30:00" / ISO datetime to "HH:MM". */
const slotTimeLabel = (raw: string): string => {
  if (!raw) return ''
  const timeMatch = raw.match(/^(\d{2}):(\d{2})(?::\d{2})?$/)
  if (timeMatch) return `${timeMatch[1]}:${timeMatch[2]}`
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toISOString().slice(11, 16)
}

const mapItem = (item: RawAdminCampaignItem): AdminFlashDealItem => {
  const originalPrice = toNumber(item.originalPrice)
  const dealPrice = toNumber(item.dealPrice)
  const allocatedStock = toInt(item.allocatedStock)
  const soldStock = toInt(item.soldStock)
  const discountPercent =
    originalPrice > 0 ? Math.round((1 - dealPrice / originalPrice) * 100) : 0
  const soldPercent = allocatedStock > 0 ? Math.round((soldStock / allocatedStock) * 100) : 0

  return {
    id: item.id,
    slotId: item.slotId,
    productId: item.productId,
    variantId: item.variantId ?? null,
    productName: item.product?.name ?? 'Unknown product',
    productImage: productServiceAssetUrl(item.product?.images?.[0]),
    originalPrice,
    dealPrice,
    discountPercent,
    allocatedStock,
    soldStock,
    soldPercent,
    limitPerUser: toInt(item.maxPerUser ?? 1) || 1,
    status: item.status,
    createdAt: item.createdAt ?? '',
  }
}

const mapSlot = (slot: NonNullable<RawAdminCampaign['slots']>[number]): AdminFlashDealSlot => ({
  id: slot.id,
  campaignId: slot.campaignId,
  slotTime: slotTimeLabel(slot.slotTime),
  status: slot.status,
  items: (slot.items ?? []).map(mapItem),
})

const mapCampaign = (campaign: RawAdminCampaign): AdminFlashDealCampaign => ({
  id: campaign.id,
  title: campaign.title,
  description: campaign.description ?? '',
  startTime: campaign.startTime,
  endTime: campaign.endTime,
  status: campaign.status,
  createdAt: campaign.createdAt,
  slots: (campaign.slots ?? []).map(mapSlot),
})

export const fetchAdminFlashDealCampaigns = createAsyncThunk<
  AdminFlashDealCampaign[],
  void,
  { rejectValue: string }
>('adminFlashDeals/fetchCampaigns', async (_, { rejectWithValue }) => {
  try {
    const response = await adminFlashDealApi.listCampaigns()
    return (response.data.data ?? []).map(mapCampaign)
  } catch (error: unknown) {
    return rejectWithValue(
      adminFlashDealApi.getApiErrorMessage(
        error,
        'Unable to load flash deals right now. Please try again.',
      ),
    )
  }
})

const refetch = async (dispatch: AppDispatch): Promise<void> => {
  await dispatch(fetchAdminFlashDealCampaigns()).unwrap()
}

export const createAdminFlashDealCampaign = createAsyncThunk<
  void,
  AdminCampaignCreateInput,
  { rejectValue: string }
>('adminFlashDeals/createCampaign', async (input, { dispatch, rejectWithValue }) => {
  try {
    await adminFlashDealApi.createCampaign(input)
    await refetch(dispatch)
  } catch (error: unknown) {
    return rejectWithValue(
      adminFlashDealApi.getApiErrorMessage(error, 'Could not create flash deal campaign. Try again.'),
    )
  }
})

export const updateAdminFlashDealCampaign = createAsyncThunk<
  void,
  { campaignId: string; input: AdminCampaignUpdateInput },
  { rejectValue: string }
>('adminFlashDeals/updateCampaign', async ({ campaignId, input }, { dispatch, rejectWithValue }) => {
  try {
    await adminFlashDealApi.updateCampaign(campaignId, input)
    await refetch(dispatch)
  } catch (error: unknown) {
    return rejectWithValue(
      adminFlashDealApi.getApiErrorMessage(error, 'Could not update flash deal campaign. Try again.'),
    )
  }
})

export const createAdminFlashDealSlot = createAsyncThunk<
  void,
  { campaignId: string; input: AdminSlotCreateInput },
  { rejectValue: string }
>('adminFlashDeals/createSlot', async ({ campaignId, input }, { dispatch, rejectWithValue }) => {
  try {
    await adminFlashDealApi.createSlot(campaignId, input)
    await refetch(dispatch)
  } catch (error: unknown) {
    return rejectWithValue(
      adminFlashDealApi.getApiErrorMessage(error, 'Could not create time slot. Try again.'),
    )
  }
})

export const setAdminFlashDealSlotStatus = createAsyncThunk<
  void,
  { slotId: string; status: 'ACTIVE' | 'CANCELLED' },
  { rejectValue: string }
>('adminFlashDeals/setSlotStatus', async ({ slotId, status }, { dispatch, rejectWithValue }) => {
  try {
    if (status === 'ACTIVE') {
      await adminFlashDealApi.activateSlot(slotId)
    } else {
      await adminFlashDealApi.deactivateSlot(slotId)
    }
    await refetch(dispatch)
  } catch (error: unknown) {
    return rejectWithValue(
      adminFlashDealApi.getApiErrorMessage(error, 'Could not update slot status. Try again.'),
    )
  }
})

export const assignAdminFlashDealProducts = createAsyncThunk<
  void,
  { slotId: string; items: AdminItemAllocationInput[] },
  { rejectValue: string }
>('adminFlashDeals/assignProducts', async ({ slotId, items }, { dispatch, rejectWithValue }) => {
  try {
    await adminFlashDealApi.assignProducts(slotId, items)
    await refetch(dispatch)
  } catch (error: unknown) {
    return rejectWithValue(
      adminFlashDealApi.getApiErrorMessage(error, 'Could not assign products to slot. Try again.'),
    )
  }
})

export const setAdminFlashDealItemStatus = createAsyncThunk<
  void,
  { itemId: string; status: 'ACTIVE' | 'DISABLED' },
  { rejectValue: string }
>('adminFlashDeals/setItemStatus', async ({ itemId, status }, { dispatch, rejectWithValue }) => {
  try {
    await adminFlashDealApi.setItemStatus(itemId, status)
    await refetch(dispatch)
  } catch (error: unknown) {
    return rejectWithValue(
      adminFlashDealApi.getApiErrorMessage(error, 'Could not update deal item. Try again.'),
    )
  }
})