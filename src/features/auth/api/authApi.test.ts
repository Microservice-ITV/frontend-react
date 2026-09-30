import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PROFILE_IMAGE_FIELD } from '../constants/profileImage'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/lib/api/authClient', () => ({ authClient: mocks }))

import { authFeatureApi } from './authApi'

const registerPayload = {
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  password: 'secret-password',
  recaptchaToken: 'recaptcha-token',
}

describe('authFeatureApi.register', () => {
  beforeEach(() => {
    mocks.post.mockReset()
    mocks.post.mockResolvedValue({ data: { data: {} } })
  })

  it('keeps sending plain JSON when no profile image is selected', async () => {
    await authFeatureApi.register(registerPayload)

    expect(mocks.post).toHaveBeenCalledTimes(1)

    const [url, body] = mocks.post.mock.calls[0]

    expect(url).toBe('/register')
    expect(body).toEqual(registerPayload)
    expect(body).not.toBeInstanceOf(FormData)
  })

  it('sends multipart form data when a profile image is selected', async () => {
    const image = new File(['binary'], 'avatar.jpg', { type: 'image/jpeg' })

    await authFeatureApi.register({ ...registerPayload, profileImage: image })

    const [url, body] = mocks.post.mock.calls[0]

    expect(url).toBe('/register')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get(PROFILE_IMAGE_FIELD)).toBe(image)
    expect((body as FormData).get('email')).toBe(registerPayload.email)
    expect((body as FormData).get('password')).toBe(registerPayload.password)
    expect((body as FormData).get('recaptchaToken')).toBe(registerPayload.recaptchaToken)
  })
})

describe('authFeatureApi profile image endpoints', () => {
  beforeEach(() => {
    mocks.post.mockReset()
    mocks.delete.mockReset()
    mocks.post.mockResolvedValue({ data: { data: {} } })
    mocks.delete.mockResolvedValue({ data: { data: {} } })
  })

  it('uploads the selected file under the documented multipart field', async () => {
    const image = new File(['binary'], 'avatar.png', { type: 'image/png' })

    await authFeatureApi.updateProfileImage(image)

    const [url, body] = mocks.post.mock.calls[0]

    expect(url).toBe('/profile/image')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get(PROFILE_IMAGE_FIELD)).toBe(image)
  })

  it('deletes the stored image', async () => {
    await authFeatureApi.removeProfileImage()

    expect(mocks.delete).toHaveBeenCalledWith('/profile/image')
  })
})
