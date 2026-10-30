import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PromotionEnginePage from './PromotionEnginePage'

const { listPromotions, settings, saveSettings, listSettings, removeSettings } =
  vi.hoisted(() => ({
    listPromotions: vi.fn(),
    settings: vi.fn(),
    saveSettings: vi.fn(),
    listSettings: vi.fn(),
    removeSettings: vi.fn(),
  }))
vi.mock('@/app/hooks', () => ({ useAppSelector: () => ({ id: 'admin' }) }))
vi.mock('@/app/rbac/hooks', () => ({ useAuthRole: () => 'SUPER_ADMIN' }))
vi.mock('@/features/flash-deals/pages/AdminFlashDealsPage', () => ({
  default: () => null,
}))
vi.mock('../api/promotionApi', () => ({
  promotionApi: {
    listPromotions,
    list: vi.fn(async () => []),
    resolveTargetNames: vi.fn(async () => new Map()),
  },
}))
vi.mock('../api/promotionClaimsApi', () => ({
  promotionClaimsApi: { settings, saveSettings, listSettings, removeSettings },
}))

const promotion = (id: string, name: string) => ({
  id,
  name,
  owner_type: 'PLATFORM',
  shop_id: null,
  scope: 'ORDER',
  description: null,
  promotion_type: 'PERCENTAGE',
  priority: 0,
  stackable: false,
  status: 'ACTIVE',
  start_at: '2026-01-01T00:00:00Z',
  end_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
})

describe('claim settings in promotion building blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listPromotions.mockResolvedValue([
      promotion('first', 'First promotion'),
      promotion('second', 'Second promotion'),
    ])
    settings.mockImplementation(async (id: string) => ({
      promotion_id: id,
      enabled: id === 'first',
      minimum_order_amount: id === 'first' ? '50000.00' : '10000.00',
      claim_deadline_days: null,
    }))
    listSettings.mockResolvedValue([
      {
        promotion_id: 'first',
        enabled: true,
        minimum_order_amount: '50000.00',
        claim_deadline_days: 7,
      },
      {
        promotion_id: 'second',
        enabled: false,
        minimum_order_amount: '10000.00',
        claim_deadline_days: null,
      },
    ])
    removeSettings.mockResolvedValue(undefined)
    saveSettings.mockImplementation(async (promotion_id, values) => ({
      promotion_id,
      ...values,
      minimum_order_amount: String(values.minimum_order_amount),
    }))
  })
  afterEach(cleanup)

  const openClaimSettings = async () => {
    render(
      <MemoryRouter>
        <PromotionEnginePage />
      </MemoryRouter>,
    )
    const section = screen
      .getByRole('heading', { name: 'Promotion building blocks' })
      .closest('section')!
    fireEvent.click(
      within(section).getByRole('button', { name: 'Claim Settings' }),
    )
    await waitFor(() =>
      expect(
        within(section).queryByText('Loading claim settings…'),
      ).not.toBeInTheDocument(),
    )
    return section
  }

  it('lists all saved settings, including disabled promotions, without a selector', async () => {
    const section = await openClaimSettings()
    expect(within(section).getByText('First promotion')).toBeInTheDocument()
    expect(within(section).getByText('Second promotion')).toBeInTheDocument()
    expect(
      within(section).getByText(
        /Enabled · Minimum received-order amount: 50,000/,
      ),
    ).toBeInTheDocument()
    expect(
      within(section).getByText(
        /Disabled · Minimum received-order amount: 10,000/,
      ),
    ).toBeInTheDocument()
    expect(within(section).getByText(/Claim within 7 days/)).toBeInTheDocument()
    expect(
      within(section).getByText(/No additional claim deadline/),
    ).toBeInTheDocument()
    expect(within(section).queryByRole('combobox')).not.toBeInTheDocument()
    expect(
      within(section).getAllByRole('button', {
        name: 'Edit claim settings item',
      }),
    ).toHaveLength(2)
  })

  it('edits a row in a matching dialog and updates the list after saving', async () => {
    const section = await openClaimSettings()
    fireEvent.click(
      within(section).getAllByRole('button', {
        name: 'Edit claim settings item',
      })[1],
    )
    const dialog = screen.getByRole('dialog', { name: 'Edit claim settings' })
    expect(
      within(dialog).getByRole('combobox', { name: 'Promotion name' }),
    ).toBeDisabled()
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Save claim settings' }),
      ).toBeEnabled(),
    )
    fireEvent.change(
      within(dialog).getByRole('spinbutton', {
        name: /Minimum received-order amount/,
      }),
      { target: { value: '25000' } },
    )
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save claim settings' }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(saveSettings).toHaveBeenCalledWith('second', {
      enabled: false,
      minimum_order_amount: 25000,
      claim_deadline_days: null,
    })
    expect(
      within(section).getByText(
        /Disabled · Minimum received-order amount: 25,000/,
      ),
    ).toBeInTheDocument()
  })

  it('adds settings by promotion name and removes a setting from the list', async () => {
    listSettings.mockResolvedValue([
      {
        promotion_id: 'first',
        enabled: true,
        minimum_order_amount: '50000.00',
        claim_deadline_days: 7,
      },
    ])
    const section = await openClaimSettings()
    fireEvent.click(
      within(section).getByRole('button', { name: 'Add claim settings' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Add claim settings' })
    const selector = within(dialog).getByRole('combobox', {
      name: 'Promotion name',
    })
    expect(
      within(selector).queryByRole('option', { name: 'First promotion' }),
    ).not.toBeInTheDocument()
    fireEvent.change(selector, { target: { value: 'second' } })
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Save claim settings' }),
      ).toBeEnabled(),
    )
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save claim settings' }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(within(section).getByText('Second promotion')).toBeInTheDocument()
    fireEvent.click(
      within(section).getAllByRole('button', {
        name: 'Delete claim settings item',
      })[0],
    )
    await waitFor(() =>
      expect(
        within(section).queryByText('Second promotion'),
      ).not.toBeInTheDocument(),
    )
    expect(removeSettings).toHaveBeenCalledWith('second')
  })
})
