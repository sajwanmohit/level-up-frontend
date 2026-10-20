import { apiClient, isApiConfigured } from './client'
import { demoStore } from './demoStore'
import { mapPersonalRecord } from './mappers'
import { getRequiredUserId } from './user'
import type { ApiPersonalRecord, PersonalRecord } from '../types'

export async function getPRs(): Promise<PersonalRecord[]> {
  if (!isApiConfigured) return demoStore.personalRecords()
  const { data } = await apiClient.get<ApiPersonalRecord[]>('/prs', {
    params: { userId: getRequiredUserId() },
  })
  return data.map(mapPersonalRecord)
}
