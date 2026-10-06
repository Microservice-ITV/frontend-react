import { describe, expect, it } from 'vitest'
import { getDeliveryBlockReason } from './deliveryReadiness'

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

    it('blocks when any shop reports NOT_DELIVERABLE', () => {
        expect(
            getDeliveryBlockReason({
                ...ready,
                deliveryStatuses: ['DELIVERABLE', 'NOT_DELIVERABLE'],
            }),
        ).toMatch(/cannot deliver/i)
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