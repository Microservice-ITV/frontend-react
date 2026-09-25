import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SellerExpenseDetailPage from './SellerExpenseDetailPage'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import { authClient } from '@/lib/api/authClient'
import { store } from '@/app/store'
import { fetchMe } from '@/features/auth/store/authThunks'

const currentUser = { id: 'approver-1', name: 'Alice', email: 'alice@example.com' }

const mockExpense = {
  id: 'exp-123',
  expenseNo: 'EXP-2026-0001',
  shopId: 'shop-1',
  sellerUserId: 'seller-1',
  expenseTypeId: 'type-1',
  amount: '250000',
  currency: 'MMK',
  description: 'Travel',
  expenseDate: '2026-09-21T00:00:00.000Z',
  status: 'PENDING_APPROVAL',
  createdAt: '2026-09-21T00:00:00.000Z',
  updatedAt: '2026-09-21T00:00:00.000Z',
  submittedAt: '2026-09-21T00:00:00.000Z',
}

const mockApprovalStatus = {
  expenseId: 'exp-123',
  status: 'PENDING_APPROVAL',
  approvals: [
    {
      id: 'approval-1',
      expenseId: 'exp-123',
      stepNo: 1,
      approverUserId: 'approver-1',
      status: 'PENDING',
      action: 'SUBMITTED',
      comment: null,
      approvedAt: null,
      rejectedAt: null,
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:00.000Z',
    },
    {
      id: 'approval-2',
      expenseId: 'exp-123',
      stepNo: 2,
      approverUserId: 'approver-2',
      status: 'WAITING',
      action: null,
      comment: null,
      approvedAt: null,
      rejectedAt: null,
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:00.000Z',
    },
    {
      id: 'approval-3',
      expenseId: 'exp-123',
      stepNo: 3,
      approverUserId: 'approver-3',
      status: 'WAITING',
      action: null,
      comment: null,
      approvedAt: null,
      rejectedAt: null,
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:00.000Z',
    },
  ],
}

