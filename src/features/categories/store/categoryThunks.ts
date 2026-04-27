import { createAsyncThunk } from '@reduxjs/toolkit'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { categoryApi } from '../api/categoryApi'
import type { Category } from '../types/categoryTypes'

export const fetchCategories = createAsyncThunk<Category[], void, {rejectValue: string}>(
    'categories/fetchCategories',
    async (_, { rejectWithValue }) => { // "_" => no argument is passed
        try {
            const response = await categoryApi.getAll()
            const payload = response.data
            const list = payload.data ?? payload.items ?? []
            return list.map((c) => ({
                ...c,
                image: c.image ? productServiceAssetUrl(c.image) : c.image,
            }))
        } catch (error: any) {
            const message = error?.response?.data?.message || error.message || 'Failed to load categories'
            return rejectWithValue(message)
        }
    }
)