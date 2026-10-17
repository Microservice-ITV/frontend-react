import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchOrdersAcrossOwnedShops,
  type SellerOrder,
  type SellerOrderStatusFilter,
} from '../api/sellerOrderApi'

/**
 * Fetch orders across every shop owned by the seller, optionally filtered by fulfillment status.
 *
 * Resolves the caller's owned shops via product-service, then merges the
 * `shopOrders` projections per shop (dedup by orderId). Falls back to the
 * provided activeShopId when ownership lookup fails so the dashboard still
 * renders for single-shop sellers.
 */
export const fetchSellerOrdersByShop = createAsyncThunk<
  SellerOrder[],
  { userId?: string | null; activeShopId?: string | null; statusFilter?: SellerOrderStatusFilter },
  { rejectValue: string }
>(
  'sellerOrders/fetchByShop',
  async ({ userId, activeShopId, statusFilter }, { rejectWithValue }) => {
    if (!userId && !activeShopId) {
      return rejectWithValue('No active shop context found for this account.')
    }

    try {
      return await fetchOrdersAcrossOwnedShops(userId, activeShopId, statusFilter)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load orders right now. Please try again.'
      return rejectWithValue(message)
    }
  },
)
