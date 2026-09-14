import { createSlice } from '@reduxjs/toolkit'
import type { HomeQuickActionsState } from './homeTypes'
import { fetchHomeQuickActions } from './homeThunks'

const initialState: HomeQuickActionsState = {
  items: [],
  status: 'idle',
  error: null,
}

const homeQuickActionsSlice = createSlice({
  name: 'homeQuickActions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeQuickActions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchHomeQuickActions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchHomeQuickActions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? 'Failed to load home features'
      })
  },
})

export default homeQuickActionsSlice.reducer