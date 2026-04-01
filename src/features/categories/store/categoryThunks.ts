import { createAsyncThunk } from '@reduxjs/toolkit'
import { categoryApi } from '../api/categoryApi'
import type { Category } from '../types/categoryTypes'

export const fetchCategories = createAsyncThunk<Category[], void, {rejectValue: string}>(
    'categories/fetchCategories',
    async (_, { rejectWithValue }) => { // "_" => no argument is passed
        try {
            const response = await categoryApi.getAll()
            const payload = response.data
            return payload.data ?? payload.items ?? []
        } catch (error: any) {
            const message = error?.response?.data?.message || error.message || 'Failed to load categories'
            return rejectWithValue(message)
        }
    }
)