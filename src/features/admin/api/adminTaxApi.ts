import { taxClient } from '@/lib/api/taxClient'

export type TaxSettings = {
  isEnabled: boolean
  currency: string
  updatedAt?: string
}

export type TaxCategoryAssignment = {
  categoryId: string
  categoryName: string
}

export type TaxCharge = {
  id: string
  rate: number
  isActive: boolean
  categories: TaxCategoryAssignment[]
  updatedAt?: string
}

export type TaxListPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type TaxListQuery = {
  page?: number
  limit?: number
  search?: string
}

const unwrap = <T>(payload: { data?: T } | T): T => {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data
  }
  return payload as T
}

export const adminTaxApi = {
  async getSettings(): Promise<TaxSettings> {
    const response = await taxClient.get('/settings')
    return unwrap<TaxSettings>(response.data)
  },

  async updateSettings(isEnabled: boolean): Promise<TaxSettings> {
    const response = await taxClient.put('/settings', { isEnabled })
    return unwrap<TaxSettings>(response.data)
  },

  async listTaxes(query: TaxListQuery = {}): Promise<{ data: TaxCharge[]; pagination: TaxListPagination }> {
    const response = await taxClient.get('/taxes', {
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        ...(query.search?.trim() ? { search: query.search.trim() } : {}),
      },
    })
    const body = response.data as {
      data?: TaxCharge[]
      pagination?: TaxListPagination
    }
    const data = Array.isArray(body?.data) ? body.data : []
    return {
      data,
      pagination: body?.pagination ?? {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        total: data.length,
        totalPages: data.length === 0 ? 0 : 1,
      },
    }
  },

  async listAllTaxes(): Promise<TaxCharge[]> {
    const limit = 100
    const first = await this.listTaxes({ page: 1, limit })
    const rows = [...first.data]
    for (let page = 2; page <= first.pagination.totalPages; page += 1) {
      const next = await this.listTaxes({ page, limit })
      rows.push(...next.data)
    }
    return rows
  },

  async createTax(payload: {
    rate: number
    categories: TaxCategoryAssignment[]
  }): Promise<TaxCharge> {
    const response = await taxClient.post('/taxes', payload)
    return unwrap<TaxCharge>(response.data)
  },

  async updateTax(
    id: string,
    payload: {
      rate: number
      isActive: boolean
      categories: TaxCategoryAssignment[]
    },
  ): Promise<TaxCharge> {
    const response = await taxClient.put(`/taxes/${id}`, payload)
    return unwrap<TaxCharge>(response.data)
  },

  async deleteTax(id: string): Promise<void> {
    await taxClient.delete(`/taxes/${id}`)
  },
}
