import { apiClient, apiErrorMessage, requireApiConfigured } from './client'
import { mapApiSet, mapWorkout, mapWorkoutDetail, mapPersonalRecord } from './mappers'
import { getRequiredUserId } from './user'
import type { ApiSet, ApiWorkout, ApiWorkoutDetail, PersonalRecord, Workout } from '../types'

function workoutCalendarDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Workout date is invalid.')
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getWorkouts(): Promise<Workout[]> {
  requireApiConfigured()
  const { data } = await apiClient.get<ApiWorkout[]>('/workouts', {
    params: { userId: getRequiredUserId() },
  })
  return data.map(mapWorkout)
}

export async function getWorkout(id: string): Promise<Workout | null> {
  requireApiConfigured()
  const { data } = await apiClient.get<ApiWorkoutDetail>(`/workouts/${encodeURIComponent(id)}`)
  return mapWorkoutDetail(data)
}

export async function createWorkout(workout: Omit<Workout, 'id'>): Promise<Workout> {
  requireApiConfigured()
  const userId = getRequiredUserId()
  const startedAt = workout.startedAt ?? new Date(workout.date).toISOString()
  const workoutDate = workoutCalendarDate(workout.date)
  const { data: created } = await apiClient.post<ApiWorkout>('/workouts', {
    userId,
    workoutDate,
    startedAt,
    completedAt: null,
    name: workout.name,
    notes: workout.notes ?? null,
  })
  const records: PersonalRecord[] = []
  let operation = 'saving exercises and sets'
  try {
    for (const [index, entry] of workout.exercises.entries()) {
      const { data: sessionId } = await apiClient.post<string>(
        `/workouts/${encodeURIComponent(created.id)}/exercises`,
        { exerciseId: entry.exercise.id, exerciseOrder: index + 1, notes: null },
      )
      for (const set of entry.sets) {
        const { data: savedSet } = await apiClient.post<ApiSet>(
          `/exercise-sessions/${encodeURIComponent(sessionId)}/sets`,
          mapApiSet(set),
        )
        records.push(...savedSet.prs.map(mapPersonalRecord))
      }
    }

    operation = 'completing the workout'
    const completedAt = workout.completed ? new Date().toISOString() : null
    const { data: completed } = await apiClient.put<ApiWorkout>(
      `/workouts/${encodeURIComponent(created.id)}`,
      {
        userId,
        workoutDate,
        startedAt,
        completedAt,
        name: workout.name,
        notes: workout.notes ?? null,
      },
    )
    return { ...mapWorkout(completed), exercises: workout.exercises, personalRecords: records }
  } catch (error) {
    throw new Error(`Workout ${created.id} was created, but ${operation} failed: ${apiErrorMessage(error)}`, { cause: error })
  }
}

export async function completeWorkout(id: string): Promise<Workout | null> {
  requireApiConfigured()
  const current = await getWorkout(id)
  if (!current) return null
  const userId = getRequiredUserId()
  const { data } = await apiClient.put<ApiWorkout>(`/workouts/${encodeURIComponent(id)}`, {
    userId,
    workoutDate: current.date.slice(0, 10),
    startedAt: current.startedAt,
    completedAt: new Date().toISOString(),
    name: current.name,
    notes: current.notes ?? null,
  })
  return { ...mapWorkout(data), exercises: current.exercises }
}
