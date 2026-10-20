import { apiClient, isApiConfigured } from './client'
import { demoStore } from './demoStore'
import { getRequiredUserId } from './user'
import type { AnalyticsSummary, ApiDailyAnalytics, ApiDashboardAnalytics, DashboardAnalytics } from '../types'

export async function getDashboardAnalytics(): Promise<DashboardAnalytics | ApiDashboardAnalytics> {
  if (!isApiConfigured) return demoStore.dashboardAnalytics()
  const { data } = await apiClient.get<ApiDashboardAnalytics>('/analytics/dashboard', {
    params: { userId: getRequiredUserId() },
  })
  return data
}

export async function getAnalytics(range: string, exerciseId?: string): Promise<AnalyticsSummary> {
  if (!isApiConfigured) return demoStore.analytics()
  void range
  void exerciseId
  throw new Error('Choose a completed workout to view daily analytics.')
}

export async function getDailyAnalytics(workoutId: string): Promise<ApiDailyAnalytics> {
  const { data } = await apiClient.get<ApiDailyAnalytics>('/analytics/daily', {
    params: { workoutId },
  })
  return data
}
