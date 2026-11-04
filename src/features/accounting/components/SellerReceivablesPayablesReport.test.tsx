import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { accountingClient } from '@/lib/api/accountingClient'
import { authClient } from '@/lib/api/authClient'
import type {
  ArApAgingResponse,
  ArApSummaryResponse,
  ArApTransactionsResponse,
} from '../types/arApTypes'
import SellerReceivablesPayablesReport, { buildArApMetricGroups } from './SellerReceivablesPayablesReport'

const summary: ArApSummaryResponse = {
  asOf: '2026-10-29T00:00:00.000Z',
  scope: { type: 'authorized_shops', shopIds: ['shop-1', 'shop-2'] },
  source: 'POSTED_ACCOUNTING_JOURNAL_LINES',
  currencyPolicy: 'Currencies remain separate.',
  accountBalances: [
    {
      accountCode: '1200',
      accountName: 'COD Receivable',
      bucket: 'receivables',
      shopId: 'shop-1',
      currency: 'MMK',
      debit: 100,
      credit: 0,
      balance: 100,
      lineCount: 1,
      balanceMeaning: 'posted_receivable_control_account_balance',
    },
    {
      accountCode: '1100',
      accountName: 'Accounts Receivable',
      bucket: 'receivables',
      shopId: 'shop-2',
      currency: 'USD',
      debit: 200,
      credit: 0,
      balance: 200,
      lineCount: 1,
      balanceMeaning: 'posted_receivable_control_account_balance',
    },
    {
      accountCode: '1210',
      accountName: 'COD Collection Clearing',
      bucket: 'cod_clearing',
      shopId: 'shop-1',
      currency: 'MMK',
      debit: 50,
      credit: 0,
      balance: 50,
      lineCount: 1,
      balanceMeaning: 'cod_collection_clearing_not_customer_receivable',
    },
    {
      accountCode: '2000',
      accountName: 'Accounts Payable',
      bucket: 'payables',
      shopId: 'shop-1',
      currency: 'USD',
      debit: 0,
      credit: 25,
      balance: 25,
      lineCount: 1,
      balanceMeaning: 'posted_liability_gl_balance_payee_may_be_unavailable',
    },
    {
      accountCode: '2200',
      accountName: 'Deferred COD Revenue',
      bucket: 'deferred_revenue',
      shopId: 'shop-1',
      currency: 'MMK',
      debit: 0,
      credit: 100,
      balance: 100,
      lineCount: 1,
      balanceMeaning: 'deferred_cod_revenue_not_yet_collected',
    },
  ],
  receivableItems: [{
    accountCode: '1200',
    shopId: 'shop-1',
    currency: 'MMK',
    orderId: 'order-1',
    customerId: null,
    customerIdentityAvailable: false,
    debitRecognized: 100,
    creditsPostedToReceivable: 0,
    outstandingBalance: 100,
    status: 'OPEN',
    sourceReferences: [{ referenceType: 'COD_ORDER_CONFIRMED', referenceId: 'order-1:shop-1' }],
  }],
  codCollectionClearing: {
    accountCode: '1210',
    balanceRows: [{
      accountCode: '1210',
      accountName: 'COD Collection Clearing',
      bucket: 'cod_clearing',
      shopId: 'shop-1',
      currency: 'MMK',
      debit: 50,
      credit: 0,
      balance: 50,
      lineCount: 1,
      balanceMeaning: 'cod_collection_clearing_not_customer_receivable',
    }],
    evidenceNote: 'payment.collected indicates courier collection; it does not independently verify courier-to-bank remittance.',
  },
  payables: {
    accountBalances: [
      {
        accountCode: '2000',
        accountName: 'Accounts Payable',
        bucket: 'payables',
        shopId: 'shop-1',
        currency: 'USD',
        debit: 0,
        credit: 25,
        balance: 25,
        lineCount: 1,
        balanceMeaning: 'posted_liability_gl_balance_payee_may_be_unavailable',
      },
    ],
    payeeIdentityAvailable: false,
    obligationDetailAvailable: false,
    partialSettlementAllocationAvailable: false,
    expenseApAvailable: false,
    expenseApLimitation: 'Expense journals are cash funded.',
    note: 'Accounts 2000 and 2100 are ledger liabilities, not confirmed supplier bills.',
  },
  recordedSettlements: [],
  recordedReceipts: [
    {
      shopId: 'shop-1',
      currency: 'MMK',
      paymentReference: 'payment-1',
      orderId: 'order-1',
      amount: 40,
      journalIds: ['journal-1'],
      sourceReferences: [{ referenceType: 'COD_BANK_RECEIPT', referenceId: 'payment-1:shop-1' }],
      evidenceStatus: 'EXISTING_COURIER_COLLECTION_EVENT_NOT_INDEPENDENT_BANK_VERIFICATION',
      meaning: 'Not bank verified.',
    },
    {
      shopId: 'shop-2',
      currency: 'USD',
      paymentReference: 'payment-2',
      orderId: 'order-2',
      amount: 15,
      journalIds: ['journal-2'],
      sourceReferences: [{ referenceType: 'COD_BANK_RECEIPT', referenceId: 'payment-2:shop-2' }],
      evidenceStatus: 'EXISTING_COURIER_COLLECTION_EVENT_NOT_INDEPENDENT_BANK_VERIFICATION',
      meaning: 'Not bank verified.',
    },
  ],
  paymentAllocations: { available: false, reason: 'No allocation source.' },
  expectedIncome: { available: false, reason: 'No expected-income source.' },
  aging: { available: false, reason: 'Reliable invoice or due dates are unavailable.' },
  missingAttribution: [],
}

