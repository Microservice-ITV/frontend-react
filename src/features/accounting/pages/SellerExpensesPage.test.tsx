import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SellerExpensesPage from './SellerExpensesPage'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import { authClient } from '@/lib/api/authClient'
import { store } from '@/app/store'
import { fetchMe } from '@/features/auth/store/authThunks'

const expenses = [
  {
    id: 'draft-id',
    expenseNo: 'EXP-DRAFT',
    shopId: 'shop-1',
    amount: '75',
    currency: 'MMK',
    expenseDate: '2026-10-30T00:00:00.000Z',
    status: 'DRAFT',
    expenseTypeId: 'marketing',
  },
  {
    id: 'approved-id',
    expenseNo: 'EXP-APPROVED',
    shopId: 'shop-1',
    amount: '100',
    currency: 'MMK',
    expenseDate: '2026-10-30T00:00:00.000Z',
    status: 'APPROVED',
    expenseTypeId: 'marketing',
  },
]

describe('SellerExpensesPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.restoreAllMocks()
    store.dispatch(fetchMe.fulfilled({
      id: 'owner-1',
      name: 'Owner',
      email: 'owner@example.com',
    }, '', undefined))
    vi.spyOn(accountingExpensesAdapter, 'list').mockResolvedValue(expenses as never)
    vi.spyOn(accountingExpensesAdapter, 'listCategories').mockResolvedValue([
      { id: 'marketing', code: 'MARKETING', name: 'Marketing' },
    ] as never)
    vi.spyOn(authClient, 'get').mockResolvedValue({
      data: { data: { access_context: { shops: [{ shop_id: 'shop-1', shop_name: 'Main Store' }] } } },
    } as never)
  })

  it('shows accounting entries and requests together and keeps requests out of the total', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter><SellerExpensesPage /></MemoryRouter>
      </Provider>,
    )

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3))
    const rows = screen.getAllByRole('row')
    expect(rows.some((row) => row.textContent?.includes('Draft'))).toBe(true)
    expect(rows.some((row) => row.textContent?.includes('Approved'))).toBe(true)
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.queryByRole('group', { name: 'Expense view' })).not.toBeInTheDocument()
    expect(rows).toHaveLength(3)
  })
})
