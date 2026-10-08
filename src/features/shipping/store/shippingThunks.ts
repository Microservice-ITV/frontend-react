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
import type { ShopCalculatedShipping } from '../types/shippingTypes'

function cartShopIdsKey(items: { shopId: string }[]): string {
    return [...new Set(items.map((i) => i.shopId).filter(Boolean))].sort().join(',')
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const data = (error as {
            response?: {
                data?: {
                    message?: unknown
                    error?: unknown
                }
            }
        }).response?.data

        const nested = data?.error
        if (typeof nested === 'string' && nested.trim()) return nested.trim()
        if (nested && typeof nested === 'object' && 'message' in nested) {
            const msg = (nested as { message?: unknown }).message
            if (typeof msg === 'string' && msg.trim()) return msg.trim()
        }
        if (typeof data?.message === 'string' && data.message.trim()) {
            return data.message.trim()
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message.trim()
    }

    return fallback
}

function humanizeShippingCalculateError(message: string): string {
    const missingProfiles = message.match(
        /Shop shipping profiles not found:\s*(.+)$/i,
    )
    if (missingProfiles?.[1]) {
        return (
            `Delivery fee is unavailable because this shop has no shipping profile yet ` +
            `(${missingProfiles[1].trim()}). Clear the cart and add products from a shop ` +
            `that is registered for shipping, or ask an admin to sync the shop profile.`
        )
    }

    if (/Request failed with status code 404/i.test(message)) {
        return (
            'Delivery fee is unavailable (shop shipping profile not found). ' +
            'Clear the cart and try products from another shop.'
        )
    }

    return message
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
            return rejectWithValue(
                extractApiErrorMessage(e, 'Failed to load shipping profiles'),
            )
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
                const staleDistrict = key.split(',').filter(Boolean).some((shopId) => {
                    const profile = state.shipping.profilesByShopId[shopId]
                    return profile != null && !('districtId' in profile)
                })
                if (!staleDistrict) return false
            }
            return true
        },
    },
)

export type FetchCalculateArgs = {
    address: UserAddress
    items: CartItem[]
    /** Delivery company chosen for each shop. */
    companyByShopId: Record<string, string>
    /** Dedupe key: per-shop companies + address id + cart fingerprint */
    cacheKey: string
    customer?: CalculateShippingCustomer
}

export const fetchCheckoutShippingCalculation = createAsyncThunk<
    {
        byShopId: Record<string, ShopCalculatedShipping>
        totalShippingFee: number | null
        cacheKey: string
        raw: unknown
    },
    FetchCalculateArgs,
    { rejectValue: string }
>(
    'shipping/calculate',
    async ({ address, items, cacheKey, customer, companyByShopId }, { rejectWithValue }) => {
        try {
            if (items.length === 0) {
                return { byShopId: {}, totalShippingFee: null, cacheKey, raw: null as unknown }
            }

            const itemsByCompany = new Map<string, CartItem[]>()
            for (const item of items) {
                const companyId = companyByShopId[item.shopId]?.trim()
                if (!companyId) continue
                const group = itemsByCompany.get(companyId) ?? []
                group.push(item)
                itemsByCompany.set(companyId, group)
            }

            if (itemsByCompany.size === 0) {
                return { byShopId: {}, totalShippingFee: null, cacheKey, raw: null as unknown }
            }

            const coords = await resolveDeliveryCoordinates(address)
            if (!coords) {
                return rejectWithValue(
                    'We could not locate this delivery address on the map. Add a map pin to your address and try again.',
                )
            }

            const responses = await Promise.all(
                [...itemsByCompany.entries()].map(async ([deliveryCompanyId, shopItems]) => {
                    const payload = buildCalculatePayload(
                        address,
                        shopItems,
                        coords,
                        customer,
                        deliveryCompanyId,
                    )
                    const res = await shippingApi.calculateShipping(payload)
                    const body = res.data as Record<string, unknown> | unknown
                    const inner =
                        body &&
                        typeof body === 'object' &&
                        'data' in (body as Record<string, unknown>) &&
                        (body as Record<string, unknown>).data !== undefined
                            ? (body as Record<string, unknown>).data
                            : body
                    return normalizeCalculateResponse(inner)
                }),
            )

            const byShopId: Record<string, ShopCalculatedShipping> = {}
            let totalShippingFee = 0
            let hasFee = false
            for (const response of responses) {
                Object.assign(byShopId, response.byShopId)
                if (response.totalShippingFee != null) {
                    totalShippingFee += response.totalShippingFee
                    hasFee = true
                }
            }

            return {
                byShopId,
                totalShippingFee: hasFee ? totalShippingFee : null,
                cacheKey,
                raw: responses.map((response) => response.raw),
            }
        } catch (e: unknown) {
            const rawMessage = extractApiErrorMessage(e, 'Failed to calculate shipping')
            return rejectWithValue(humanizeShippingCalculateError(rawMessage))
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
