// Thunks => Async Business Logic
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AxiosResponse } from 'axios'
import { authFeatureApi } from '../api/authApi'
import type { User, TokenPayload, AuthState } from '../types/authTypes'
import { markInitialized, setAccessToken, setHasSession } from './authSlice'
import { hasSessionCookie, setSessionCookie, clearSessionCookie } from '@/utils/session'
import axios from 'axios'
import { AUTH_SERVICE_BASE_URL } from '@/lib/api/apiConfig'

/** Pull refresh TTL hint from auth-service JSON — canonical policy lives there (`JWT_REFRESH_TTL`). */
const refreshTtlSecondsFromAuthResponse = (res: AxiosResponse<{ data?: { refresh_ttl_seconds?: unknown } }>): number | undefined => {
    const raw = res.data?.data?.refresh_ttl_seconds
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return Math.floor(raw)
    if (typeof raw === 'string') {
        const n = Number.parseInt(raw, 10)
        if (Number.isFinite(n) && n > 0) return n
    }
    return undefined
}

const applySessionCookieFromAuthResponse = (res: AxiosResponse<{ data?: { refresh_ttl_seconds?: unknown } }>): void => {
    const sec = refreshTtlSecondsFromAuthResponse(res)
    setSessionCookie(sec)
}

// ============== LOGIN Backend returns ONLY access_token =================
export const login = createAsyncThunk<
    TokenPayload,
    { email: string; password: string; recaptchaToken: string },
    { rejectValue: string }
>('auth/login', async (data, { rejectWithValue }) => {
    try {
        const res = await authFeatureApi.login(data)
        applySessionCookieFromAuthResponse(res)
        return { accessToken: res.data.data.access_token }
    } catch {
        return rejectWithValue('Your email and/or password is incorrect. Please try again.')
    }
})


// ============== REGISTER Same response shape as login =================
export const register = createAsyncThunk<
    TokenPayload,
    { name: string; email: string; password: string; recaptchaToken: string },
    { rejectValue: string }
>('auth/register', async (data, { rejectWithValue }) => {
    try {
        const res = await authFeatureApi.register(data)
        applySessionCookieFromAuthResponse(res)
        return {
            accessToken: res.data.data.access_token,
        }
    } catch {
        return rejectWithValue('We could not create your account with those details. Please check your information and try again.')
    }
})


type FetchMeReject = 'SKIP' | 'API_ERROR'

// ============== FETCH AUTHENTICATED | Uses Authorization header =================
export const fetchMe = createAsyncThunk<
    User,
    void,
    { state: { auth: AuthState }; rejectValue: FetchMeReject }
>('auth/me', async (_, { getState, rejectWithValue }) => {
    const { accessToken, hasSession } = getState().auth

    if (!accessToken || !hasSession) {
        return rejectWithValue('SKIP')
    }

    try {
        const res = await authFeatureApi.me()
        return res.data.data.user
    } catch {
        clearSessionCookie()
        return rejectWithValue('API_ERROR')
    }
})


// ============== REFRESH ACCESS TOKEN | Called automatically on 401 =================
export const refreshAccessToken = createAsyncThunk<
    string | null,
    void,
    { state: { auth: AuthState } }
>('auth/refresh', async (_, { dispatch }) => {
    // Always call the API; backend returns 204 when no/invalid refresh_token cookie.
    // This way we don't depend on has_session cookie (which may expire before refresh_token).
    try {
        const res = await authFeatureApi.refresh()
        // Backend returns 204 (no body) when refresh_token cookie is missing or invalid
        const accessToken = res.data?.data?.access_token

        if (!accessToken) {
            clearSessionCookie()
            dispatch(setHasSession(false))
            return null
        }

        applySessionCookieFromAuthResponse(res)
        dispatch(setAccessToken(accessToken))
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
        dispatch(setHasSession(hasSessionCookie()))

        // Always try refresh on load; backend returns 200 with token if refresh_token
        // cookie is valid, 204 if missing/invalid. Stops relying on has_session cookie
        // which may have a shorter TTL than refresh_token (e.g. 1h vs 7 days).
        await dispatch(refreshAccessToken())

        dispatch(markInitialized())
    }
)
