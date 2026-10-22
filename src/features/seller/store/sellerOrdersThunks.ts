import { createAsyncThunk } from '@reduxjs/toolkit'
import { fetchOrdersAcrossOwnedShops, type SellerOrder } from '../api/sellerOrderApi'

/** Fetch orders scoped to the authenticated user's active shop membership. */
export const fetchSellerOrdersByShop = createAsyncThunk<
  SellerOrder[],
  { userId?: string | null; activeShopId?: string | null },
  { rejectValue: string }
>(
  'sellerOrders/fetchByShop',
  async ({ userId, activeShopId }, { rejectWithValue }) => {
    if (!userId && !activeShopId) {
      return rejectWithValue('No active shop context found for this account.')
    }

    try {
      return await fetchOrdersAcrossOwnedShops(userId, activeShopId)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load orders right now. Please try again.'
      return rejectWithValue(message)
    }
  },
)
