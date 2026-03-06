import { publicClient } from '@/lib/api/publicClient'
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
  getAll: () => publicClient.get<CategoriesApiResponse>('/categories'),
}