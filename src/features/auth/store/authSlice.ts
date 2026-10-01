import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { login, register, requestPhoneOtp, verifyPhoneOtp, fetchMe, refreshAccessToken, logout, bootstrapAuth, verifyEmail, resendVerification, updateProfileImage, removeProfileImage } from './authThunks'
import type { AuthState } from '../types/authTypes'

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  hasSession: false,
  initialized: false,
  status: 'idle',
  error: null,
  profileImageStatus: 'idle',
  profileImageError: null,
  requiresVerification: false,
  verificationEmail: null,
  loginDraft: {
    email: '',
    password: '',
  },
  registerDraft: {
    name: '',
    email: '',
    password: '',
  },
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

    setLoginDraft(state, action: PayloadAction<{ email: string; password: string }>) {
      state.loginDraft = action.payload
    },

    setRegisterDraft(
      state,
      action: PayloadAction<{ name: string; email: string; password: string }>
    ) {
      state.registerDraft = action.payload
    },

    forceLogout(state) {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.hasSession = false
      state.initialized = true
      state.status = 'idle'
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
        state.loginDraft = { email: '', password: '' }
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
        state.registerDraft = { name: '', email: '', password: '' }
      })
      .addCase(register.rejected, (state, action) => {
        const payload = action.payload
        if (payload && typeof payload === 'object' && 'requiresVerification' in payload) {
          state.requiresVerification = true
          state.verificationEmail = payload.email
          state.status = 'succeeded'
          state.registerDraft = { name: '', email: '', password: '' }
          state.error = null
        } else {
          state.status = 'failed'
          state.error = typeof payload === 'string' ? payload : 'Registration failed'
        }
      })

      .addCase(requestPhoneOtp.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(requestPhoneOtp.fulfilled, (state) => {
        state.status = 'succeeded'
      })
      .addCase(requestPhoneOtp.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Could not send verification code'
      })
      .addCase(verifyPhoneOtp.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
        state.hasSession = true
        state.status = 'succeeded'
        state.error = null
      })
      .addCase(verifyPhoneOtp.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Verification failed'
      })

      // ================= VERIFY EMAIL =================
      .addCase(verifyEmail.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.requiresVerification = false
        state.verificationEmail = null
        state.status = 'succeeded'
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Verification failed'
      })

      // ================= RESEND VERIFICATION =================
      .addCase(resendVerification.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.status = 'succeeded'
      })
      .addCase(resendVerification.rejected, (state) => {
        state.status = 'failed'
      })

      // ================= FETCH USER =================
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state, action) => {
        if (action.payload !== 'API_ERROR') return
        state.user = null
        state.accessToken = null
        state.isAuthenticated = false
        state.hasSession = false
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
          initialized: true,
          status: 'idle',
        }
      })

      // ================= PROFILE IMAGE =================
      // The single source of truth for the photo is state.auth.user, so the
      // avatar updates everywhere at once - no reload and no duplicate state.
      .addCase(updateProfileImage.pending, (state) => {
        state.profileImageStatus = 'loading'
        state.profileImageError = null
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.profileImageStatus = 'succeeded'
        state.profileImageError = null

        if (state.user) state.user.profile_image = action.payload
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.profileImageStatus = 'failed'
        state.profileImageError = action.payload ?? 'We could not update your profile photo.'
      })

      .addCase(removeProfileImage.pending, (state) => {
        state.profileImageStatus = 'loading'
        state.profileImageError = null
      })
      .addCase(removeProfileImage.fulfilled, (state) => {
        state.profileImageStatus = 'succeeded'
        state.profileImageError = null

        if (state.user) state.user.profile_image = null
      })
      .addCase(removeProfileImage.rejected, (state, action) => {
        state.profileImageStatus = 'failed'
        state.profileImageError = action.payload ?? 'We could not remove your profile photo.'
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

export const {
  setHasSession,
  markInitialized,
  setAccessToken,
  setLoginDraft,
  setRegisterDraft,
} = authSlice.actions
export default authSlice.reducer
