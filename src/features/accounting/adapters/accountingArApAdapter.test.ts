import { afterEach, describe, expect, it, vi } from 'vitest'
import { accountingClient } from '@/lib/api/accountingClient'
import { accountingArApAdapter } from './accountingArApAdapter'

afterEach(() => vi.restoreAllMocks())

describe('accountingArApAdapter', () => {
  it('uses the existing Accounting client and returns the summary API payload', async () => {
    const data = { source: 'POSTED_ACCOUNTING_JOURNAL_LINES' }
    const get = vi.spyOn(accountingClient, 'get').mockResolvedValue({ data } as never)

    await expect(accountingArApAdapter.getSummary({ shopId: 'shop-1', currency: 'MMK' })).resolves.toBe(data)
    expect(get).toHaveBeenCalledWith('/reports/ar-ap', { params: { shopId: 'shop-1', currency: 'MMK' } })
  })

  it('passes supported server-side transaction filters and pagination', async () => {
    const data = { transactions: [], total: 0, limit: 10, offset: 0 }
    const get = vi.spyOn(accountingClient, 'get').mockResolvedValue({ data } as never)

    await expect(accountingArApAdapter.listTransactions({
      shopId: 'shop-1',
      currency: 'USD',
      bucket: 'payables',
      limit: 10,
      offset: 20,
    })).resolves.toBe(data)
    expect(get).toHaveBeenCalledWith('/reports/ar-ap/transactions', {
      params: {
        shopId: 'shop-1',
        currency: 'USD',
        bucket: 'payables',
        limit: 10,
        offset: 20,
      },
    })
  })

  it('encodes journal reference path segments and requests aging from the Accounting API', async () => {
    const detail = [{ referenceType: 'COD_BANK_RECEIPT', referenceId: 'payment:shop-1' }]
    const get = vi.spyOn(accountingClient, 'get').mockResolvedValue({ data: detail } as never)

    await accountingArApAdapter.getTransaction('COD_BANK_RECEIPT', 'payment:shop-1', { shopId: 'shop-1' })
    await accountingArApAdapter.getAging({ shopId: 'shop-1' })

    expect(get).toHaveBeenNthCalledWith(
      1,
      '/reports/ar-ap/transactions/COD_BANK_RECEIPT/payment%3Ashop-1',
      { params: { shopId: 'shop-1' } },
    )
    expect(get).toHaveBeenNthCalledWith(2, '/reports/ar-ap/aging', { params: { shopId: 'shop-1' } })
  })
})
