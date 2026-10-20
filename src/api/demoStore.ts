import {
  dashboardAnalytics,
  analyticsSummary,
  defaultTrainingSettings,
  demoExerciseAnalytics,
  exerciseLibrary,
  initialWorkouts,
  personalRecords,
} from '../data/demoData'
import type { TrainingSettings, Workout } from '../types'

const WORKOUTS_KEY = 'level-up.demo.workouts'
const SETTINGS_KEY = 'level-up.demo.settings'

function readStored<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key)
  return value ? (JSON.parse(value) as T) : fallback
}

function store<T>(key: string, value: T): T {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

export const demoStore = {
  workouts: () => readStored(WORKOUTS_KEY, initialWorkouts),
  workout: (id: string) => readStored(WORKOUTS_KEY, initialWorkouts).find((workout) => workout.id === id) ?? null,
  createWorkout: (workout: Omit<Workout, 'id'>) => {
    const workouts = readStored(WORKOUTS_KEY, initialWorkouts)
    const created = { ...workout, id: crypto.randomUUID() }
    store(WORKOUTS_KEY, [created, ...workouts])
    return created
  },
  completeWorkout: (id: string) => {
    const workouts = readStored(WORKOUTS_KEY, initialWorkouts)
    const updated = workouts.map((workout) => (workout.id === id ? { ...workout, completed: true } : workout))
    store(WORKOUTS_KEY, updated)
    return updated.find((workout) => workout.id === id) ?? null
  },
  exercises: () => exerciseLibrary,
  exercise: (id: string) => exerciseLibrary.find((exercise) => exercise.id === id) ?? null,
  personalRecords: () => personalRecords,
  dashboardAnalytics: () => dashboardAnalytics,
  analytics: () => analyticsSummary,
  exerciseAnalytics: () => demoExerciseAnalytics,
  settings: () => readStored(SETTINGS_KEY, defaultTrainingSettings),
  saveSettings: (settings: TrainingSettings) => store(SETTINGS_KEY, settings),
}
