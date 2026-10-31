import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PlatformExpensesPage from './PlatformExpensesPage'
import { accountingExpensesAdapter } from '@/features/accounting/adapters/accountingExpensesAdapter'
import { store } from '@/app/store'

const expenses = [
  {
    id: 'draft-platform',
    expenseNo: 'PLATFORM-DRAFT',
    scope: 'PLATFORM',
    shopId: null,
    amount: '75',
    currency: 'MMK',
    expenseDate: '2026-10-30T00:00:00.000Z',
    status: 'DRAFT',
    expenseTypeId: 'marketing',
  },
  {
    id: 'approved-platform',
    expenseNo: 'PLATFORM-APPROVED',
    scope: 'PLATFORM',
    shopId: null,
    amount: '100',
    currency: 'MMK',
    expenseDate: '2026-10-30T00:00:00.000Z',
    status: 'APPROVED',
    expenseTypeId: 'marketing',
  },
]

describe('PlatformExpensesPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(accountingExpensesAdapter, 'list').mockResolvedValue(expenses as never)
    vi.spyOn(accountingExpensesAdapter, 'listPendingApprovals').mockResolvedValue([])
    vi.spyOn(accountingExpensesAdapter, 'listCategories').mockResolvedValue([])
    vi.spyOn(accountingExpensesAdapter, 'listAccounts').mockResolvedValue([])
  })

  it('shows accounting entries and requests together and keeps requests out of the total', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter><PlatformExpensesPage /></MemoryRouter>
      </Provider>,
    )

    expect(await screen.findByText('PLATFORM-DRAFT')).toBeInTheDocument()
    expect(screen.getByText('PLATFORM-APPROVED')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3))
    const rows = screen.getAllByRole('row')
    expect(rows.some((row) => row.textContent?.includes('Draft'))).toBe(true)
    expect(rows.some((row) => row.textContent?.includes('Approved'))).toBe(true)
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(rows).toHaveLength(3)
  })
})
