import axios from 'axios'
import { clearAuthenticatedSession, getAccessToken } from './auth'

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080'
const normalizedBaseURL = configuredBaseURL.replace(/\/+$/, '')
const baseURL = normalizedBaseURL.endsWith('/api/v1')
  ? normalizedBaseURL
  : `${normalizedBaseURL}/api/v1`

export const isApiConfigured = Boolean(baseURL)

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  const isPublicAuthRequest = config.url === '/auth/signup' || config.url === '/auth/login'
  if (token && !isPublicAuthRequest) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error)
      && error.response?.status === 401
    ) {
      clearAuthenticatedSession()
    }
    return Promise.reject(error)
  },
)

export function requireApiConfigured(): void {
  if (!isApiConfigured) {
    throw new Error('The backend base URL is not configured.')
  }
}

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return "You don't have permission to access this resource."
    }
    const responseMessage = error.response?.data
      && typeof error.response.data === 'object'
      && 'message' in error.response.data
      && typeof error.response.data.message === 'string'
      ? error.response.data.message
      : null
    return responseMessage ?? error.message
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

export function isApiNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}
