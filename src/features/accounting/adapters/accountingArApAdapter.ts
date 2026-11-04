import { accountingClient } from '@/lib/api/accountingClient'
import type {
  ArApAgingResponse,
  ArApScopeQuery,
  ArApSummaryQuery,
  ArApSummaryResponse,
  ArApTransaction,
  ArApTransactionsQuery,
  ArApTransactionsResponse,
} from '../types/arApTypes'

export const accountingArApAdapter = {
  async getSummary(query: ArApSummaryQuery = {}): Promise<ArApSummaryResponse> {
    const response = await accountingClient.get<ArApSummaryResponse>('/reports/ar-ap', { params: query })
    return response.data
  },

  async listTransactions(query: ArApTransactionsQuery): Promise<ArApTransactionsResponse> {
    const response = await accountingClient.get<ArApTransactionsResponse>(
      '/reports/ar-ap/transactions',
      { params: query },
    )
    return response.data
  },

  async getTransaction(
    referenceType: string,
    referenceId: string,
    query: ArApScopeQuery = {},
  ): Promise<ArApTransaction[]> {
    const path = `/reports/ar-ap/transactions/${encodeURIComponent(referenceType)}/${encodeURIComponent(referenceId)}`
    const response = await accountingClient.get<ArApTransaction[]>(path, { params: query })
    return response.data
  },

  async getAging(query: ArApScopeQuery = {}): Promise<ArApAgingResponse> {
    const response = await accountingClient.get<ArApAgingResponse>('/reports/ar-ap/aging', { params: query })
    return response.data
  },
}
