// Slice => State & Reducers
import { createSlice } from '@reduxjs/toolkit'
import { login, register, fetchMe, refreshAccessToken, logout, bootstrapAuth } from './authThunks'
import type { AuthState } from './authTypes'

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  hasSession: false,
  initialized: false,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setHasSession(state, action) {
      state.hasSession = action.payload
    },

    markInitialized(state) {
      state.initialized = true
    },

    setAccessToken(state, action) {
      state.accessToken = action.payload
      state.isAuthenticated = Boolean(action.payload)
    },

    forceLogout(state) {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.hasSession = false
    },
  },
  extraReducers: (builder) => {
    builder
      // ================= LOGIN =================
      .addCase(login.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(login.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
        state.hasSession = true
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
        state.hasSession = true
      })

      // ================= FETCH USER =================
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
      })

      // ================= REFRESH TOKEN =================
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload
        state.isAuthenticated = Boolean(action.payload)
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.accessToken = null
        state.isAuthenticated = false
      })

      // ================= LOGOUT =================
      .addCase(logout.fulfilled, (state) => {
        return {
          ...initialState,
          hasSession: false,
        }
      })

      // ================= AUTH BOOTSTRAP =================
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(bootstrapAuth.fulfilled, (state) => {
        state.status = 'succeeded'
        state.initialized = true
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.initialized = true
      })
  },
})

export const { setHasSession, markInitialized, setAccessToken } = authSlice.actions
export default authSlice.reducer