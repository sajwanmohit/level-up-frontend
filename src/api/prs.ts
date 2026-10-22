import { apiClient, requireApiConfigured } from './client'
import { mapPersonalRecord } from './mappers'
import { getRequiredUserId } from './user'
import type { ApiPersonalRecord, PersonalRecord } from '../types'

export async function getPRs(): Promise<PersonalRecord[]> {
  requireApiConfigured()
  const { data } = await apiClient.get<ApiPersonalRecord[]>('/prs', {
    params: { userId: getRequiredUserId() },
  })
  return data.map(mapPersonalRecord)
}

export async function getExercisePRs(exerciseId: string): Promise<PersonalRecord[]> {
  requireApiConfigured()
  const { data } = await apiClient.get<ApiPersonalRecord[]>(
    `/prs/exercises/${encodeURIComponent(exerciseId)}`,
    { params: { userId: getRequiredUserId() } },
  )
  return data.map(mapPersonalRecord)
}