const transactionResponse: ArApTransactionsResponse = {
  transactions: [{
    journalId: 'journal-1',
    referenceType: 'COD_ORDER_CONFIRMED',
    referenceId: 'order-1:shop-1',
    eventId: 'event-1',
    narration: 'COD revenue',
    entryDate: '2026-10-28T00:00:00.000Z',
    createdAt: '2026-10-28T00:00:00.000Z',
    status: 'POSTED',
    journalCompleteness: 'AUTHORIZED_SHOP_LINES_ONLY',
    lines: [{
      accountCode: '1200',
      accountName: 'COD Receivable',
      bucket: 'receivables',
      direction: 'DEBIT',
      amount: 100,
      currency: 'MMK',
      shopId: 'shop-1',
      memo: 'COD receivable',
    }],
  }],
  total: 1,
  limit: 10,
  offset: 0,
  scope: { type: 'authorized_shops', shopIds: ['shop-1', 'shop-2'] },
}

const aging: ArApAgingResponse = {
  asOf: '2026-10-29T00:00:00.000Z',
  available: false,
  reason: 'No reliable due date or invoice date is available.',
  buckets: null,
  scope: { type: 'authorized_shops', shopIds: ['shop-1', 'shop-2'] },
  currencyPolicy: 'Currencies remain separate.',
}

const authContext = {
  data: {
    data: {
      access_context: {
        active_shop: { shop_id: 'shop-1', shop_name: 'Shop One' },
        shops: [
          { shop_id: 'shop-1', shop_name: 'Shop One' },
          { shop_id: 'shop-2', shop_name: 'Shop Two' },
        ],
      },
    },
  },
}

const configureApi = (options?: {
  summary?: ArApSummaryResponse
  transactions?: ArApTransactionsResponse
  aging?: ArApAgingResponse
  failure?: unknown
}) => {
  vi.spyOn(authClient, 'get').mockResolvedValue(authContext as never)
  return vi.spyOn(accountingClient, 'get').mockImplementation((url) => {
    if (options?.failure) return Promise.reject(options.failure)
    if (url === '/reports/ar-ap') return Promise.resolve({ data: options?.summary ?? summary } as never)
    if (url === '/reports/ar-ap/transactions') return Promise.resolve({ data: options?.transactions ?? transactionResponse } as never)
    if (url === '/reports/ar-ap/aging') return Promise.resolve({ data: options?.aging ?? aging } as never)
    if (url.startsWith('/reports/ar-ap/transactions/')) return Promise.resolve({ data: options?.transactions?.transactions ?? transactionResponse.transactions } as never)
    return Promise.reject(new Error(`Unexpected request: ${String(url)}`))
  })
}

