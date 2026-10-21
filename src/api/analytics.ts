import { apiClient, requireApiConfigured } from './client'
import { getRequiredUserId } from './user'
import type { ApiDailyAnalytics, ApiDashboardAnalytics } from '../types'

export async function getDashboardAnalytics(): Promise<ApiDashboardAnalytics> {
  requireApiConfigured()
  const { data } = await apiClient.get<ApiDashboardAnalytics>('/analytics/dashboard', {
    params: { userId: getRequiredUserId() },
  })
  return data
}

export async function getDailyAnalytics(workoutId: string): Promise<ApiDailyAnalytics> {
  requireApiConfigured()
  const { data } = await apiClient.get<ApiDailyAnalytics>('/analytics/daily', {
    params: { workoutId },
  })
  return data
}
