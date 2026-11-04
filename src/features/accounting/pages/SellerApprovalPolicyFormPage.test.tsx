import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SellerApprovalPolicyFormPage from './SellerApprovalPolicyFormPage'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import { authClient } from '@/lib/api/authClient'
import { store } from '@/app/store'
import { fetchMe } from '@/features/auth/store/authThunks'

describe('SellerApprovalPolicyFormPage shop context', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.restoreAllMocks()
    store.dispatch(fetchMe.fulfilled({
      id: 'owner-1',
      name: 'Owner',
      email: 'owner@example.com',
      active_shop_id: 'shop-a',
    }, '', undefined))
    vi.spyOn(accountingExpensesAdapter, 'createApprovalPolicy').mockResolvedValue({} as never)
    vi.spyOn(authClient, 'get').mockResolvedValue({
      data: {
        data: {
          access_context: {
            active_shop: { shop_id: 'shop-b', shop_name: 'Shop B' },
            shops: [
              { shop_id: 'shop-a', shop_name: 'Shop A', membership_status: 'active' },
              { shop_id: 'shop-b', shop_name: 'Shop B', membership_status: 'active' },
            ],
          },
        },
      },
    } as never)
  })

  it('creates a policy for the selected active shop rather than cached active_shop_id', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><SellerApprovalPolicyFormPage /></MemoryRouter>)

    const shopSelector = await screen.findByRole('combobox', { name: 'Current shop' })
    expect(shopSelector).toHaveValue('shop-b')
    await user.type(await screen.findByLabelText('Policy Name'), 'Shop B policy')
    await user.type(screen.getByLabelText('Minimum Amount'), '100')
    await user.click(screen.getByRole('button', { name: 'Save Policy' }))

    await waitFor(() => {
      expect(accountingExpensesAdapter.createApprovalPolicy).toHaveBeenCalledWith(expect.objectContaining({
        shopId: 'shop-b',
        name: 'Shop B policy',
        minAmount: 100,
      }))
    })
  })

  it('does not allow policy creation until a shop is selected', async () => {
    vi.spyOn(authClient, 'get').mockResolvedValue({
      data: {
        data: {
          access_context: {
            shops: [
              { shop_id: 'shop-a', shop_name: 'Shop A', membership_status: 'active' },
              { shop_id: 'shop-b', shop_name: 'Shop B', membership_status: 'active' },
            ],
          },
        },
      },
    } as never)
    const user = userEvent.setup()
    render(<MemoryRouter><SellerApprovalPolicyFormPage /></MemoryRouter>)

    expect(await screen.findByRole('combobox', { name: 'Current shop' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Save Policy' })).toBeDisabled()
    expect(accountingExpensesAdapter.createApprovalPolicy).not.toHaveBeenCalled()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Current shop' }), 'shop-b')
    expect(screen.getByRole('button', { name: 'Save Policy' })).toBeEnabled()
  })
})
