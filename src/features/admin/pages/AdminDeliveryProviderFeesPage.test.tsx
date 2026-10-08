// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GlobalModalProvider } from '@/components/ui/GlobalModalProvider'
import AdminDeliveryProviderFeesPage from './AdminDeliveryProviderFeesPage'
import {
  adminDeliveryProviderFeeApi,
  type DeliveryProviderFeeRule,
} from '../api/adminDeliveryProviderFeeApi'

const providerAId = randomUUID()
const providerBId = randomUUID()

const feeRules: DeliveryProviderFeeRule[] = [
  {
    id: 'provider-a-rule',
    providerId: providerAId,
    chargingBasis: 'PER_ORDER',
    amount: '300.00',
    currency: 'MMK',
    active: true,
    effectiveFrom: '2026-10-10T00:00:00.000Z',
    effectiveTo: null,
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'provider-b-rule',
    providerId: providerBId,
    chargingBasis: 'PER_DAY',
    amount: '300.00',
    currency: 'MMK',
    active: false,
    effectiveFrom: '2026-10-10T00:00:00.000Z',
    effectiveTo: null,
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
]

const providers = [
  { id: providerAId, code: 'CARRIER_A', name: 'Carrier A', active: true },
  { id: providerBId, code: 'CARRIER_B', name: 'Carrier B', active: true },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <GlobalModalProvider>
        <AdminDeliveryProviderFeesPage />
      </GlobalModalProvider>
    </MemoryRouter>,
  )
}

