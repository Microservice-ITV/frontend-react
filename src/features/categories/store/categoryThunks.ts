import { createAsyncThunk } from '@reduxjs/toolkit'
import { productApi } from '@/features/products/api/productApi'
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

export const fetchCategories = createAsyncThunk<Category[]>(
    'categories/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await productApi.get<CategoriesApiResponse>('/categories')
            // Extract the data array from the API response structure
            return response.data.data
        } catch (error: any) {
            const message =
                error?.response?.data?.message || error.message || 'Failed to load categories'
            return rejectWithValue(message)
        }
    }
)