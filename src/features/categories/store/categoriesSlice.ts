import { createSlice } from '@reduxjs/toolkit'
import type { CategoriesState } from '../types/categoryTypes'
import { fetchCategories } from './categoryThunks'

const initialState: CategoriesState = {
    items: [],
    status: 'idle',
    error: null,
}

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.items = action.payload
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.status = 'failed'
                state.error = (action.payload as string) ?? 'Failed to load categories'
            })
    },
})

export default categorySlice.reducer