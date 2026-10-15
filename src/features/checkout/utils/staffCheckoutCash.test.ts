import { describe, expect, it } from 'vitest'
import { canUseStaffCheckoutCash } from './staffCheckoutCash'

describe('canUseStaffCheckoutCash', () => {
  it('allows cash when staff buys only from their own shop', () => {
    expect(
      canUseStaffCheckoutCash({
        staffShopIds: ['shop-a'],
        cartShopIds: ['shop-a'],
      }),
    ).toBe(true)
  })

  it('allows cash when staff buys from multiple of their own shops', () => {
    expect(
      canUseStaffCheckoutCash({
        staffShopIds: ['shop-a', 'shop-b'],
        cartShopIds: ['shop-a', 'shop-b'],
      }),
    ).toBe(true)
  })

  it('hides cash when cart includes another shop', () => {
    expect(
      canUseStaffCheckoutCash({
        staffShopIds: ['shop-a'],
        cartShopIds: ['shop-a', 'shop-other'],
      }),
    ).toBe(false)
  })

  it('hides cash for non-staff customers', () => {
    expect(
      canUseStaffCheckoutCash({
        staffShopIds: [],
        cartShopIds: ['shop-a'],
      }),
    ).toBe(false)
  })

  it('hides cash when cart is empty', () => {
    expect(
      canUseStaffCheckoutCash({
        staffShopIds: ['shop-a'],
        cartShopIds: [],
      }),
    ).toBe(false)
  })
})
