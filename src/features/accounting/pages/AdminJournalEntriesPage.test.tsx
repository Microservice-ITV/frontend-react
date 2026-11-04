import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ecommerceReadRestClient } from '@/lib/api/ecommerceReadRestClient'
import { accountingClient } from '@/lib/api/accountingClient'
import AdminJournalEntriesPage from './AdminJournalEntriesPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('shows returned orders as informational ledger records without affecting journal totals', async () => {
  const returnedAt = new Date().toISOString()
  vi.spyOn(ecommerceReadRestClient, 'get').mockImplementation((url) => Promise.resolve({
    data: [{
      id: 'journal-cod-1',
      referenceType: 'COD_REVENUE',
      referenceId: 'cod-17',
      narration: 'COD revenue',
      entryDate: returnedAt,
      status: 'POSTED',
      lines: [
        { id: 'line-debit', direction: 'DEBIT', amount: 50, memo: 'Cash', account: { code: '1000', name: 'Cash' } },
        { id: 'line-credit', direction: 'CREDIT', amount: 50, memo: 'Revenue', account: { code: '4000', name: 'Revenue' } },
      ],
    }, {
      id: 'legacy-entry-1',
      referenceType: 'COD_REVENUE',
      referenceId: 'cod-legacy-1',
      narration: 'Legacy entry',
      entryDate: returnedAt,
      status: 'POSTED',
    }],
  } as never))
  vi.spyOn(accountingClient, 'get').mockResolvedValue({
    data: [{
      id: 'ORDER_RETURNED:order-17',
      referenceType: 'ORDER_RETURNED',
      referenceId: 'order-17',
      eventId: 'return-event-17',
      orderId: 'order-17',
      shopId: 'shop-4',
      reason: 'Customer refused delivery',
      returnedAt,
      status: 'RETURNED',
    }],
  } as never)

  render(
    <MemoryRouter>
      <AdminJournalEntriesPage />
    </MemoryRouter>,
  )

  const orderReference = await screen.findByText('order-17')
  const unavailableLines = screen.getByText('Journal lines unavailable')
  const legacyRow = unavailableLines.closest('tr')
  expect(legacyRow).toHaveTextContent('Legacy entry')
  expect(legacyRow?.querySelectorAll('td')[6]).toHaveTextContent('—')
  expect(legacyRow?.querySelectorAll('td')[7]).toHaveTextContent('—')
  const returnRow = orderReference.closest('tr')
  expect(returnRow).not.toBeNull()
  expect(returnRow).toHaveTextContent('shop-4')
  expect(returnRow).toHaveTextContent('ORDER_RETURNED')
  expect(returnRow).toHaveTextContent('Customer refused delivery')
  expect(returnRow).toHaveTextContent('Returned')
  expect(returnRow?.querySelectorAll('td')[6]).toHaveTextContent('—')
  expect(returnRow?.querySelectorAll('td')[7]).toHaveTextContent('—')
  expect(returnRow?.querySelectorAll('td')[2]).not.toBeEmptyDOMElement()
  expect(screen.getByText('Journal Entries', { selector: 'p' }).parentElement).toHaveTextContent('2')
  expect(screen.getByText('Total Debit').parentElement).toHaveTextContent('50.00')
  expect(screen.getByText('Total Credit').parentElement).toHaveTextContent('50.00')
  expect(screen.getByText('Balanced Entries').parentElement).toHaveTextContent('1')
  expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled()

  fireEvent.change(screen.getByLabelText('Filter by entry type'), {
    target: { value: 'ORDER_RETURNED' },
  })
  expect(screen.getByText('order-17')).toBeInTheDocument()
  expect(screen.queryByText('cod-17')).not.toBeInTheDocument()

  fireEvent.change(screen.getByPlaceholderText('Search references, accounts, shops, or return reasons...'), {
    target: { value: 'Customer refused' },
  })
  expect(screen.getByText('order-17')).toBeInTheDocument()
  expect(screen.queryByText('cod-17')).not.toBeInTheDocument()
})

