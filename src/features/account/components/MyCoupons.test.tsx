import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MyCoupons } from './MyCoupons'
import type { MyPromotionClaim } from '@/features/promotions/api/promotionClaimsApi'

const { mine, claim } = vi.hoisted(() => ({ mine: vi.fn(), claim: vi.fn() }))
vi.mock('@/features/promotions/api/promotionClaimsApi', () => ({
  promotionClaimsApi: { mine, claim },
}))

const coupon: MyPromotionClaim = {
  id: 'claim-1',
  promotion_id: 'promotion-1',
  promotion_name: 'Thank you reward',
  description: 'For your next purchase',
  rewards: [],
  order_id: 'order-1',
  qualifying_amount: '50000.00',
  claim_expires_at: null,
  claimed_at: null,
  code: null,
  code_expires_at: null,
  promotion_end_at: null,
  state: 'CLAIMABLE',
}
const renderCoupons = () =>
  render(
    <MemoryRouter>
      <MyCoupons />
    </MemoryRouter>
  )

describe('My Coupons', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mine.mockResolvedValue([coupon])
  })
  afterEach(cleanup)

  it('shows a claim opportunity and moves the assigned code into My coupons', async () => {
    claim.mockResolvedValue({
      id: coupon.id,
      promotion_id: coupon.promotion_id,
      code: 'THANKYOU5',
    })
    renderCoupons()
    const button = await screen.findByRole('button', { name: 'Claim coupon' })
    mine.mockResolvedValue([
      {
        ...coupon,
        claimed_at: new Date().toISOString(),
        code: 'THANKYOU5',
        state: 'AVAILABLE',
      },
    ])
    fireEvent.click(button)
    await screen.findByText('THANKYOU5')
    expect(claim).toHaveBeenCalledWith(coupon.id)
    expect(claim).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'My coupons' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(
      screen.getByRole('link', { name: 'View qualifying order' })
    ).toHaveAttribute('href', '/account/orders/order-1')
  })

  it('prevents duplicate clicks while a claim request is pending', async () => {
    let finish: (result: unknown) => void
    claim.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    renderCoupons()
    const button = await screen.findByRole('button', { name: 'Claim coupon' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(claim).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Claiming…' })).toBeDisabled()
    mine.mockResolvedValue([])
    finish!({ id: coupon.id, code: 'CODE5' })
    await waitFor(() =>
      expect(screen.queryByText('Claiming…')).not.toBeInTheDocument()
    )
  })

  it('shows stock exhaustion without offering a claim action', async () => {
    mine.mockResolvedValue([{ ...coupon, state: 'UNAVAILABLE' }])
    renderCoupons()
    await screen.findByText(
      'All codes are currently assigned. Check again later.'
    )
    expect(
      screen.queryByRole('button', { name: 'Claim coupon' })
    ).not.toBeInTheDocument()
  })

  it('shows claim failures and allows retry without exposing a code', async () => {
    claim.mockRejectedValue({
      response: { data: { message: 'This promotion is no longer claimable' } },
    })
    renderCoupons()
    fireEvent.click(await screen.findByRole('button', { name: 'Claim coupon' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'no longer claimable'
    )
    expect(screen.getByRole('button', { name: 'Claim coupon' })).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: 'Copy' })
    ).not.toBeInTheDocument()
  })

  it('keeps used and expired coupons in history', async () => {
    mine.mockResolvedValue([
      {
        ...coupon,
        claimed_at: new Date().toISOString(),
        code: 'OLD-CODE',
        state: 'USED',
      },
    ])
    renderCoupons()
    await waitFor(() =>
      expect(screen.queryByText('Loading coupons…')).not.toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: 'history' }))
    expect(screen.getByText('OLD-CODE')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Claim coupon' })
    ).not.toBeInTheDocument()
  })
})
