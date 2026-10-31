import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SellerApprovalPoliciesPage from './SellerApprovalPoliciesPage'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import { authClient } from '@/lib/api/authClient'
import { store } from '@/app/store'
import { fetchMe } from '@/features/auth/store/authThunks'

describe('SellerApprovalPoliciesPage shop context', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.restoreAllMocks()
    store.dispatch(fetchMe.fulfilled({
      id: 'owner-1',
      name: 'Owner',
      email: 'owner@example.com',
      active_shop_id: 'shop-a',
    }, '', undefined))
    vi.spyOn(accountingExpensesAdapter, 'listApprovalPolicies').mockResolvedValue([])
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

  it('lists policies for authoritative active shop instead of stale cached shop and reloads on switch', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><SellerApprovalPoliciesPage /></MemoryRouter>)

    await waitFor(() => {
      expect(accountingExpensesAdapter.listApprovalPolicies).toHaveBeenCalledWith('shop-b')
    })
    const shopSelector = await screen.findByRole('combobox', { name: 'Current shop' })
    expect(shopSelector).toHaveValue('shop-b')

    await user.selectOptions(shopSelector, 'shop-a')
    await waitFor(() => {
      expect(accountingExpensesAdapter.listApprovalPolicies).toHaveBeenCalledWith('shop-a')
    })
  })
})
