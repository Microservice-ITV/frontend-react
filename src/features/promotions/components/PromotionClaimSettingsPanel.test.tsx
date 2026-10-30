import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PromotionClaimSettingsPanel } from './PromotionClaimSettingsPanel'

const { settings, saveSettings } = vi.hoisted(() => ({
  settings: vi.fn(),
  saveSettings: vi.fn(),
}))
vi.mock('../api/promotionClaimsApi', () => ({
  promotionClaimsApi: { settings, saveSettings },
}))

describe('promotion claim settings', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    settings.mockResolvedValue({
      promotion_id: 'promotion-1',
      enabled: false,
      minimum_order_amount: '0.00',
      claim_deadline_days: null,
    })
    saveSettings.mockResolvedValue({})
  })
  afterEach(cleanup)

  it('saves claim controls against the selected promotion', async () => {
    render(
      <PromotionClaimSettingsPanel
        promotionId="promotion-1"
        promotionName="Next order coupon"
      />
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save claim settings' })
      ).toBeEnabled()
    )
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Enable claiming after receipt' })
    )
    fireEvent.change(
      screen.getByRole('spinbutton', { name: /Minimum received-order amount/ }),
      { target: { value: '50000' } }
    )
    fireEvent.change(screen.getByRole('spinbutton', { name: /Claim within/ }), {
      target: { value: '7' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save claim settings' }))
    await screen.findByText('Claim settings saved.')
    expect(saveSettings).toHaveBeenCalledWith('promotion-1', {
      enabled: true,
      minimum_order_amount: 50000,
      claim_deadline_days: 7,
    })
  })

  it('prevents saving defaults after a failed settings fetch', async () => {
    settings.mockRejectedValue(new Error('offline'))
    render(
      <PromotionClaimSettingsPanel
        promotionId="promotion-1"
        promotionName="Next order coupon"
      />
    )
    await screen.findByRole('alert')
    expect(
      screen.getByRole('button', { name: 'Save claim settings' })
    ).toBeDisabled()
    expect(saveSettings).not.toHaveBeenCalled()
    settings.mockResolvedValue({
      promotion_id: 'promotion-1',
      enabled: true,
      minimum_order_amount: '1000.00',
      claim_deadline_days: 3,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked())
  })
})
