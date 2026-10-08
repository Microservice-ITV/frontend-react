// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminDeliveryProvidersPage from './AdminDeliveryProvidersPage'
import { adminDeliveryProviderApi, type DeliveryProvider } from '../api/adminDeliveryProviderApi'

const providerId = crypto.randomUUID()
const provider: DeliveryProvider = {
  id: providerId,
  code: 'CARRIER_A',
  name: 'Carrier A',
  active: true,
}
const createdProvider: DeliveryProvider = {
  id: crypto.randomUUID(),
  code: 'CARRIER_NEW',
  name: 'New Carrier',
  active: true,
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminDeliveryProvidersPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(adminDeliveryProviderApi, 'list').mockResolvedValue([provider])
  vi.spyOn(adminDeliveryProviderApi, 'create').mockResolvedValue(createdProvider)
  vi.spyOn(adminDeliveryProviderApi, 'update').mockResolvedValue({ ...provider, name: 'Updated Carrier' })
})

describe('AdminDeliveryProvidersPage', () => {
  it('lists providers with their Delivery Service-generated IDs', async () => {
    renderPage()

    expect(await screen.findByText('Carrier A')).toBeInTheDocument()
    expect(screen.getByText(providerId)).toBeInTheDocument()
    expect(adminDeliveryProviderApi.list).toHaveBeenCalledOnce()
  })

  it('creates a provider through Delivery Service', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'New provider' }))
    const form = screen.getByRole('region', { name: 'Create delivery provider' })

    await user.type(within(form).getByLabelText('Code'), 'carrier_new')
    await user.type(within(form).getByLabelText('Name'), 'New Carrier')
    await user.click(within(form).getByRole('button', { name: 'Create provider' }))

    await waitFor(() => expect(adminDeliveryProviderApi.create).toHaveBeenCalledWith({
      code: 'CARRIER_NEW',
      name: 'New Carrier',
      active: true,
    }))
    expect(await screen.findByText(createdProvider.id)).toBeInTheDocument()
  })

  it('updates provider fields using the canonical provider ID', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Edit Carrier A' }))
    const form = screen.getByRole('region', { name: 'Edit delivery provider' })
    fireEvent.change(within(form).getByLabelText('Name'), { target: { value: 'Updated Carrier' } })
    await user.click(within(form).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(adminDeliveryProviderApi.update).toHaveBeenCalledWith(providerId, {
      code: 'CARRIER_A',
      name: 'Updated Carrier',
      active: true,
    }))
  })

  it('shows provider service load errors', async () => {
    vi.mocked(adminDeliveryProviderApi.list).mockRejectedValue(new Error('Provider service unavailable'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Provider service unavailable')
  })
})
