export type SetEntry = {
  id: string
  number: number
  weight: number
  reps: number
  rpe: number | null
  rir: number | null
  warmup: boolean
  failure: boolean
}

export type Exercise = {
  id: string
  name: string
  muscleGroup: string
  equipment: string
  category: 'Compound' | 'Isolation'
  latestPerformance: string
  bestE1rm: number
  description?: string | null
  movementType?: string | null
}

export type WorkoutExercise = {
  exercise: Exercise
  sets: SetEntry[]
}

export type Workout = {
  id: string
  name: string
  date: string
  durationMinutes: number
  exercises: WorkoutExercise[]
  completed: boolean
  personalRecords?: PersonalRecord[]
  userId?: string
  startedAt?: string | null
  completedAt?: string | null
  notes?: string | null
}

export type PersonalRecord = {
  id: string
  exercise: string
  type: 'Weight PR' | 'Rep PR' | 'Estimated 1RM PR' | 'Volume PR'
  value: string
  previous?: string
  improvement?: string
  date: string
}

export type ApiExercise = {
  id: string
  name: string
  description: string | null
  muscleGroup: string | null
  equipment: string | null
  movementType: string | null
  compound: boolean
}

export type ApiSet = {
  id: string
  exerciseSessionId: string
  setNumber: number
  weight: number
  reps: number
  rpe: number | null
  rir: number | null
  warmup: boolean
  failure: boolean
  prs: ApiPersonalRecord[]
}

export type ApiWorkout = {
  id: string
  userId: string
  workoutDate: string
  startedAt: string | null
  completedAt: string | null
  name: string | null
  notes: string | null
}

export type ApiWorkoutDetail = {
  workout: ApiWorkout
  exercises: {
    id: string
    exerciseId: string
    exerciseName: string
    exerciseOrder: number
    notes: string | null
    sets: ApiSet[]
  }[]
}

export type ApiPersonalRecord = {
  id: string
  userId: string
  exerciseId: string
  exerciseName: string
  workoutSetId: string
  type: 'MAX_WEIGHT' | 'MAX_REPS' | 'ESTIMATED_ONE_REP_MAX' | 'VOLUME'
  value: number
  achievedAt: string
}

export type ApiDashboardAnalytics = {
  totalWorkouts: number
  totalPrs: number
  totalVolume: number
  exerciseCount: number
}

export type ApiDailyAnalytics = {
  workoutId: string
  date: string
  totalExercises: number
  totalWorkingSets: number
  totalReps: number
  totalVolume: number
  totalWarmupSets: number
  averageRpe: number | null
  averageRir: number | null
  exercises: {
    exerciseId: string
    exerciseName: string
    sets: number
    workingSets: number
    reps: number
    volume: number
    averageRpe: number | null
  }[]
  prs: ApiPersonalRecord[]
  estimatedOneRepMaxChanges: {
    exerciseId: string
    exerciseName: string
    estimatedOneRepMax: number
  }[]
}

export type ApiExerciseAnalytics = {
  exercise: ApiExercise
  summary: {
    sessions: number
    totalSets: number
    totalVolume: number
    bestWeight: number
    bestReps: number | null
    bestEstimatedOneRepMax: number
    latestEstimatedOneRepMax: number
    prCount: number
  }
  history: {
    date: string
    estimatedOneRepMax: number
    volume: number
  }[]
}

export type StrengthPoint = { date: string; e1rm: number }

export type ExerciseAnalytics = {
  sessions: number
  totalSets: number
  totalVolume: number
  bestWeight: number
  bestReps: number | null
  bestE1rm: number
  latestE1rm?: number
  prCount: number
  strengthProgression: StrengthPoint[]
  volumeOverTime: { label: string; volume: number }[]
}
