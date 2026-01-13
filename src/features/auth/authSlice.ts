import { createSlice } from '@reduxjs/toolkit'
import { login, register, fetchMe, refreshAccessToken, logout } from './authThunks'
import type { AuthState } from './authTypes'

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ================= LOGIN =================
      .addCase(login.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(login.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
        state.status = 'succeeded'
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Login failed'
      })

      // ================= REGISTER =================
      .addCase(register.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
      })

      // ================= FETCH USER =================
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
      })

      // ================= REFRESH TOKEN =================
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
      })

      // ================= LOGOUT =================
      .addCase(logout.fulfilled, () => initialState)
  },
})

export default authSlice.reducer