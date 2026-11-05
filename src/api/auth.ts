import { apiClient } from './client'
import { clearActiveUser, getActiveUser, setActiveUser, type UserProfile } from './user'

const ACCESS_TOKEN_KEY = 'level-up.access-token'

export type AuthResponse = {
  user: UserProfile
  accessToken: string
}

export type SignupInput = Pick<UserProfile, 'name' | 'email'> & { password: string }
export type LoginInput = Pick<UserProfile, 'email'> & { password: string }

export async function signup(input: SignupInput): Promise<void> {
  await apiClient.post('/auth/signup', input)
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await apiClient.post<unknown>('/auth/login', input)
  if (!isAuthResponse(data)) {
    throw new Error('The authentication response is missing a valid user or access token.')
  }
  return data
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAuthenticatedSession(response: AuthResponse): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
  setActiveUser(response.user)
}

export function clearAuthenticatedSession(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  clearActiveUser()
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken() && getActiveUser())
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (typeof value !== 'object' || value === null || !('user' in value) || !('accessToken' in value)) {
    return false
  }
  const user = value.user
  return typeof value.accessToken === 'string'
    && value.accessToken.length > 0
    && typeof user === 'object'
    && user !== null
    && 'id' in user && typeof user.id === 'string'
    && 'name' in user && typeof user.name === 'string'
    && 'email' in user && typeof user.email === 'string'
}
