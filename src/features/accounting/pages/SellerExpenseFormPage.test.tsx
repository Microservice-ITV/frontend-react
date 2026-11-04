import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SellerExpenseFormPage from './SellerExpenseFormPage'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import { authClient } from '@/lib/api/authClient'
import { store } from '@/app/store'
import { fetchMe } from '@/features/auth/store/authThunks'

describe('SellerExpenseFormPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.restoreAllMocks()
    store.dispatch(fetchMe.fulfilled({
      id: 'admin-2',
      name: 'Admin2',
      email: 'admin2@example.com',
    }, '', undefined))
    vi.spyOn(accountingExpensesAdapter, 'listCategories').mockResolvedValue([])
    vi.spyOn(accountingExpensesAdapter, 'listAccounts').mockResolvedValue([])
  })

  it('loads shop options from the authenticated shop memberships', async () => {
    vi.spyOn(authClient, 'get').mockResolvedValue({
      data: {
        data: {
          access_context: {
            active_shop: { shop_id: 'main-store' },
            shops: [
              { shop_id: 'main-store', shop_name: 'Main Store', membership_status: 'active' },
              { shop_id: 'inactive-shop', shop_name: 'Inactive Shop', membership_status: 'inactive' },
            ],
          },
        },
      },
    } as never)

    render(
      <Provider store={store}>
        <MemoryRouter>
          <SellerExpenseFormPage />
        </MemoryRouter>
      </Provider>,
    )

    await waitFor(() => expect(authClient.get).toHaveBeenCalledWith('/me/access-context'))
    expect(await screen.findByText('Main Store')).toBeInTheDocument()
    expect(screen.queryByText('No active shop memberships are available for this account. Ask a shop owner to add you to the shop.')).not.toBeInTheDocument()
  })
})
