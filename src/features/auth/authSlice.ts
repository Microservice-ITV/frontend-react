import { createSlice } from '@reduxjs/toolkit'
import {
    login,
    register,
    logout,
    refreshAccessToken,
    rehydrateAuth,
} from './authThunks'
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
            // ===== LOGIN =====
            .addCase(login.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(login.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.user = action.payload.user
                state.accessToken = action.payload.accessToken
                state.isAuthenticated = true
            })
            .addCase(login.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.payload ?? 'Login failed'
            })

            // ===== REGISTER =====
            .addCase(register.fulfilled, (state, action) => {
                state.user = action.payload.user
                state.accessToken = action.payload.accessToken
                state.isAuthenticated = true
            })

            // ===== REHYDRATE (APP LOAD) =====
            .addCase(rehydrateAuth.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(rehydrateAuth.fulfilled, (state, action) => {
                state.user = action.payload.user
                state.accessToken = action.payload.accessToken
                state.isAuthenticated = true
                state.status = 'succeeded'
            })
            .addCase(rehydrateAuth.rejected, (state) => {
                state.status = 'idle'
                state.user = null
                state.accessToken = null
                state.isAuthenticated = false
            })

            // ===== REFRESH ACCESS TOKEN (401) =====
            .addCase(refreshAccessToken.fulfilled, (state, action) => {
                state.accessToken = action.payload.accessToken
            })

            // ===== LOGOUT =====
            .addCase(logout.fulfilled, () => initialState)
    },
})

export default authSlice.reducer