const renderPage = (stateUserId = 'approver-1', route = '/seller/accounting/expenses/exp-123') => {
  store.dispatch(fetchMe.fulfilled({ ...currentUser, id: stateUserId }, '', undefined))

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/seller/accounting/expenses/:expenseId" element={<SellerExpenseDetailPage />} />
          <Route path="/super-admin/accounting/platform-expenses/:expenseId" element={<SellerExpenseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('SellerExpenseDetailPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(accountingExpensesAdapter, 'getByReference').mockResolvedValue(mockExpense as any)
    vi.spyOn(accountingExpensesAdapter, 'getApprovalStatus').mockResolvedValue(mockApprovalStatus as any)
    vi.spyOn(accountingExpensesAdapter, 'approveExpense').mockResolvedValue({
      expenseId: 'exp-123',
      approvalId: 'approval-1',
      status: 'APPROVED',
      expenseStatus: 'PENDING_APPROVAL',
      currentApproval: mockApprovalStatus.approvals[0],
    } as any)
    vi.spyOn(authClient, 'get').mockImplementation(async (url) => {
      if (url === '/me/access-context') {
        return { data: { data: { access_context: { shops: [] } } } } as any
      }

      return {
        data: {
          data: {
            users: [
              { user: { id: 'approver-1', name: 'Alice Manager' } },
              { user: { id: 'approver-2', name: 'Bob Manager' } },
              { user: { id: 'approver-3', name: 'Carol Manager' } },
            ],
          },
        },
      } as any
    })
    store.dispatch(fetchMe.fulfilled(currentUser, '', undefined))
  })

  it('renders approval timeline and current approver actions', async () => {
    const user = userEvent.setup()
    renderPage('approver-1')

    await waitFor(() => expect(screen.getByText('PENDING')).toBeInTheDocument())
    expect(screen.getAllByText('WAITING')).toHaveLength(2)
    expect(screen.getAllByText('Manager')).toHaveLength(3)
    expect(screen.getByText('Bob Manager')).toBeInTheDocument()
    expect(screen.getByText('Carol Manager')).toBeInTheDocument()

    const approveButton = screen.getByRole('button', { name: /approve/i })
    const rejectButton = screen.getByRole('button', { name: /reject/i })
    const returnButton = screen.getByRole('button', { name: /return/i })

    expect(approveButton).toBeEnabled()
    expect(rejectButton).toBeEnabled()
    expect(returnButton).toBeEnabled()

    await user.click(approveButton)
    expect(accountingExpensesAdapter.approveExpense).toHaveBeenCalledWith('exp-123', 'approval-1')
  })

  it('hides action buttons when the user is not the current approver', async () => {
    renderPage('another-user')
    await waitFor(() => expect(screen.getByText('Approval')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('handles 403 correctly', async () => {
    const error = { response: { status: 403, data: { error: 'Forbidden' } } }
    vi.spyOn(accountingExpensesAdapter, 'getApprovalStatus').mockRejectedValue(error as any)
    renderPage('approver-1')
    await waitFor(() => expect(screen.getByText(/Forbidden/i)).toBeInTheDocument())
  })

  it('displays returned approval actions separately from normal rejection', async () => {
    const getByReference = vi.spyOn(accountingExpensesAdapter, 'getByReference')
    const getApprovalStatus = vi.spyOn(accountingExpensesAdapter, 'getApprovalStatus')
    getByReference.mockReset().mockResolvedValue({
      ...mockExpense,
      status: 'RETURNED',
    } as any)
    getApprovalStatus.mockReset().mockResolvedValue({
      ...mockApprovalStatus,
      status: 'RETURNED',
      approvals: [{
        ...mockApprovalStatus.approvals[0],
        status: 'REJECTED',
        action: 'RETURNED',
      }],
    } as any)

    renderPage('another-user')

    await waitFor(() => expect(screen.getAllByText('RETURNED').length).toBeGreaterThanOrEqual(2))
    expect(screen.queryByText('REJECTED')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit and resubmit/i })).not.toBeInTheDocument()
  })

  it('shows edit and resubmit only to the expense creator', async () => {
    const getByReference = vi.spyOn(accountingExpensesAdapter, 'getByReference')
    getByReference.mockReset().mockResolvedValue({ ...mockExpense, status: 'RETURNED' } as any)
    vi.spyOn(accountingExpensesAdapter, 'getApprovalStatus').mockResolvedValue({
      ...mockApprovalStatus,
      status: 'RETURNED',
      approvals: [{ ...mockApprovalStatus.approvals[0], status: 'REJECTED', action: 'RETURNED' }],
    } as any)

    renderPage('seller-1')

    await waitFor(() => expect(screen.getByRole('button', { name: /edit and resubmit/i })).toBeInTheDocument())
  })

  it('allows a platform creator to submit a draft expense using createdByUserId', async () => {
    const getByReference = vi.spyOn(accountingExpensesAdapter, 'getByReference')
    getByReference.mockReset().mockResolvedValue({
      ...mockExpense,
      shopId: null,
      sellerUserId: null,
      createdByUserId: 'platform-creator',
      status: 'DRAFT',
      expenseTypeId: 'type-1',
    } as any)
    vi.spyOn(accountingExpensesAdapter, 'getApprovalStatus').mockResolvedValue({
      expenseId: 'exp-123',
      status: 'DRAFT',
      approvals: [],
    } as any)

    renderPage('platform-creator', '/super-admin/accounting/platform-expenses/exp-123')

    await waitFor(() => expect(screen.getByRole('button', { name: /submit for approval/i })).toBeInTheDocument())
  })

  it('displays normal rejection as REJECTED', async () => {
    const getByReference = vi.spyOn(accountingExpensesAdapter, 'getByReference')
    const getApprovalStatus = vi.spyOn(accountingExpensesAdapter, 'getApprovalStatus')
    getByReference.mockReset().mockResolvedValue({
      ...mockExpense,
      status: 'REJECTED',
    } as any)
    getApprovalStatus.mockReset().mockResolvedValue({
      ...mockApprovalStatus,
      status: 'REJECTED',
      approvals: [{
        ...mockApprovalStatus.approvals[0],
        status: 'REJECTED',
        action: 'REJECTED',
      }],
    } as any)

    renderPage('another-user')

    await waitFor(() => expect(screen.getAllByText('REJECTED').length).toBeGreaterThanOrEqual(2))
    expect(screen.queryByText('RETURNED')).not.toBeInTheDocument()
  })
})
