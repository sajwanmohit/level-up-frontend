import { apiClient, requireApiConfigured } from './client'
import { mapExercise } from './mappers'
import { getRequiredUserId } from './user'
import type { ApiExercise, ApiExerciseAnalytics, Exercise, ExerciseAnalytics } from '../types'

export async function getExercises(): Promise<Exercise[]> {
  requireApiConfigured()
  const { data } = await apiClient.get<ApiExercise[]>('/exercises')
  return data.map(mapExercise)
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const exercises = await getExercises()
  return exercises.find((exercise) => exercise.id === id) ?? null
}

export async function createExercise(input: {
  name: string
  description: string | null
  muscleGroup: string | null
  equipment: string | null
  movementType: string | null
  compound: boolean
}): Promise<Exercise> {
  requireApiConfigured()
  const { data } = await apiClient.post<ApiExercise>('/exercises', input)
  return mapExercise(data)
}

export async function getExerciseAnalytics(id: string): Promise<ExerciseAnalytics> {
  requireApiConfigured()
  const { data } = await apiClient.get<ApiExerciseAnalytics>(`/analytics/exercises/${encodeURIComponent(id)}`, {
    params: { userId: getRequiredUserId() },
  })
  return {
    sessions: data.summary.sessions,
    totalSets: data.summary.totalSets,
    totalVolume: data.summary.totalVolume,
    bestWeight: data.summary.bestWeight,
    bestReps: data.summary.bestReps,
    bestE1rm: data.summary.bestEstimatedOneRepMax,
    latestE1rm: data.summary.latestEstimatedOneRepMax,
    prCount: data.summary.prCount,
    strengthProgression: data.history.map((item) => ({ date: item.date, e1rm: item.estimatedOneRepMax })),
    volumeOverTime: data.history.map((item) => ({ label: item.date, volume: item.volume })),
  }
}
