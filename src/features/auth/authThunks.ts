import { createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '@/services/authService'
import type { User, TokenPayload } from './authTypes'

// ============== LOGIN Backend returns ONLY access_token =================
export const login = createAsyncThunk<
    TokenPayload,
    { email: string; password: string },
    { rejectValue: string }
>('auth/login', async (data, { rejectWithValue }) => {
    try {
        const res = await authService.login(data)

        return {
            accessToken: res.data.data.access_token,
        }
    } catch {
        return rejectWithValue('Invalid credentials')
    }
})


// ============== REGISTER Same response shape as login =================
export const register = createAsyncThunk<
    TokenPayload,
    { name: string; email: string; password: string; recaptchaToken: string },
    { rejectValue: string }
>('auth/register', async (data, { rejectWithValue }) => {
    try {
        const res = await authService.register(data)

        return {
            accessToken: res.data.data.access_token,
        }
    } catch {
        return rejectWithValue('Registration failed')
    }
})


// ============== FETCH AUTHENTICATED | Uses Authorization header =================
export const fetchMe = createAsyncThunk<User>(
    'auth/me',
    async () => {
        const res = await authService.me()
        return res.data.data.user
    }
)


// ============== REFRESH ACCESS TOKEN | Called automatically on 401 =================
export const refreshAccessToken = createAsyncThunk<TokenPayload>(
    'auth/refresh',
    async () => {
        const res = await authService.refresh()

        return {
            accessToken: res.data.data.access_token,
        }
    }
)


// ============== LOGOUT | Invalidates token server-side =================
export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        await authService.logout()
    }
)
