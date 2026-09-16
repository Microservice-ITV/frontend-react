import { createSlice } from '@reduxjs/toolkit'
import type { AdminUsersState } from '../types/userTypes'
import { fetchAdminUsers, assignAdminUserRole } from './adminUsersThunks'

const initialState: AdminUsersState = {
  users: [],
  total: 0,
  lastPage: 1,
  status: 'idle',
  error: null,
}

const adminUsersSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ── fetchAdminUsers ──────────────────────────────────────────────────
      .addCase(fetchAdminUsers.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.users = action.payload.users
        state.total = action.payload.total
        state.lastPage = action.payload.lastPage
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.users = []
        state.error = (action.payload as string) ?? 'Unable to load users right now.'
      })

      // ── assignAdminUserRole ──────────────────────────────────────────────
      // Role assignment is lightweight: we don't touch user list state here;
      // the page re-fetches after a successful assignment via the modal callback.
      .addCase(assignAdminUserRole.rejected, (_state, _action) => {
        // Error is surfaced through the modal's onPrimary rejection path.
      })
  },
})

export default adminUsersSlice.reducer
