import { RootState } from '@/app/store'

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated

export const selectAuthUser = (state: RootState) => state.auth.user

export const selectAuthStatus = (state: RootState) => state.auth.status