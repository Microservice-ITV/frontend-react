import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchSellerOrderSummariesAcrossOwnedShops,
  type SellerOrderSummary,
  type SellerOrderStatusFilter,
} from '../api/sellerOrderApi'

/** Fetch orders scoped to the authenticated user's active shop membership. */
export const fetchSellerOrdersByShop = createAsyncThunk<
  SellerOrderSummary[],
  { userId?: string | null; activeShopId?: string | null; statusFilter?: SellerOrderStatusFilter },
  { rejectValue: string }
>(
  'sellerOrders/fetchByShop',
  async ({ userId, activeShopId, statusFilter }, { rejectWithValue }) => {
    if (!userId && !activeShopId) {
      return rejectWithValue('No active shop context found for this account.')
    }

    try {
      return await fetchSellerOrderSummariesAcrossOwnedShops(userId, activeShopId, statusFilter)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load orders right now. Please try again.'
      return rejectWithValue(message)
    }
  },
)