it('shows pending expense requests separately from posted approved expense journal entries', async () => {
  const expenseDate = new Date().toISOString()
  vi.spyOn(ecommerceReadRestClient, 'get').mockResolvedValue({
    data: [{
      id: 'journal-expense-1',
      referenceType: 'EXPENSE',
      referenceId: 'EXP-APPROVED',
      narration: 'Marketing expense',
      entryDate: expenseDate,
      status: 'POSTED',
      lines: [
        { id: 'expense-debit', direction: 'DEBIT', amount: 100, memo: 'Marketing', account: { code: '5000', name: 'Expense' } },
        { id: 'expense-credit', direction: 'CREDIT', amount: 100, memo: 'Cash', account: { code: '1000', name: 'Cash' } },
      ],
    }],
  } as never)
  vi.spyOn(accountingClient, 'get').mockImplementation((url) => Promise.resolve({
    data: url === '/returns' ? [] : [
      {
        id: 'pending-expense',
        expenseNo: 'EXP-PENDING',
        shopId: 'shop-1',
        amount: '75',
        currency: 'MMK',
        expenseDate,
        status: 'PENDING_APPROVAL',
        expenseTypeId: 'marketing-id',
        expenseType: { name: 'Marketing' },
        description: 'Campaign supplies',
      },
      {
        id: 'approved-expense',
        expenseNo: 'EXP-APPROVED',
        shopId: 'shop-1',
        amount: '100',
        currency: 'MMK',
        expenseDate,
        status: 'APPROVED',
        expenseTypeId: 'marketing-id',
        expenseType: { name: 'Marketing' },
        description: 'Marketing expense',
        approvedAt: '2026-10-30T15:58:00.000Z',
      },
      {
        id: 'draft-expense',
        expenseNo: 'EXP-DRAFT',
        shopId: 'shop-1',
        amount: '50',
        currency: 'MMK',
        expenseDate,
        status: 'DRAFT',
        expenseTypeId: 'marketing-id',
        expenseType: { name: 'Marketing' },
        description: 'Unsubmitted draft',
      },
      {
        id: 'rejected-expense',
        expenseNo: 'EXP-REJECTED',
        shopId: 'shop-1',
        amount: '25',
        currency: 'MMK',
        expenseDate,
        status: 'REJECTED',
        expenseTypeId: 'marketing-id',
        expenseType: { name: 'Marketing' },
        description: 'Declined supplies',
      },
    ],
  } as never))

  render(
    <MemoryRouter>
      <AdminJournalEntriesPage />
    </MemoryRouter>,
  )

  const requestReference = await screen.findByText('EXP-PENDING')
  const requestRow = requestReference.closest('tr')
  expect(requestRow).toHaveTextContent('Expense Request')
  expect(requestRow).toHaveTextContent('Pending Approval')
  expect(requestRow).toHaveTextContent('Marketing')
  expect(requestRow).toHaveTextContent('shop-1')
  expect(requestRow).toHaveTextContent('75.00')
  expect(requestRow).toHaveTextContent('MMK')
  expect(requestRow).toHaveTextContent('Campaign supplies')
  expect(requestRow?.querySelectorAll('td')[6]).toHaveTextContent('—')
  expect(requestRow?.querySelectorAll('td')[7]).toHaveTextContent('—')
  const rejectedReference = screen.getByText('EXP-REJECTED')
  const rejectedRow = rejectedReference.closest('tr')
  expect(rejectedRow).toHaveTextContent('Rejected Expense')
  expect(rejectedRow).toHaveTextContent('Rejected')
  expect(rejectedRow?.querySelectorAll('td')[6]).toHaveTextContent('—')
  expect(rejectedRow?.querySelectorAll('td')[7]).toHaveTextContent('—')

  expect(screen.queryByText('EXP-DRAFT')).not.toBeInTheDocument()
  const approvedType = screen.getByText(/Approved Expense/)
  const approvedRow = approvedType.closest('tr')
  expect(approvedRow).toHaveTextContent('Approved Expense')
  expect(approvedRow).toHaveTextContent('Approved · Posted')
  const expectedLocalApprovalTime = new Date('2026-10-30T15:58:00.000Z').toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  expect(approvedRow).toHaveTextContent(`Approved · ${expectedLocalApprovalTime}`)
  expect(approvedRow).toHaveTextContent('shop-1')
  expect(approvedRow).toHaveTextContent('Marketing')
  expect(approvedRow).toHaveTextContent('EXP-APPROVED')
  expect(screen.getAllByText(/Approved Expense/)).toHaveLength(1)
  expect(screen.getAllByText('EXP-APPROVED')).toHaveLength(1)
  expect(screen.getByText('Total Debit').parentElement).toHaveTextContent('100.00')
  expect(screen.getByText('Total Credit').parentElement).toHaveTextContent('100.00')
  expect(screen.getAllByRole('columnheader')).toHaveLength(9)
  expect(screen.queryByText('Expense Requests')).not.toBeInTheDocument()
  expect(accountingClient.get).toHaveBeenCalledWith('/expenses', {
    params: { status: 'PENDING,PENDING_APPROVAL,APPROVED,REJECTED' },
  })
})