async function openCreateForm() {
  await userEvent.click((await screen.findAllByRole('button', { name: 'Create fee rule' }))[0])
  return screen.findByRole('dialog', { name: 'Create delivery provider fee rule' })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(adminDeliveryProviderFeeApi, 'listFeeRules')
  vi.mocked(adminDeliveryProviderFeeApi.listFeeRules).mockResolvedValue(feeRules)
  vi.spyOn(adminDeliveryProviderFeeApi, 'listDeliveryProviders')
  vi.mocked(adminDeliveryProviderFeeApi.listDeliveryProviders).mockResolvedValue(providers)
  vi.spyOn(adminDeliveryProviderFeeApi, 'createFeeRule')
  vi.mocked(adminDeliveryProviderFeeApi.createFeeRule).mockResolvedValue(feeRules[0])
  vi.spyOn(adminDeliveryProviderFeeApi, 'updateFeeRule')
  vi.mocked(adminDeliveryProviderFeeApi.updateFeeRule).mockResolvedValue(feeRules[0])
  vi.spyOn(adminDeliveryProviderFeeApi, 'setFeeRuleActive')
  vi.mocked(adminDeliveryProviderFeeApi.setFeeRuleActive).mockResolvedValue(feeRules[0])
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('AdminDeliveryProviderFeesPage', () => {
  it('renders fee rules with provider names, charging-basis labels, and status', async () => {
    renderPage()

    const providerARow = await screen.findByRole('row', { name: /CARRIER_A/ })
    const providerBRow = screen.getByRole('row', { name: /CARRIER_B/ })
    expect(within(providerARow).getByText('Carrier A')).toBeInTheDocument()
    expect(within(providerARow).getByText('Per Order')).toBeInTheDocument()
    expect(within(providerARow).getByText('Active')).toBeInTheDocument()
    expect(within(providerBRow).getByText('Per Day')).toBeInTheDocument()
    expect(within(providerBRow).getByText('Inactive')).toBeInTheDocument()
  })

  it('loads Delivery Service providers and sends the selected stable provider ID', async () => {
    const user = userEvent.setup()
    renderPage()
    const dialog = await openCreateForm()

    const providerSelect = within(dialog).getByLabelText('Delivery Provider')
    expect(within(providerSelect).getByRole('option', { name: 'Carrier A (CARRIER_A)' })).toHaveValue(providerAId)
    await user.selectOptions(providerSelect, providerAId)
    await user.selectOptions(within(dialog).getByLabelText('Charging Basis'), 'PER_ORDER')
    await user.type(within(dialog).getByLabelText('Fee Amount'), '300')
    await user.click(within(dialog).getByRole('button', { name: 'Create fee rule' }))

    await waitFor(() => expect(adminDeliveryProviderFeeApi.createFeeRule).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: providerAId,
        chargingBasis: 'PER_ORDER',
        amount: '300',
        currency: 'MMK',
      }),
    ))
    expect(adminDeliveryProviderFeeApi.createFeeRule).not.toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 'Carrier A' }),
    )
  })

  it.each([
    ['PER_ORDER', providerAId],
    ['PER_DAY', providerBId],
  ] as const)('creates a %s fee rule for a dynamically loaded provider', async (basis, providerId) => {
    const user = userEvent.setup()
    renderPage()
    const dialog = await openCreateForm()
    await user.selectOptions(within(dialog).getByLabelText('Delivery Provider'), providerId)
    await user.selectOptions(within(dialog).getByLabelText('Charging Basis'), basis)
    await user.type(within(dialog).getByLabelText('Fee Amount'), '300')
    await user.click(within(dialog).getByRole('button', { name: 'Create fee rule' }))

    await waitFor(() => expect(adminDeliveryProviderFeeApi.createFeeRule).toHaveBeenCalledWith(
      expect.objectContaining({ providerId, chargingBasis: basis }),
    ))
  })

  it('blocks invalid fee amounts before sending a request', async () => {
    const user = userEvent.setup()
    renderPage()
    const dialog = await openCreateForm()

    await user.selectOptions(within(dialog).getByLabelText('Delivery Provider'), providerAId)
    await user.type(within(dialog).getByLabelText('Fee Amount'), '0')
    await user.click(within(dialog).getByRole('button', { name: 'Create fee rule' }))

    expect(await within(dialog).findByText('Fee Amount must be greater than 0 and have no more than 2 decimal places.')).toBeInTheDocument()
    expect(adminDeliveryProviderFeeApi.createFeeRule).not.toHaveBeenCalled()
  })

  it('edits a fee rule while retaining its selected provider ID', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click((await screen.findAllByRole('button', { name: 'Edit' }))[0])
    const dialog = await screen.findByRole('dialog', { name: 'Edit delivery provider fee rule' })

    expect(within(dialog).getByLabelText('Delivery Provider')).toHaveValue(providerAId)
    fireEvent.change(within(dialog).getByLabelText('Fee Amount'), { target: { value: '450' } })
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(adminDeliveryProviderFeeApi.updateFeeRule).toHaveBeenCalledWith(
      'provider-a-rule',
      expect.objectContaining({ providerId: providerAId, amount: '450' }),
    ))
  })

  it('activates and deactivates a rule through the status API after confirmation', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click((await screen.findAllByRole('button', { name: 'Deactivate' }))[0])
    await waitFor(() => expect(adminDeliveryProviderFeeApi.setFeeRuleActive).toHaveBeenCalledWith('provider-a-rule', false))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Deactivate this delivery provider fee rule'))

    await user.click((await screen.findAllByRole('button', { name: 'Activate' }))[0])
    await waitFor(() => expect(adminDeliveryProviderFeeApi.setFeeRuleActive).toHaveBeenCalledWith('provider-b-rule', true))
  })

  it('shows backend validation errors in the form modal', async () => {
    const user = userEvent.setup()
    vi.mocked(adminDeliveryProviderFeeApi.createFeeRule).mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed with status code 400',
      response: { data: { error: 'Fee period overlaps another rule' } },
    })
    renderPage()
    const dialog = await openCreateForm()

    await user.selectOptions(within(dialog).getByLabelText('Delivery Provider'), providerAId)
    await user.type(within(dialog).getByLabelText('Fee Amount'), '300')
    await user.click(within(dialog).getByRole('button', { name: 'Create fee rule' }))

    expect(await within(dialog).findByText('Fee period overlaps another rule')).toBeInTheDocument()
  })

  it('shows an unresolved provider ID without breaking the list', async () => {
    vi.mocked(adminDeliveryProviderFeeApi.listFeeRules).mockResolvedValue([
      { ...feeRules[0], providerId: 'unknown-provider-id' },
    ])
    renderPage()

    expect(await screen.findByText('Unknown Provider')).toBeInTheDocument()
    expect(screen.getByText('unknown-provider-id')).toBeInTheDocument()
  })
})
