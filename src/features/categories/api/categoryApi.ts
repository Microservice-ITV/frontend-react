import { publicApi } from '@/lib/api/publicApi'
import type { Category } from '../types/categoryTypes'

interface CategoriesApiResponse {
    success: boolean
    data: Category[]
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export const categoryApi = {
  getAll: () => publicApi.get<CategoriesApiResponse>('/categories'),
}