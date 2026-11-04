import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { accountingClient } from '@/lib/api/accountingClient'
import { authClient } from '@/lib/api/authClient'
import SellerReceivablesPayablesPage from './SellerReceivablesPayablesPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('renders Receivables & Payables as a standalone accounting page', async () => {
  vi.spyOn(authClient, 'get').mockResolvedValue({
    data: { data: { access_context: { active_shop: { shop_id: 'shop-1' }, shops: [{ shop_id: 'shop-1' }] } } },
  } as never)
  vi.spyOn(accountingClient, 'get').mockImplementation((url) => {
    if (url === '/reports/ar-ap') {
      return Promise.resolve({
        data: {
          asOf: '2026-10-29T00:00:00.000Z',
          scope: { type: 'authorized_shops', shopIds: ['shop-1'] },
          source: 'POSTED_ACCOUNTING_JOURNAL_LINES',
          currencyPolicy: 'Currencies remain separate.',
          accountBalances: [],
          receivableItems: [],
          codCollectionClearing: {
            accountCode: '1210',
            balanceRows: [],
            evidenceNote: 'Courier collection is not bank remittance evidence.',
          },
          payables: {
            accountBalances: [],
            payeeIdentityAvailable: false,
            obligationDetailAvailable: false,
            partialSettlementAllocationAvailable: false,
            expenseApAvailable: false,
            expenseApLimitation: 'No payable sources.',
            note: 'Ledger liabilities are not confirmed supplier bills.',
          },
          recordedSettlements: [],
          recordedReceipts: [],
          paymentAllocations: { available: false, reason: 'No allocation source.' },
          expectedIncome: { available: false, reason: 'No expected-income source.' },
          aging: { available: false, reason: 'Due dates unavailable.' },
          missingAttribution: [],
        },
      } as never)
    }
    if (url === '/reports/ar-ap/transactions') {
      return Promise.resolve({
        data: {
          transactions: [],
          total: 0,
          limit: 10,
          offset: 0,
          scope: { type: 'authorized_shops', shopIds: ['shop-1'] },
        },
      } as never)
    }
    return Promise.resolve({
      data: {
        asOf: '2026-10-29T00:00:00.000Z',
        available: false,
        reason: 'Due dates unavailable.',
        buckets: null,
        scope: { type: 'authorized_shops', shopIds: ['shop-1'] },
        currencyPolicy: 'Currencies remain separate.',
      },
    } as never)
  })

  render(
    <MemoryRouter>
      <SellerReceivablesPayablesPage />
    </MemoryRouter>,
  )

  expect(await screen.findByRole('heading', { name: 'Accounts Receivable / Accounts Payable' })).toBeInTheDocument()
  expect(screen.getByText('Review receivable balances, posted liabilities, and COD clearing.')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Recent journal transactions' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Finance Overview/ })).not.toBeInTheDocument()
})
