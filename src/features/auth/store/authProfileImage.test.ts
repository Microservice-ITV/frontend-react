import { configureStore } from '@reduxjs/toolkit'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthState, User } from '../types/authTypes'

const mocks = vi.hoisted(() => ({
  updateProfileImage: vi.fn(),
  removeProfileImage: vi.fn(),
}))

vi.mock('../api/authApi', () => ({
  authFeatureApi: {
    updateProfileImage: mocks.updateProfileImage,
    removeProfileImage: mocks.removeProfileImage,
  },
}))

import authReducer from './authSlice'
import { removeProfileImage, updateProfileImage } from './authThunks'

const buildUser = (profileImage: string | null): User => ({
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  profile_image: profileImage,
})

const buildState = (user: User | null): AuthState => ({
  user,
  accessToken: 'access-token',
  isAuthenticated: true,
  hasSession: true,
  initialized: true,
  status: 'succeeded',
  error: null,
  profileImageStatus: 'idle',
  profileImageError: null,
  requiresVerification: false,
  verificationEmail: null,
  loginDraft: { email: '', password: '' },
  registerDraft: { name: '', email: '', password: '' },
})

const createTestStore = (user: User | null = buildUser(null)) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: buildState(user) },
  })

const imageFile = () => new File(['binary'], 'avatar.jpg', { type: 'image/jpeg' })

describe('auth profile image state', () => {
  beforeEach(() => {
    mocks.updateProfileImage.mockReset()
    mocks.removeProfileImage.mockReset()
  })

  it('stores the uploaded URL in the central user state - no reload needed', async () => {
    mocks.updateProfileImage.mockResolvedValue({
      data: {
        data: {
          user: { profile_image: 'https://cdn.example.test/profile-images/new.webp' },
        },
      },
    })

    const store = createTestStore()

    await store.dispatch(updateProfileImage({ image: imageFile() }))

    expect(store.getState().auth.user?.profile_image).toBe(
      'https://cdn.example.test/profile-images/new.webp',
    )
    expect(store.getState().auth.profileImageStatus).toBe('succeeded')
    expect(store.getState().auth.profileImageError).toBeNull()
  })

  it('clears the image after it has been removed', async () => {
    mocks.removeProfileImage.mockResolvedValue({ data: { data: { user: { profile_image: null } } } })

    const store = createTestStore(buildUser('https://cdn.example.test/profile-images/old.webp'))

    await store.dispatch(removeProfileImage())

    expect(store.getState().auth.user?.profile_image).toBeNull()
    expect(store.getState().auth.profileImageStatus).toBe('succeeded')
  })

  it('surfaces the api validation error and keeps the stored image untouched', async () => {
    const message = 'The image must be a JPEG, PNG or WebP file.'

    mocks.updateProfileImage.mockRejectedValue(
      new AxiosError('Unprocessable Content', AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
        data: { message, errors: { profile_image: [message] } },
        status: 422,
        statusText: 'Unprocessable Content',
        headers: {},
        config: { headers: new AxiosHeaders() },
      } as AxiosResponse),
    )

    const store = createTestStore(buildUser('https://cdn.example.test/profile-images/keep.webp'))

    await store.dispatch(updateProfileImage({ image: imageFile() }))

    expect(store.getState().auth.profileImageStatus).toBe('failed')
    expect(store.getState().auth.profileImageError).toBe(message)
    expect(store.getState().auth.user?.profile_image).toBe(
      'https://cdn.example.test/profile-images/keep.webp',
    )
  })
})
