import { apiClient, apiErrorMessage, requireApiConfigured } from './client'
import { mapApiSet, mapWorkout, mapWorkoutDetail, mapPersonalRecord } from './mappers'
import { getRequiredUserId } from './user'
import type {
  ApiSet,
  ApiWorkout,
  ApiWorkoutDetail,
  CreateExerciseSessionRequest,
  CreateWorkoutRequest,
  PersonalRecord,
  SetEntry,
  SetRequest,
  Workout,
  WorkoutExercise,
} from '../types'

function workoutCalendarDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Workout date is invalid.')
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getWorkouts(dateRange?: { from: string; to: string }): Promise<Workout[]> {
  requireApiConfigured()
  if (dateRange && (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateRange.from)
    || !/^\d{4}-\d{2}-\d{2}$/.test(dateRange.to)
    || dateRange.to < dateRange.from
  )) {
    throw new Error('Workout date range must use YYYY-MM-DD and "to" cannot precede "from".')
  }
  const { data } = await apiClient.get<ApiWorkout[]>('/workouts', {
    params: {
      userId: getRequiredUserId(),
      ...(dateRange ? { from: dateRange.from, to: dateRange.to } : {}),
    },
  })
  return data.map(mapWorkout)
}

export async function getWorkout(id: string): Promise<Workout | null> {
  requireApiConfigured()
  const { data } = await apiClient.get<ApiWorkoutDetail>(`/workouts/${encodeURIComponent(id)}`)
  return mapWorkoutDetail(data)
}

export async function addExerciseToWorkout(
  workoutId: string,
  input: CreateExerciseSessionRequest,
): Promise<string> {
  requireApiConfigured()
  const { data } = await apiClient.post<string>(
    `/workouts/${encodeURIComponent(workoutId)}/exercises`,
    input,
  )
  return data
}

export async function removeExerciseFromWorkout(workoutId: string, exerciseSessionId: string): Promise<void> {
  requireApiConfigured()
  await apiClient.delete(`/workouts/${encodeURIComponent(workoutId)}/exercises/${encodeURIComponent(exerciseSessionId)}`)
}

export async function addSetToExerciseSession(exerciseSessionId: string, input: SetRequest): Promise<ApiSet> {
  requireApiConfigured()
  const { data } = await apiClient.post<ApiSet>(
    `/exercise-sessions/${encodeURIComponent(exerciseSessionId)}/sets`,
    input,
  )
  return data
}

export async function updateSet(setId: string, input: SetRequest): Promise<ApiSet> {
  requireApiConfigured()
  const { data } = await apiClient.put<ApiSet>(`/sets/${encodeURIComponent(setId)}`, input)
  return data
}

export async function deleteSet(setId: string): Promise<void> {
  requireApiConfigured()
  await apiClient.delete(`/sets/${encodeURIComponent(setId)}`)
}

export async function createWorkout(workout: Omit<Workout, 'id'>): Promise<Workout> {
  requireApiConfigured()
  const userId = getRequiredUserId()
  const startedAt = workout.startedAt ?? null
  const workoutDate = workoutCalendarDate(workout.date)
  const { data: created } = await apiClient.post<ApiWorkout>('/workouts', {
    userId,
    workoutDate,
    ...(startedAt ? { startedAt } : {}),
    completedAt: null,
    name: workout.name,
    notes: workout.notes ?? null,
  } satisfies CreateWorkoutRequest)
  const records: PersonalRecord[] = []
  const savedExercises: WorkoutExercise[] = []
  let operation = 'saving exercises and sets'
  try {
    for (const [index, entry] of workout.exercises.entries()) {
      const sessionId = await addExerciseToWorkout(created.id, {
        exerciseId: entry.exercise.id,
        exerciseOrder: index + 1,
      })
      const savedSets: SetEntry[] = []
      for (const set of entry.sets) {
        const savedSet = await addSetToExerciseSession(sessionId, mapApiSet(set))
        records.push(...savedSet.prs.map(mapPersonalRecord))
        savedSets.push({
          ...set,
          id: savedSet.id,
          number: savedSet.setNumber,
          weight: savedSet.weight,
          reps: savedSet.reps,
          rpe: savedSet.rpe,
          rir: savedSet.rir,
          warmup: savedSet.warmup,
          failure: savedSet.failure,
        })
      }
      savedExercises.push({ ...entry, sessionId, order: index + 1, sets: savedSets })
    }

    if (!workout.completed) {
      return { ...mapWorkout(created), exercises: savedExercises, personalRecords: records }
    }

    operation = 'completing the workout'
    const completedAt = new Date().toISOString()
    const completed = await updateWorkout(created.id, {
      userId,
      workoutDate,
      ...(startedAt ? { startedAt } : {}),
      completedAt,
      name: workout.name,
      notes: workout.notes ?? null,
    })
    return { ...mapWorkout(completed), exercises: savedExercises, personalRecords: records }
  } catch (error) {
    throw new Error(`Workout ${created.id} was created, but ${operation} failed: ${apiErrorMessage(error)}`, { cause: error })
  }
}

export async function updateWorkout(id: string, input: CreateWorkoutRequest): Promise<ApiWorkout> {
  requireApiConfigured()
  const { data } = await apiClient.put<ApiWorkout>(`/workouts/${encodeURIComponent(id)}`, input)
  return data
}

export async function deleteWorkout(id: string): Promise<void> {
  requireApiConfigured()
  await apiClient.delete(`/workouts/${encodeURIComponent(id)}`)
}

export async function completeWorkout(id: string): Promise<Workout | null> {
  requireApiConfigured()
  const current = await getWorkout(id)
  if (!current) return null
  if (current.completed) return current
  const userId = getRequiredUserId()
  const data = await updateWorkout(id, {
    userId,
    workoutDate: current.date.slice(0, 10),
    ...(current.startedAt ? { startedAt: current.startedAt } : {}),
    completedAt: new Date().toISOString(),
    name: current.name,
    notes: current.notes ?? null,
  })
  return { ...mapWorkout(data), exercises: current.exercises }
}
