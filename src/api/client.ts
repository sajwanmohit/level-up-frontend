import axios from 'axios'

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080'
const normalizedBaseURL = configuredBaseURL.replace(/\/+$/, '')
const baseURL = normalizedBaseURL.endsWith('/api/v1')
  ? normalizedBaseURL
  : `${normalizedBaseURL}/api/v1`

export const isApiConfigured = Boolean(baseURL)

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export function requireApiConfigured(): void {
  if (!isApiConfigured) {
    throw new Error('The backend base URL is not configured.')
  }
}

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
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
