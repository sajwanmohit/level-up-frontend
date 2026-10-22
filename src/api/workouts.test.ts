import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addExerciseToWorkout, addSetToExerciseSession, createWorkout, deleteSet, deleteWorkout, removeExerciseFromWorkout, updateSet, updateWorkout } from './workouts'
import type { ApiSet, ApiWorkout, Workout } from '../types'

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('./client', () => ({
  apiClient: apiMocks,
  apiErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'error',
  requireApiConfigured: vi.fn(),
}))
vi.mock('./user', () => ({ getRequiredUserId: () => 'user-uuid' }))

const createdWorkout: ApiWorkout = {
  id: 'workout-uuid',
  userId: 'user-uuid',
  workoutDate: '2026-10-22',
  startedAt: '2026-10-22T09:00:00Z',
  completedAt: null,
  name: 'Push day',
  notes: null,
}

const savedSet: ApiSet = {
  id: 'set-uuid',
  exerciseSessionId: 'session-uuid',
  setNumber: 1,
  weight: 85,
  reps: 8,
  rpe: 8.5,
  rir: 1.5,
  warmup: false,
  failure: false,
  prs: [],
}

const workoutInput: Omit<Workout, 'id'> = {
  userId: 'user-uuid',
  name: 'Push day',
  date: '2026-10-22',
  startedAt: '2026-10-22T09:00:00Z',
  durationMinutes: 30,
  completed: true,
  exercises: [{
    exercise: {
      id: 'exercise-uuid',
      name: 'Bench Press',
      muscleGroup: 'Chest',
      equipment: 'Barbell',
      category: 'Compound',
      latestPerformance: '—',
      bestE1rm: 0,
    },
    sets: [{
      id: 'temporary-set-id',
      number: 1,
      weight: 85,
      reps: 8,
      rpe: 8.5,
      rir: 1.5,
      warmup: false,
      failure: false,
    }],
  }],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('workout API contract', () => {
  it('uses returned workout, session, and set UUIDs throughout workout creation', async () => {
    apiMocks.post.mockImplementation(async (path: string) => {
      if (path === '/workouts') return { data: createdWorkout }
      if (path === '/workouts/workout-uuid/exercises') return { data: 'session-uuid' }
      if (path === '/exercise-sessions/session-uuid/sets') return { data: savedSet }
      throw new Error(`Unexpected POST ${path}`)
    })
    apiMocks.put.mockResolvedValue({
      data: { ...createdWorkout, completedAt: '2026-10-22T09:30:00Z' },
    })

    const result = await createWorkout(workoutInput)

    expect(apiMocks.post).toHaveBeenNthCalledWith(1, '/workouts', {
      userId: 'user-uuid',
      workoutDate: '2026-10-22',
      startedAt: '2026-10-22T09:00:00Z',
      completedAt: null,
      name: 'Push day',
      notes: null,
    })
    expect(apiMocks.post).toHaveBeenNthCalledWith(2, '/workouts/workout-uuid/exercises', {
      exerciseId: 'exercise-uuid',
      exerciseOrder: 1,
    })
    expect(apiMocks.post).toHaveBeenNthCalledWith(3, '/exercise-sessions/session-uuid/sets', {
      setNumber: 1,
      weight: 85,
      reps: 8,
      rpe: 8.5,
      rir: 1.5,
      warmup: false,
      failure: false,
    })
    expect(apiMocks.put).toHaveBeenCalledWith('/workouts/workout-uuid', expect.objectContaining({
      userId: 'user-uuid',
      workoutDate: '2026-10-22',
      completedAt: expect.any(String),
    }))
    expect(result.id).toBe('workout-uuid')
    expect(result.exercises[0].sessionId).toBe('session-uuid')
    expect(result.exercises[0].sets[0].id).toBe('set-uuid')
  })

  it('leaves draft workouts incomplete until the user completes them', async () => {
    apiMocks.post.mockImplementation(async (path: string) => {
      if (path === '/workouts') return { data: createdWorkout }
      if (path === '/workouts/workout-uuid/exercises') return { data: 'session-uuid' }
      if (path === '/exercise-sessions/session-uuid/sets') return { data: savedSet }
      throw new Error(`Unexpected POST ${path}`)
    })

    const result = await createWorkout({ ...workoutInput, completed: false })

    expect(apiMocks.put).not.toHaveBeenCalled()
    expect(result.completed).toBe(false)
    expect(result.id).toBe('workout-uuid')
  })

  it('uses the documented paths and accepts bodyless 204 responses', async () => {
    apiMocks.post.mockResolvedValueOnce({ data: 'session-uuid' }).mockResolvedValueOnce({ data: savedSet })
    apiMocks.put.mockResolvedValueOnce({ data: savedSet }).mockResolvedValueOnce({ data: createdWorkout })
    apiMocks.delete.mockResolvedValue({ status: 204 })

    await expect(addExerciseToWorkout('workout/uuid', { exerciseId: 'exercise-uuid', exerciseOrder: 1 }))
      .resolves.toBe('session-uuid')
    await addSetToExerciseSession('session-uuid', { setNumber: 1, weight: 0, reps: 1 })
    await updateSet('set-uuid', { setNumber: 1, weight: 85, reps: 8 })
    await updateWorkout('workout-uuid', { userId: 'user-uuid', workoutDate: '2026-10-22' })
    await expect(removeExerciseFromWorkout('workout-uuid', 'session-uuid')).resolves.toBeUndefined()
    await expect(deleteSet('set-uuid')).resolves.toBeUndefined()
    await expect(deleteWorkout('workout-uuid')).resolves.toBeUndefined()

    expect(apiMocks.post).toHaveBeenNthCalledWith(1, '/workouts/workout%2Fuuid/exercises', {
      exerciseId: 'exercise-uuid',
      exerciseOrder: 1,
    })
    expect(apiMocks.post).toHaveBeenNthCalledWith(2, '/exercise-sessions/session-uuid/sets', {
      setNumber: 1,
      weight: 0,
      reps: 1,
    })
    expect(apiMocks.put).toHaveBeenNthCalledWith(1, '/sets/set-uuid', { setNumber: 1, weight: 85, reps: 8 })
    expect(apiMocks.put).toHaveBeenNthCalledWith(2, '/workouts/workout-uuid', { userId: 'user-uuid', workoutDate: '2026-10-22' })
    expect(apiMocks.delete).toHaveBeenNthCalledWith(1, '/workouts/workout-uuid/exercises/session-uuid')
    expect(apiMocks.delete).toHaveBeenNthCalledWith(2, '/sets/set-uuid')
    expect(apiMocks.delete).toHaveBeenNthCalledWith(3, '/workouts/workout-uuid')
  })
})
