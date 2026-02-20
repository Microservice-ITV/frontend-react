// Thunks => Async Business Logic
import { createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '@/services/authService'
import type { User, TokenPayload, AuthState } from './authTypes'
import { markInitialized, setHasSession } from './authSlice'
import { hasSessionCookie, setSessionCookie, clearSessionCookie } from '@/utils/session'
import axios from 'axios'
import { AUTH_SERVICE_BASE_URL } from '@/lib/api/apiConfig'

// ============== LOGIN Backend returns ONLY access_token =================
export const login = createAsyncThunk<
    TokenPayload,
    { email: string; password: string; recaptchaToken: string },
    { rejectValue: string }
>('auth/login', async (data, { dispatch, rejectWithValue }) => {
    try {
        const res = await authService.login(data)
        setSessionCookie()
        return { accessToken: res.data.data.access_token }
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
        setSessionCookie()
        return {
            accessToken: res.data.data.access_token,
        }
    } catch {
        return rejectWithValue('Registration failed')
    }
})


// ============== FETCH AUTHENTICATED | Uses Authorization header =================
export const fetchMe = createAsyncThunk<
    User,
    void,
    { state: { auth: AuthState } }
>('auth/me', async (_, { getState, rejectWithValue }) => {
    const { accessToken, hasSession } = getState().auth

    if (!accessToken || !hasSession) {
        return rejectWithValue(null)
    }

    const res = await authService.me()
    return res.data.data.user
})


// ============== REFRESH ACCESS TOKEN | Called automatically on 401 =================
export const refreshAccessToken = createAsyncThunk<
    string | null,
    void,
    { state: { auth: AuthState } }
>('auth/refresh', async (_, { getState, dispatch }) => {
    const { hasSession } = getState().auth

    // NO SESSION → DO NOTHING (expected on first load)
    if (!hasSession) {
        return null
    }

    try {
        const res = await authService.refresh()
        const accessToken = res.data.data.access_token

        if (!accessToken) {
            return null
        }

        setSessionCookie()
        dispatch(fetchMe())

        return accessToken
    } catch {
        clearSessionCookie()
        dispatch(setHasSession(false))
        return null
    }
})


// ============== LOGOUT | Invalidates token server-side =================
// MUST bypass authApi to avoid interceptor loop
export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        clearSessionCookie()
        try {
            await axios.post(
                `${AUTH_SERVICE_BASE_URL}/logout`,
                {},
                {
                    withCredentials: true,
                    validateStatus: (status) => status === 200 || status === 401,
                }
            )
        } catch {
            // swallow errors — logout must NEVER fail the app
        }
    }
)


// ============== Bootstrap auth on app load =================
export const bootstrapAuth = createAsyncThunk(
    'auth/bootstrap',
    async (_, { dispatch }) => {
        const hasSession = hasSessionCookie()

        dispatch(setHasSession(hasSession))

        if (hasSession) {
            await dispatch(refreshAccessToken())
        }

        dispatch(markInitialized())
    }
)