it('updates the same expense reference from pending to approved journal entry', async () => {
  const expenseDate = new Date().toISOString()
  let expenseStatus: 'PENDING_APPROVAL' | 'APPROVED' = 'PENDING_APPROVAL'
  vi.spyOn(ecommerceReadRestClient, 'get').mockImplementation((url) => Promise.resolve({
    data: url === '/accounting/entries' && expenseStatus === 'APPROVED'
      ? [{
          id: 'journal-lifecycle',
          referenceType: 'EXPENSE',
          referenceId: 'EXP-LIFECYCLE',
          narration: 'Lifecycle expense',
          entryDate: expenseDate,
          status: 'POSTED',
          lines: [
            { id: 'lifecycle-debit', direction: 'DEBIT', amount: 40, memo: 'Supplies', account: { code: '5000', name: 'Expense' } },
            { id: 'lifecycle-credit', direction: 'CREDIT', amount: 40, memo: 'Cash', account: { code: '1000', name: 'Cash' } },
          ],
        }]
      : [],
  } as never))
  vi.spyOn(accountingClient, 'get').mockImplementation((url) => Promise.resolve({
    data: url === '/returns' ? [] : [{
      id: 'lifecycle-expense',
      expenseNo: 'EXP-LIFECYCLE',
      shopId: 'shop-1',
      amount: '40',
      currency: 'MMK',
      expenseDate,
      status: expenseStatus,
      expenseTypeId: 'supplies',
      expenseType: { name: 'Supplies' },
      description: 'Lifecycle expense',
      approvedAt: expenseStatus === 'APPROVED' ? '2026-10-30T15:28:33.000Z' : null,
    }],
  } as never))

  render(
    <MemoryRouter>
      <AdminJournalEntriesPage />
    </MemoryRouter>,
  )

  const pendingReference = await screen.findByText('EXP-LIFECYCLE')
  expect(pendingReference.closest('tr')).toHaveTextContent('Expense Request')
  expect(screen.getByText('Total Debit').parentElement).toHaveTextContent('0.00')
  expect(screen.getByText('Total Credit').parentElement).toHaveTextContent('0.00')

  expenseStatus = 'APPROVED'
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

  await waitFor(() => {
    const approvedRef = screen.getByText('EXP-LIFECYCLE')
    expect(approvedRef.closest('tr')).toHaveTextContent('Approved Expense')
    expect(approvedRef.closest('tr')).toHaveTextContent('Approved · Posted')
  })
  expect(screen.getAllByText('EXP-LIFECYCLE')).toHaveLength(1)
  expect(screen.getByText('Total Debit').parentElement).toHaveTextContent('40.00')
  expect(screen.getByText('Total Credit').parentElement).toHaveTextContent('40.00')
  expect(screen.getAllByRole('columnheader')).toHaveLength(9)
})

it('keeps a rejected expense visible after its pending status changes', async () => {
  const expenseDate = new Date().toISOString()
  let expenseStatus: 'PENDING' | 'REJECTED' = 'PENDING'
  vi.spyOn(ecommerceReadRestClient, 'get').mockResolvedValue({ data: [] } as never)
  vi.spyOn(accountingClient, 'get').mockImplementation((url) => Promise.resolve({
    data: url === '/returns' ? [] : [{
      id: 'rejected-lifecycle',
      expenseNo: 'EXP-REJECTED-LIFECYCLE',
      shopId: 'shop-2',
      amount: '90',
      currency: 'MMK',
      expenseDate,
      status: expenseStatus,
      expenseTypeId: 'travel',
      expenseType: { name: 'Travel' },
      description: 'Declined travel',
    }],
  } as never))

  render(
    <MemoryRouter>
      <AdminJournalEntriesPage />
    </MemoryRouter>,
  )

  const pendingReference = await screen.findByText('EXP-REJECTED-LIFECYCLE')
  expect(pendingReference.closest('tr')).toHaveTextContent('Expense Request')
  expenseStatus = 'REJECTED'
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

  await waitFor(() => {
    const rejectedReference = screen.getByText('EXP-REJECTED-LIFECYCLE')
    expect(rejectedReference.closest('tr')).toHaveTextContent('Rejected Expense')
    expect(rejectedReference.closest('tr')).toHaveTextContent('Rejected')
    expect(rejectedReference.closest('tr')?.querySelectorAll('td')[6]).toHaveTextContent('—')
    expect(rejectedReference.closest('tr')?.querySelectorAll('td')[7]).toHaveTextContent('—')
  })
  expect(screen.getAllByText('EXP-REJECTED-LIFECYCLE')).toHaveLength(1)
  expect(screen.getByText('Total Debit').parentElement).toHaveTextContent('0.00')
  expect(screen.getByText('Total Credit').parentElement).toHaveTextContent('0.00')
})
