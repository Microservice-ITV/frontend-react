import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AuthPayload, RefreshTokenPayload } from './authTypes'
import { authService } from '@/services/authService'

// ================= LOGIN =================
export const login = createAsyncThunk<
    AuthPayload,
    { email: string; password: string },
    { rejectValue: string }
>('auth/login', async (data, { rejectWithValue }) => {
    try {
        const res = await authService.login(data)
        return res.data // { user, accessToken }
    } catch {
        return rejectWithValue('Login failed')
    }
})

// ================= REGISTER =================
export const register = createAsyncThunk<
    AuthPayload,
    { name: string; email: string; password: string },
    { rejectValue: string }
>('auth/register', async (data, { rejectWithValue }) => {
    try {
        const res = await authService.register(data)
        return res.data
    } catch {
        return rejectWithValue('Register failed')
    }
})

// ================= REFRESH ACCESS TOKEN (401 retry) =================
export const refreshAccessToken = createAsyncThunk<
    RefreshTokenPayload
>('auth/refreshAccessToken', async () => {
    const res = await authService.refresh()
    return { accessToken: res.data.accessToken }
})

// ================= REHYDRATE ON APP LOAD =================
export const rehydrateAuth = createAsyncThunk<
    AuthPayload,
    void,
    { rejectValue: string }
>('auth/rehydrate', async (_, { rejectWithValue }) => {
    try {
        const res = await authService.refresh()
        return res.data // { user, accessToken }
    } catch {
        return rejectWithValue('Session expired')
    }
})

// ================= LOGOUT =================
export const logout = createAsyncThunk('auth/logout', async () => {
    await authService.logout()
})