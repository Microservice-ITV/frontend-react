import { describe, expect, it } from 'vitest'
import { isShopStaffUser } from './staffCheckoutCustomer'

describe('isShopStaffUser', () => {
  it('is true when the user is assigned to a shop', () => {
    expect(isShopStaffUser({
      id: '1',
      name: 'Staff',
      email: 'staff@example.com',
      staff_shop_ids: ['shop-1'],
    })).toBe(true)
  })

  it('is true for an explicit staff role', () => {
    expect(isShopStaffUser({
      id: '1',
      name: 'Staff',
      email: 'staff@example.com',
      role: 'SHOP_STAFF',
    })).toBe(true)
  })

  it('is false for a normal customer', () => {
    expect(isShopStaffUser({
      id: '1',
      name: 'Customer',
      email: 'customer@example.com',
      role: 'USER',
      staff_shop_ids: [],
    })).toBe(false)
  })
})
