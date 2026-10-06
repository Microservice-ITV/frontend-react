import { describe, expect, it } from 'vitest'
import { formatDocumentTitle, resolvePageTitle } from './pageTitle'

describe('formatDocumentTitle', () => {
  it('appends the site name', () => {
    expect(formatDocumentTitle('Cart')).toBe('Cart - Daily Need Items')
  })

  it('uses only the site name on the home title', () => {
    expect(formatDocumentTitle('Daily Need Items')).toBe('Daily Need Items')
    expect(formatDocumentTitle('')).toBe('Daily Need Items')
  })
})

describe('resolvePageTitle', () => {
  it('names storefront pages', () => {
    expect(resolvePageTitle('/')).toBe('Daily Need Items')
    expect(resolvePageTitle('/cart')).toBe('Cart')
    expect(resolvePageTitle('/all_categories')).toBe('Categories')
    expect(resolvePageTitle('/wishlist')).toBe('Wishlist')
  })

  it('prefers a static path over a param path', () => {
    expect(resolvePageTitle('/seller/products/new')).toBe('New Product')
    expect(resolvePageTitle('/seller/products/abc')).toBe('Product')
    expect(resolvePageTitle('/super-admin/shipping/pricing-rules/new')).toBe('New Pricing Rule')
    expect(resolvePageTitle('/seller/promotion-engine/bundles')).toBe('Bundles')
    expect(resolvePageTitle('/seller/promotion-engine/bundles/new')).toBe('New Bundle')
    expect(resolvePageTitle('/seller/promotion-engine/bundles/abc/edit')).toBe('Edit Bundle')
    expect(resolvePageTitle('/super-admin/promotion-engine/bundles/new')).toBe('New Bundle')
    expect(resolvePageTitle('/super-admin/accounting/overview')).toBe('Accounting Overview')
  })

  it('includes the search query', () => {
    expect(resolvePageTitle('/search', '?q=rice')).toBe('Search: rice')
    expect(resolvePageTitle('/search')).toBe('Search')
  })

  it('falls back when the path is unknown', () => {
    expect(resolvePageTitle('/does-not-exist')).toBe('Page Not Found')
  })
})
