import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMocks = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('./client', () => ({
  apiClient: { post: apiMocks.post },
  isApiConfigured: true,
}))

import {
  clearAuthenticatedSession,
  getAccessToken,
  isAuthenticated,
  login,
  setAuthenticatedSession,
  signup,
} from './auth'

const user = { id: 'user-id', name: 'Taylor Athlete', email: 'taylor@example.com' }

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  localStorage.clear()
})

describe('authentication API', () => {
  it('signs up using the backend contract and accepts an empty success body', async () => {
    apiMocks.post.mockResolvedValue({ status: 201, data: undefined })

    await expect(signup({ name: 'Taylor Athlete', email: 'taylor@example.com', password: 'secure-pass' }))
      .resolves.toBeUndefined()
    expect(apiMocks.post).toHaveBeenCalledWith('/auth/signup', {
      name: 'Taylor Athlete',
      email: 'taylor@example.com',
      password: 'secure-pass',
    })
  })

  it('returns the exact user and token from login', async () => {
    const response = { user, accessToken: 'backend-token' }
    apiMocks.post.mockResolvedValue({ data: response })

    await expect(login({ email: user.email, password: 'secure-pass' })).resolves.toEqual(response)
    expect(apiMocks.post).toHaveBeenCalledWith('/auth/login', { email: user.email, password: 'secure-pass' })
  })

  it('rejects malformed login responses', async () => {
    apiMocks.post.mockResolvedValue({ data: { user, accessToken: '' } })

    await expect(login({ email: user.email, password: 'secure-pass' })).rejects.toThrow(
      'The authentication response is missing a valid user or access token.',
    )
  })

  it('stores the identity and access token only for the current browser session', () => {
    setAuthenticatedSession({ user, accessToken: 'backend-token' })

    expect(getAccessToken()).toBe('backend-token')
    expect(isAuthenticated()).toBe(true)
    expect(sessionStorage.getItem('level-up.active-user')).not.toBeNull()
    expect(localStorage.getItem('level-up.active-user')).toBeNull()

    clearAuthenticatedSession()
    expect(getAccessToken()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })
})
