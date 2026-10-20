import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim()

export const isApiConfigured = Boolean(baseURL)

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}
