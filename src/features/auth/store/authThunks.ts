import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AxiosResponse } from 'axios'
import { authFeatureApi } from '../api/authApi'
import type { User, TokenPayload, AuthState } from '../types/authTypes'
import { markInitialized, setAccessToken, setHasSession } from './authSlice'
import { hasSessionCookie, setSessionCookie, clearSessionCookie } from '@/utils/session'
import axios from 'axios'
import { AUTH_SERVICE_BASE_URL } from '@/lib/api/apiConfig'

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


export const register = createAsyncThunk<
    TokenPayload,
    { name: string; email: string; password: string; recaptchaToken: string },
    { rejectValue: string | { requiresVerification: true; email: string } }
>('auth/register', async (data, { rejectWithValue }) => {
    try {
        const res = await authFeatureApi.register(data)
        const body = res.data?.data

        if (body?.requires_verification) {
            return rejectWithValue({
                requiresVerification: true,
                email: body.user?.email ?? data.email,
            })
        }

        applySessionCookieFromAuthResponse(res)
        return { accessToken: body.access_token }
    } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
            return rejectWithValue(err.response.data.message)
        }
        return rejectWithValue('We could not create your account with those details. Please check your information and try again.')
    }
})

export const requestPhoneOtp = createAsyncThunk<
    void,
    { phone: string; recaptchaToken?: string },
    { rejectValue: string }
>('auth/requestPhoneOtp', async (data, { rejectWithValue }) => {
    try {
        await authFeatureApi.requestPhoneOtp(data)
    } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
            return rejectWithValue(err.response.data.message)
        }
        return rejectWithValue('We could not send a verification code. Please try again.')
    }
})

export const verifyPhoneOtp = createAsyncThunk<
    TokenPayload,
    { phone: string; otp: string },
    { rejectValue: string }
>('auth/verifyPhoneOtp', async (data, { rejectWithValue }) => {
    try {
        const res = await authFeatureApi.verifyPhoneOtp(data)
        applySessionCookieFromAuthResponse(res)
        return { accessToken: res.data.data.access_token }
    } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
            return rejectWithValue(err.response.data.message)
        }
        return rejectWithValue('The verification code is invalid or expired.')
    }
})


type FetchMeReject = 'SKIP' | 'API_ERROR'

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


export const refreshAccessToken = createAsyncThunk<
    string | null,
    void,
    { state: { auth: AuthState } }
>('auth/refresh', async (_, { dispatch }) => {
    try {
        const res = await authFeatureApi.refresh()
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
        }
    }
)


export const verifyEmail = createAsyncThunk<
    { message: string },
    { token: string },
    { rejectValue: string }
>('auth/verifyEmail', async ({ token }, { rejectWithValue }) => {
    try {
        const res = await authFeatureApi.verifyEmail(token)
        return { message: res.data?.message ?? 'Email verified successfully' }
    } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
            return rejectWithValue(err.response.data.message)
        }
        return rejectWithValue('Verification failed. Please try again.')
    }
})


export const resendVerification = createAsyncThunk<
    { message: string },
    { email: string },
    { rejectValue: string }
>('auth/resendVerification', async ({ email }, { rejectWithValue }) => {
    try {
        const res = await authFeatureApi.resendVerification(email)
        return { message: res.data?.message ?? 'Verification code resent' }
    } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
            return rejectWithValue(err.response.data.message)
        }
        return rejectWithValue('Failed to resend code. Please try again.')
    }
})


export const forgotPassword = createAsyncThunk<
    { message: string },
    { email: string },
    { rejectValue: string }
>('auth/forgotPassword', async ({ email }, { rejectWithValue }) => {
    try {
        const res = await authFeatureApi.forgotPassword(email)
        return { message: res.data?.message ?? 'Password reset code sent' }
    } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
            return rejectWithValue(err.response.data.message)
        }
        return rejectWithValue('We could not process your request. Please try again.')
    }
})


export const resetPassword = createAsyncThunk<
    { message: string },
    { token: string; password: string; passwordConfirmation: string },
    { rejectValue: string }
>('auth/resetPassword', async ({ token, password, passwordConfirmation }, { rejectWithValue }) => {
    try {
        const res = await authFeatureApi.resetPassword({ token, password, passwordConfirmation })
        return { message: res.data?.message ?? 'Password reset successfully' }
    } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
            return rejectWithValue(err.response.data.message)
        }
        return rejectWithValue('Failed to reset password. Please try again.')
    }
})


export const changePassword = createAsyncThunk<
    { message: string },
    { currentPassword: string; newPassword: string; newPasswordConfirmation: string },
    { rejectValue: string }
>('auth/changePassword', async ({ currentPassword, newPassword, newPasswordConfirmation }, { rejectWithValue }) => {
    try {
        const res = await authFeatureApi.changePassword({ currentPassword, newPassword, newPasswordConfirmation })
        return { message: res.data?.message ?? 'Password changed successfully' }
    } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
            return rejectWithValue(err.response.data.message)
        }
        return rejectWithValue('Failed to change password. Please try again.')
    }
})


export const bootstrapAuth = createAsyncThunk(
    'auth/bootstrap',
    async (_, { dispatch }) => {
        dispatch(setHasSession(hasSessionCookie()))
        await dispatch(refreshAccessToken())
        dispatch(markInitialized())
    }
)
