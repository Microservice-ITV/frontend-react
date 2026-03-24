import { RootState } from '@/app/store'

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated

export const selectAuthUser = (state: RootState) => state.auth.user

export const selectAuthStatus = (state: RootState) => state.auth.status

export const selectAuthInitialized = (state: RootState) => state.auth.initialized

export const selectIsAuthBootstrapping = (state: RootState) =>
  !state.auth.initialized || state.auth.status === 'loading'