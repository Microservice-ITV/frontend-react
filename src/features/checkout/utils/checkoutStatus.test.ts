import { describe, expect, it } from 'vitest'
import { hasConfirmedStock, isStockReadinessConfirmed } from './checkoutStatus'

const READINESS_KEY = 'chk_123|P1:V1:2'

describe('hasConfirmedStock', () => {
  it('is false for a missing status', () => {
    expect(hasConfirmedStock(null)).toBe(false)
    expect(hasConfirmedStock(undefined)).toBe(false)
  })

  it('is false while stock is still being reserved', () => {
    expect(hasConfirmedStock('PROCESSING')).toBe(false)
    expect(hasConfirmedStock('PENDING_STOCK')).toBe(false)
  })

  it('is true once stock is confirmed and every later stage', () => {
    expect(hasConfirmedStock('STOCK_CONFIRMED')).toBe(true)
    expect(hasConfirmedStock('PAYMENT_INTENT_READY')).toBe(true)
    expect(hasConfirmedStock('PAID')).toBe(true)
  })
})

describe('isStockReadinessConfirmed', () => {
  it('does not treat "no checkout session yet" as confirmed', () => {
    // Regression: the original gate compared two null keys, so `null === null` made
    // the summary render before stock was ever confirmed.
    expect(
      isStockReadinessConfirmed({
        paymentStatus: null,
        confirmedReadinessKey: null,
      }),
    ).toBe(false)
  })

  it('stays false while a restored session has not reported stock yet', () => {
    expect(
      isStockReadinessConfirmed({
        paymentStatus: 'PENDING_STOCK',
        confirmedReadinessKey: null,
      }),
    ).toBe(false)
  })

  it('is true from the live status alone, with no latch', () => {
    expect(
      isStockReadinessConfirmed({
        paymentStatus: 'STOCK_CONFIRMED',
        confirmedReadinessKey: null,
      }),
    ).toBe(true)
  })

  it('honours the latch so polling cannot collapse the summary', () => {
    // The 800ms status poll can briefly report an earlier stage. Once confirmed, the
    // latch keeps the summary mounted.
    expect(
      isStockReadinessConfirmed({
        paymentStatus: 'PENDING_STOCK',
        confirmedReadinessKey: READINESS_KEY,
      }),
    ).toBe(true)
  })

  it('keeps the summary mounted when a replacement session resets paymentStatus', () => {
    // Regression: `checkoutCart.fulfilled` sets a new checkout_id AND resets
    // paymentStatus to null in one reducer. Keying the latch on the session made both
    // checks fail at once, and because the latch is written from an effect (after
    // render) the skeleton was visible for a frame: summary -> skeleton -> summary.
    const afterReplacementSession = isStockReadinessConfirmed({
      paymentStatus: null,
      confirmedReadinessKey: READINESS_KEY,
    })
    expect(afterReplacementSession).toBe(true)
  })

  it('does not flicker while the replacement session reports stock again', () => {
    type GateInput = Parameters<typeof isStockReadinessConfirmed>[0]
    const frames: GateInput[] = [
      { paymentStatus: 'PENDING_PAYMENT', confirmedReadinessKey: null },
      { paymentStatus: null, confirmedReadinessKey: READINESS_KEY },
      { paymentStatus: 'PENDING_PAYMENT', confirmedReadinessKey: READINESS_KEY },
    ]
    expect(frames.map((f) => isStockReadinessConfirmed(f))).toEqual([true, true, true])
  })

  it('still refuses the summary for a confirmed-stock failure on a fresh mount', () => {
    expect(
      isStockReadinessConfirmed({
        paymentStatus: 'FAILED_STOCK',
        confirmedReadinessKey: null,
      }),
    ).toBe(false)
  })
})