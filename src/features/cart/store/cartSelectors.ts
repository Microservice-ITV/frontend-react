import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import type { CartItem } from '@/features/cart/types/cartTypes'
import { cartLineKey } from './cartLine'

/* ================================
   BASE SELECTOR
================================ */
export const selectCartItems = (state: RootState) => state.cart.items ?? []

/* ================================
   SIMPLE DERIVED SELECTORS
================================ */
export const selectCartCount = createSelector(
    selectCartItems,
    items => items.reduce((sum, i) => sum + i.quantity, 0)
)

export const selectCartTotal = createSelector(
    selectCartItems,
    items => items.filter(i => i.selected).reduce((sum, i) => sum + i.price * i.quantity, 0)
)

export const selectIsCartEmpty = createSelector(
    selectCartItems,
    items => items.length === 0
)

/* ================================
   SELECTION (CHECKBOX LOGIC)
================================ */
// all selected items
export const selectSelectedItems = createSelector(
    selectCartItems,
    items => items.filter(i => i.selected)
)
// global "Select All" checkbox
export const selectIsAllSelected = createSelector(
    selectCartItems,
    items => items.length > 0 && items.every(i => i.selected)
)

export const selectIsIndeterminate = createSelector(
    selectCartItems,
    items => {
        const selectedCount = items.filter(i => i.selected).length
        return selectedCount > 0 && selectedCount < items.length
    }
)

/* ================================
   SHOP GROUPING
================================ */
// group items by shop
export const selectCartGroupedByShop = createSelector(
    selectCartItems,
    items => {
        const grouped: Record<
            string,
            { shopName: string; items: CartItem[] }
        > = {}

        for (const item of items) {
            if (!grouped[item.shopId]) {
                grouped[item.shopId] = {
                    shopName: item.shopName,
                    items: []
                }
            }
            grouped[item.shopId].items.push(item)
        }

        return grouped
    }
)

// shop checkbox checked / indeterminate state
export const selectShopSelectionMap = createSelector(
    selectCartItems,
    items => {
        const map: Record<
            string,
            { checked: boolean; indeterminate: boolean }
        > = {}

        const shopGroups: Record<string, CartItem[]> = {}

        for (const item of items) {
            shopGroups[item.shopId] ??= []
            shopGroups[item.shopId].push(item)
        }

        for (const shopId in shopGroups) {
            const shopItems = shopGroups[shopId]
            const selectedCount = shopItems.filter(i => i.selected).length

            map[shopId] = {
                checked:
                    selectedCount > 0 &&
                    selectedCount === shopItems.length,
                indeterminate:
                    selectedCount > 0 &&
                    selectedCount < shopItems.length
            }
        }

        return map
    }
)

/**
 * Useful for O(1) lookup in UI
 * Example: disable "Add to cart" if already added
 */
export const selectCartItemMap = createSelector(
    selectCartItems,
    items =>
        Object.fromEntries(
            items.map(i => [cartLineKey(i), i])
        )
)