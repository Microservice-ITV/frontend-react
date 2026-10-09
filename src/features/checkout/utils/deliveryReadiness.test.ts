import { describe, expect, it } from 'vitest'
import {
    checkoutHasNoDeliveryRoute,
    DELIVERY_FOLLOW_UP_MESSAGE,
    deliveryUnavailableMessage,
    getDeliveryBlockReason,
    shopHasNoDeliveryRoute,
} from './deliveryReadiness'

const ready = {
    hasDeliveryAddress: true,
    calculateStatus: 'succeeded' as const,
    totalShippingFee: 2500,
}

describe('getDeliveryBlockReason', () => {
    it('returns null once the fee is settled, so Place Order stays enabled', () => {
        expect(getDeliveryBlockReason(ready)).toBeNull()
    })

    it('accepts a zero fee (free delivery) rather than treating 0 as missing', () => {
        expect(getDeliveryBlockReason({ ...ready, totalShippingFee: 0 })).toBeNull()
    })

    it('does NOT block while the fee is still being calculated', () => {
        // Regression guard: blocking here made the button flash disabled on mount
        // (idle -> loading -> succeeded) and janked the summary card's height.
        expect(
            getDeliveryBlockReason({
                hasDeliveryAddress: true,
                calculateStatus: 'loading',
                totalShippingFee: null,
            }),
        ).toBeNull()
    })

    it('blocks when the shipping service is down', () => {
        const reason = getDeliveryBlockReason({
            hasDeliveryAddress: true,
            calculateStatus: 'failed',
            totalShippingFee: null,
            calculateError: null,
        })
        expect(reason).toMatch(/unavailable/i)
    })

    it('surfaces the shipping service error message when it sent one', () => {
        expect(
            getDeliveryBlockReason({
                hasDeliveryAddress: true,
                calculateStatus: 'failed',
                totalShippingFee: null,
                calculateError: '  shipping-service unreachable  ',
            }),
        ).toBe('shipping-service unreachable')
    })

    it('falls back to a readable message when the error is only whitespace', () => {
        expect(
            getDeliveryBlockReason({
                hasDeliveryAddress: true,
                calculateStatus: 'failed',
                totalShippingFee: null,
                calculateError: '   ',
            }),
        ).toMatch(/unavailable/i)
    })

    it('blocks when the quote succeeded but carries no fee', () => {
        expect(getDeliveryBlockReason({ ...ready, totalShippingFee: null })).toMatch(/not ready/i)
    })

    it('does NOT block when no quote has been requested yet', () => {
        expect(
            getDeliveryBlockReason({
                hasDeliveryAddress: true,
                calculateStatus: 'idle',
                totalShippingFee: null,
            }),
        ).toBeNull()
    })

    it('is stable across the mount-time idle -> loading -> succeeded walk', () => {
        // The button's enabled state must not change while the quote resolves.
        const base = { hasDeliveryAddress: true, totalShippingFee: null }
        const walk = ['idle', 'loading', 'succeeded'] as const
        const results = walk.map((calculateStatus) =>
            getDeliveryBlockReason({ ...base, calculateStatus, totalShippingFee: 2500 }),
        )
        expect(results).toEqual([null, null, null])
    })

    it('does NOT block when a route is unavailable and the team will confirm delivery later', () => {
        expect(
            getDeliveryBlockReason({
                ...ready,
                deliveryStatuses: ['DELIVERABLE', 'NOT_DELIVERABLE'],
                unavailableReasons: ['ROUTE_NOT_AVAILABLE'],
            }),
        ).toBeNull()
    })

    it('still blocks when a shop profile is not ready to deliver', () => {
        expect(
            getDeliveryBlockReason({
                ...ready,
                deliveryStatuses: ['NOT_DELIVERABLE'],
                unavailableReasons: ['PROFILE_NOT_READY'],
            }),
        ).toBe('This shop cannot deliver yet.')

        expect(
            getDeliveryBlockReason({
                ...ready,
                deliveryStatuses: ['NOT_DELIVERABLE'],
                unavailableReasons: ['ROUTE_NOT_AVAILABLE'],
            }),
        ).toBeNull()
    })

    it('ignores a single NOT_DELIVERABLE among deliverable shops', () => {
        expect(
            getDeliveryBlockReason({
                ...ready,
                deliveryStatuses: ['DELIVERABLE', 'DELIVERABLE'],
            }),
        ).toBeNull()
    })

    it('does NOT block for a missing address — that click opens the address modal', () => {
        expect(
            getDeliveryBlockReason({
                hasDeliveryAddress: false,
                calculateStatus: 'failed',
                totalShippingFee: null,
                deliveryStatuses: ['NOT_DELIVERABLE'],
            }),
        ).toBeNull()
    })

    it('reports the service-down reason, not the generic not-ready one', () => {
        // A failed status also nulls totalShippingFee; the useful message is the one
        // naming the outage, not "wait for it to calculate" about a dead service.
        const reason = getDeliveryBlockReason({
            hasDeliveryAddress: true,
            calculateStatus: 'failed',
            totalShippingFee: null,
            calculateError: null,
        })
        expect(reason).not.toMatch(/not ready/i)
    })
})

describe('deliveryUnavailableMessage', () => {
    it('asks the customer to place the order when no district route exists', () => {
        expect(deliveryUnavailableMessage('ROUTE_NOT_AVAILABLE')).toBe(DELIVERY_FOLLOW_UP_MESSAGE)
    })
})

describe('shopHasNoDeliveryRoute', () => {
    it('is true when every company is blocked for the shop', () => {
        expect(shopHasNoDeliveryRoute(2, ['a', 'b'])).toBe(true)
    })

    it('is false while at least one company can serve the shop', () => {
        expect(shopHasNoDeliveryRoute(2, ['a'])).toBe(false)
    })
})

describe('checkoutHasNoDeliveryRoute', () => {
    it('is true only after routes are ready and every shop lacks a company route', () => {
        expect(
            checkoutHasNoDeliveryRoute({
                shopIds: ['shop-1'],
                companiesCount: 2,
                unavailableCompanyIdsByShop: { 'shop-1': ['a', 'b'] },
                loading: false,
                routesReady: true,
            }),
        ).toBe(true)
        expect(
            checkoutHasNoDeliveryRoute({
                shopIds: ['shop-1'],
                companiesCount: 2,
                unavailableCompanyIdsByShop: { 'shop-1': ['a', 'b'] },
                loading: false,
                routesReady: false,
            }),
        ).toBe(false)
    })
})