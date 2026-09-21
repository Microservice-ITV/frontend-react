import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import {
    shippingApi,
    buildCalculatePayload,
    resolveDeliveryCoordinates,
    type CalculateShippingCustomer,
} from '../api/shippingApi'
import { normalizeBatchShopProfiles, normalizeCalculateResponse } from '../utils/normalizeShipping'
import type { UserAddress } from '@/features/account/types/addressTypes'
import type { CartItem } from '@/features/cart/types/cartTypes'

function cartShopIdsKey(items: { shopId: string }[]): string {
    return [...new Set(items.map((i) => i.shopId).filter(Boolean))].sort().join(',')
}

/**
 * Loads shop shipping profiles for all shops currently in the cart.
 * Deduped when cart shop-id set unchanged and last batch succeeded (see `condition`).
 */
export const fetchShopProfilesForCurrentCart = createAsyncThunk(
    'shipping/fetchBatchForCart',
    async (_, { getState, rejectWithValue }) => {
        try {
            const items = (getState() as RootState).cart.items
            const shopIds = [...new Set(items.map((i) => i.shopId).filter(Boolean))]
            if (shopIds.length === 0) {
                return { profilesByShopId: {}, shopIdsKey: '' }
            }

            const res = await shippingApi.batchShopProfiles(shopIds)
            const body = res.data as Record<string, unknown> | unknown
            const inner =
                body &&
                typeof body === 'object' &&
                'data' in (body as Record<string, unknown>) &&
                (body as Record<string, unknown>).data !== undefined
                    ? (body as Record<string, unknown>).data
                    : body

            const profilesByShopId = normalizeBatchShopProfiles(inner)
            return { profilesByShopId, shopIdsKey: cartShopIdsKey(items) }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
                    : ''
            return rejectWithValue(msg || (e instanceof Error ? e.message : 'Failed to load shipping profiles'))
        }
    },
    {
        condition: (_, { getState }) => {
            const state = getState() as RootState
            if (state.shipping.batchStatus === 'loading') return false
            const items = state.cart.items
            const key = cartShopIdsKey(items)
            if (!key) return false
            if (state.shipping.batchKey === key && state.shipping.batchStatus === 'succeeded') {
                return false
            }
            return true
        },
    },
)

export type FetchCalculateArgs = {
    address: UserAddress
    items: CartItem[]
    /** Dedupe key: address id + cart fingerprint */
    cacheKey: string
    customer?: CalculateShippingCustomer
}

export const fetchCheckoutShippingCalculation = createAsyncThunk(
    'shipping/calculate',
    async ({ address, items, cacheKey, customer }: FetchCalculateArgs, { rejectWithValue }) => {
        try {
            if (items.length === 0) {
                return { byShopId: {}, totalShippingFee: null, cacheKey, raw: null as unknown }
            }
            const coords = await resolveDeliveryCoordinates(address)
            if (!coords) {
                return rejectWithValue(
                    'We could not locate this delivery address on the map. Add a map pin to your address and try again.',
                )
            }
            const payload = buildCalculatePayload(address, items, coords, customer)
            const res = await shippingApi.calculateShipping(payload)
            const body = res.data as Record<string, unknown> | unknown
            const inner =
                body &&
                typeof body === 'object' &&
                'data' in (body as Record<string, unknown>) &&
                (body as Record<string, unknown>).data !== undefined
                    ? (body as Record<string, unknown>).data
                    : body

            const { byShopId, totalShippingFee, raw } = normalizeCalculateResponse(inner)
            return { byShopId, totalShippingFee, cacheKey, raw }
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
                    : ''
            return rejectWithValue(msg || (e instanceof Error ? e.message : 'Failed to calculate shipping'))
        }
    },
    {
        condition: (arg, { getState }) => {
            const state = getState() as RootState
            if (!arg.cacheKey || arg.items.length === 0) return false
            if (state.shipping.calculateStatus === 'loading') return false
            if (
                state.shipping.calculateKey === arg.cacheKey &&
                state.shipping.calculateStatus === 'succeeded'
            ) {
                return false
            }
            return true
        },
    },
)