describe('SellerReceivablesPayablesReport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('groups summary balances by currency and does not combine MMK with USD', () => {
    const groups = buildArApMetricGroups(summary)
    expect(groups.receivables).toEqual([
      { currency: 'MMK', value: 100 },
      { currency: 'USD', value: 200 },
    ])
    expect(groups.codClearing).toEqual([{ currency: 'MMK', value: 50 }])
    expect(groups.deferredRevenue).toEqual([{ currency: 'MMK', value: 100 }])
    expect(groups.payables).toEqual([{ currency: 'USD', value: 25 }])
    expect(groups.account1010Debits).toEqual([
      { currency: 'MMK', value: 40 },
      { currency: 'USD', value: 15 },
    ])
  })

  it('renders currency-separated balances, COD bank warning, and unavailable aging without fake buckets', async () => {
    configureApi()
    render(<SellerReceivablesPayablesReport />)

    expect(await screen.findByRole('heading', { name: 'Accounts Receivable / Accounts Payable' })).toBeInTheDocument()
    expect(await screen.findAllByText('MMK 100.00')).toHaveLength(3)
    expect(screen.getByText('USD 200.00')).toBeInTheDocument()
    expect(screen.getByText('MMK 50.00')).toBeInTheDocument()
    expect(screen.getByText('Deferred COD Revenue')).toBeInTheDocument()
    expect(screen.getByText(/MMK 40\.00/)).toBeInTheDocument()
    expect(screen.getByText(/USD 15\.00/)).toBeInTheDocument()
    expect(screen.getByText(/does not independently verify courier-to-bank remittance/i)).toBeInTheDocument()
    expect(screen.getByText('No reliable due date or invoice date is available.')).toBeInTheDocument()
    expect(screen.queryByText(/1–30|31–60|61–90|over 90/i)).not.toBeInTheDocument()
    expect(screen.getByText(/not confirmed supplier bills/i)).toBeInTheDocument()
  })

  it('renders supported AR sources and ledger liabilities without inventing due dates or payees', async () => {
    configureApi()
    render(<SellerReceivablesPayablesReport />)

    expect(await screen.findByText('Order order-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'COD_ORDER_CONFIRMED-281026-0001' })).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('2000 · Accounts Payable')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Accounts Receivable' })).toHaveLength(2)
    expect(screen.getAllByRole('heading', { name: 'Accounts Payable' })).toHaveLength(2)
    expect(screen.getByText('COD Clearing')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader', { name: 'Due date' })).toHaveLength(2)
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0)
    expect(screen.getByText(/supplier identity, invoice dates, due dates, and payable references are not provided/i)).toBeInTheDocument()
  })

  it('limits shop selection to shops in the authenticated access context and queries the selected shop', async () => {
    const get = configureApi()
    render(<SellerReceivablesPayablesReport />)

    const shopFilter = await screen.findByLabelText('AR/AP shop')
    const options = within(shopFilter).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'All authorized shops',
      'Shop One',
      'Shop Two',
    ])
    fireEvent.change(shopFilter, { target: { value: 'shop-2' } })

    await waitFor(() => {
      expect(get).toHaveBeenCalledWith('/reports/ar-ap', expect.objectContaining({
        params: expect.objectContaining({ shopId: 'shop-2' }),
      }))
    })
  })

  it('formats receivable references like other accounting pages and opens their journal details', async () => {
    const get = configureApi()
    render(<SellerReceivablesPayablesReport />)

    const formattedReference = await screen.findByRole('button', { name: 'COD_ORDER_CONFIRMED-281026-0001' })
    expect(screen.queryByRole('heading', { name: 'Recent journal transactions' })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(get).toHaveBeenCalledWith('/reports/ar-ap/transactions', {
        params: expect.objectContaining({
          shopId: 'shop-1',
          limit: 200,
          offset: 0,
        }),
      })
    })

    fireEvent.click(formattedReference)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('COD receivable')).toHaveLength(1)
    expect(get).toHaveBeenCalledWith(
      '/reports/ar-ap/transactions/COD_ORDER_CONFIRMED/order-1%3Ashop-1',
      { params: { shopId: 'shop-1' } },
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.change(screen.getByLabelText('AR/AP currency'), { target: { value: 'USD' } })
    await waitFor(() => {
      expect(get).toHaveBeenCalledWith('/reports/ar-ap/transactions', {
        params: expect.objectContaining({
          shopId: 'shop-1',
          currency: 'USD',
          limit: 200,
          offset: 0,
        }),
      })
    })
  })

  it('loads reference dates without rendering a separate journal transaction table', async () => {
    const get = configureApi()
    render(<SellerReceivablesPayablesReport />)

    await screen.findByRole('button', { name: 'COD_ORDER_CONFIRMED-281026-0001' })
    expect(screen.queryByRole('heading', { name: 'Recent journal transactions' })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(get).toHaveBeenCalledWith('/reports/ar-ap/transactions', {
        params: expect.objectContaining({ limit: 200, offset: 0 }),
      })
    })
  })

  it('shows loading and empty states', async () => {
    let resolveAccess: ((value: typeof authContext) => void) | undefined
    vi.spyOn(authClient, 'get').mockReturnValue(new Promise((resolve) => {
      resolveAccess = resolve as (value: typeof authContext) => void
    }) as never)
    vi.spyOn(accountingClient, 'get').mockImplementation((url) => {
      if (url === '/reports/ar-ap') {
        return Promise.resolve({
          data: { ...summary, receivableItems: [] },
        } as never)
      }
      if (url === '/reports/ar-ap/transactions') {
        return Promise.resolve({ data: { ...transactionResponse, transactions: [], total: 0 } } as never)
      }
      return Promise.resolve({ data: aging } as never)
    })
    render(<SellerReceivablesPayablesReport />)
    expect(screen.getByRole('status', { name: 'Loading AR/AP data' })).toBeInTheDocument()
    resolveAccess?.(authContext)
    expect(await screen.findByText('No receivable source items are available for this scope.')).toBeInTheDocument()
  })

  it('does not render empty aging buckets even when the API flag is true', async () => {
    configureApi({
      aging: { ...aging, available: true, buckets: {} },
    })
    render(<SellerReceivablesPayablesReport />)

    expect(await screen.findByText('No reliable due date or invoice date is available.')).toBeInTheDocument()
    expect(screen.queryByText('current')).not.toBeInTheDocument()
  })

  it.each([
    [401, 'Your session has expired. Sign in again to view finance data.'],
    [403, 'You are not authorized to view this shop’s accounting data.'],
  ])('shows the API %i authorization error without fabricating balances', async (statusCode, message) => {
    configureApi({ failure: { response: { status: statusCode, data: {} } } })
    render(<SellerReceivablesPayablesReport />)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByText('MMK 100.00')).not.toBeInTheDocument()
  })
})
