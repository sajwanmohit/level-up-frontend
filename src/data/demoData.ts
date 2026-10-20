import type {
  DashboardAnalytics,
  AnalyticsSummary,
  Exercise,
  ExerciseAnalytics,
  PersonalRecord,
  TrainingSettings,
  Workout,
} from '../types'

export const exerciseLibrary: Exercise[] = [
  { id: 'bench-press', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', category: 'Compound', latestPerformance: '80 kg × 8', bestE1rm: 101.3 },
  { id: 'squat', name: 'Barbell Back Squat', muscleGroup: 'Quadriceps', equipment: 'Barbell', category: 'Compound', latestPerformance: '100 kg × 6', bestE1rm: 120 },
  { id: 'deadlift', name: 'Conventional Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', category: 'Compound', latestPerformance: '120 kg × 5', bestE1rm: 140 },
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', category: 'Compound', latestPerformance: '45 kg × 8', bestE1rm: 57 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', category: 'Compound', latestPerformance: '55 kg × 10', bestE1rm: 73.3 },
  { id: 'incline-db', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', category: 'Compound', latestPerformance: '26 kg × 10', bestE1rm: 34.7 },
  { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', equipment: 'Dumbbell', category: 'Isolation', latestPerformance: '10 kg × 12', bestE1rm: 14 },
  { id: 'leg-curl', name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', category: 'Isolation', latestPerformance: '40 kg × 12', bestE1rm: 56 },
]

const set = (number: number, weight: number, reps: number, rpe: number, rir: number) => ({
  id: `set-${number}-${weight}-${reps}`,
  number,
  weight,
  reps,
  rpe,
  rir,
  warmup: false,
  failure: false,
})

export const initialWorkouts: Workout[] = [
  {
    id: 'workout-today',
    name: 'Upper Body — Strength',
    date: new Date().toISOString(),
    durationMinutes: 58,
    completed: false,
    exercises: [
      {
        exercise: exerciseLibrary[0],
        sets: [set(1, 60, 10, 6, 4), set(2, 75, 8, 7, 3), set(3, 80, 8, 8, 2)],
      },
      {
        exercise: exerciseLibrary[4],
        sets: [set(1, 45, 12, 7, 3), set(2, 50, 10, 8, 2)],
      },
      {
        exercise: exerciseLibrary[3],
        sets: [set(1, 40, 8, 8, 2)],
      },
    ],
  },
  {
    id: 'workout-2',
    name: 'Lower Body — Volume',
    date: new Date(Date.now() - 86400000).toISOString(),
    durationMinutes: 64,
    completed: true,
    exercises: [
      { exercise: exerciseLibrary[1], sets: [set(1, 80, 8, 7, 3), set(2, 90, 6, 8, 2), set(3, 100, 6, 9, 1)] },
      { exercise: exerciseLibrary[7], sets: [set(1, 35, 12, 7, 3), set(2, 40, 12, 8, 2)] },
      { exercise: exerciseLibrary[2], sets: [set(1, 100, 6, 7, 3), set(2, 120, 5, 8, 2)] },
    ],
  },
  {
    id: 'workout-3',
    name: 'Push — Hypertrophy',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    durationMinutes: 52,
    completed: true,
    exercises: [
      { exercise: exerciseLibrary[0], sets: [set(1, 70, 10, 7, 3), set(2, 75, 9, 8, 2), set(3, 75, 8, 9, 1)] },
      { exercise: exerciseLibrary[5], sets: [set(1, 22, 12, 7, 3), set(2, 24, 10, 8, 2)] },
      { exercise: exerciseLibrary[6], sets: [set(1, 8, 15, 8, 2), set(2, 10, 12, 9, 1)] },
    ],
  },
  {
    id: 'workout-4',
    name: 'Pull — Strength',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    durationMinutes: 61,
    completed: true,
    exercises: [
      { exercise: exerciseLibrary[2], sets: [set(1, 100, 6, 7, 3), set(2, 110, 5, 8, 2), set(3, 115, 5, 9, 1)] },
      { exercise: exerciseLibrary[4], sets: [set(1, 45, 12, 7, 3), set(2, 50, 10, 8, 2), set(3, 55, 8, 9, 1)] },
    ],
  },
]

export const personalRecords: PersonalRecord[] = [
  { id: 'pr-1', exercise: 'Barbell Bench Press', type: 'Estimated 1RM PR', value: '101.3 kg', previous: '97.8 kg', improvement: '+3.6%', date: new Date().toISOString() },
  { id: 'pr-2', exercise: 'Barbell Back Squat', type: 'Weight PR', value: '100 kg × 6', previous: '95 kg × 6', improvement: '+5 kg', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 'pr-3', exercise: 'Lat Pulldown', type: 'Rep PR', value: '55 kg × 10', previous: '55 kg × 9', improvement: '+1 rep', date: new Date(Date.now() - 5 * 86400000).toISOString() },
]

export const dashboardAnalytics: DashboardAnalytics = {
  workoutsThisWeek: 4,
  totalSets: 38,
  totalVolume: 18420,
  prsThisMonth: 6,
  consistency: 80,
  weeklyVolume: [
    { label: 'May 20', volume: 11400 }, { label: 'May 27', volume: 13600 },
    { label: 'Jun 03', volume: 12800 }, { label: 'Jun 10', volume: 15900 },
    { label: 'Jun 17', volume: 14100 }, { label: 'Jun 24', volume: 18420 },
  ],
  strengthProgression: [
    { date: 'May 06', e1rm: 92 }, { date: 'May 13', e1rm: 94 },
    { date: 'May 20', e1rm: 94.8 }, { date: 'May 27', e1rm: 97.8 },
    { date: 'Jun 03', e1rm: 99.2 }, { date: 'Jun 10', e1rm: 101.3 },
  ],
  workoutFrequency: [
    { label: 'W1', workouts: 4 }, { label: 'W2', workouts: 5 },
    { label: 'W3', workouts: 3 }, { label: 'W4', workouts: 4 },
  ],
}

export const analyticsSummary: AnalyticsSummary = {
  totalWorkouts: 13,
  totalSets: 124,
  totalVolume: 68420,
  averageWorkoutVolume: 5263,
  averageRpe: 7.8,
  prCount: 6,
  weeklyVolume: dashboardAnalytics.weeklyVolume,
  strengthProgression: dashboardAnalytics.strengthProgression,
  workoutFrequency: dashboardAnalytics.workoutFrequency,
}

export const demoExerciseAnalytics: ExerciseAnalytics = {
  sessions: 24,
  totalSets: 92,
  totalVolume: 48260,
  bestWeight: 85,
  bestReps: 12,
  bestE1rm: 101.3,
  prCount: 5,
  strengthProgression: [
    { date: 'May 06', e1rm: 92 }, { date: 'May 13', e1rm: 94 },
    { date: 'May 20', e1rm: 94.8 }, { date: 'May 27', e1rm: 97.8 },
    { date: 'Jun 03', e1rm: 99.2 }, { date: 'Jun 10', e1rm: 101.3 },
  ],
  volumeOverTime: [
    { label: 'May 06', volume: 3200 }, { label: 'May 13', volume: 3600 },
    { label: 'May 20', volume: 3400 }, { label: 'May 27', volume: 4100 },
    { label: 'Jun 03', volume: 3900 }, { label: 'Jun 10', volume: 4500 },
  ],
  bestWeightOverTime: [
    { date: 'May 06', weight: 75 }, { date: 'May 13', weight: 77.5 },
    { date: 'May 20', weight: 77.5 }, { date: 'May 27', weight: 80 },
    { date: 'Jun 03', weight: 82.5 }, { date: 'Jun 10', weight: 85 },
  ],
  recentPerformance: [
    { date: 'Jun 24', weight: 80, reps: 8, rpe: 8, rir: 2, e1rm: 101.3, volume: 640 },
    { date: 'Jun 20', weight: 77.5, reps: 9, rpe: 8, rir: 2, e1rm: 100.8, volume: 697.5 },
    { date: 'Jun 17', weight: 75, reps: 10, rpe: 8, rir: 2, e1rm: 100, volume: 750 },
    { date: 'Jun 13', weight: 80, reps: 7, rpe: 9, rir: 1, e1rm: 98.7, volume: 560 },
  ],
}

export const defaultTrainingSettings: TrainingSettings = {
  trainingDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
}
