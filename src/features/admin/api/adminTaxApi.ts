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

  async listTaxes(): Promise<TaxCharge[]> {
    const response = await taxClient.get('/taxes')
    return unwrap<TaxCharge[]>(response.data)
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
