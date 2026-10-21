import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchSellerOrderSummariesAcrossOwnedShops,
  type SellerOrderSummary,
  type SellerOrderStatusFilter,
} from '../api/sellerOrderApi'

/**
 * Fetch the seller's orders as compact summaries (order id, waybill, customer,
 * items, status, total, date) for the list page and dashboard widgets.
 *
 * Resolves the caller's owned shops via product-service, then requests the
 * list projection once for every shop scope (the read-service resolver scopes
 * server-side). Falls back to the provided activeShopId when ownership lookup
 * fails so the dashboard still renders for single-shop sellers. Full order
 * detail is fetched separately, per order, on the detail page.
 */
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
