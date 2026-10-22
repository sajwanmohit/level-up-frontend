import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, isApiConfigured, requireApiConfigured } from './api/client'
import type { ApiDailyAnalytics, Exercise, ExerciseAnalytics, PersonalRecord, Workout } from './types'
import { AnalyticsPage } from './features/analytics/AnalyticsPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ExerciseDetailPage, ExercisesPage } from './features/exercises/ExercisePages'
import { PRsPage } from './features/prs/PRsPage'
import { NewWorkoutPage, WorkoutDetailPage } from './features/workouts/WorkoutPages'

const apiMocks = vi.hoisted(() => ({
  getExercises: vi.fn(),
  getExercise: vi.fn(),
  getExerciseAnalytics: vi.fn(),
  getDashboardAnalytics: vi.fn(),
  getDailyAnalytics: vi.fn(),
  getPRs: vi.fn(),
  getExercisePRs: vi.fn(),
  getWorkout: vi.fn(),
  getWorkouts: vi.fn(),
  createWorkout: vi.fn(),
  completeWorkout: vi.fn(),
  deleteWorkout: vi.fn(),
  addExerciseToWorkout: vi.fn(),
  addSetToExerciseSession: vi.fn(),
  removeExerciseFromWorkout: vi.fn(),
  updateSet: vi.fn(),
  deleteSet: vi.fn(),
}))

vi.mock('./api/exercises', () => ({
  getExercises: apiMocks.getExercises,
  getExercise: apiMocks.getExercise,
  getExerciseAnalytics: apiMocks.getExerciseAnalytics,
  createExercise: vi.fn(),
}))
vi.mock('./api/analytics', () => ({
  getDashboardAnalytics: apiMocks.getDashboardAnalytics,
  getDailyAnalytics: apiMocks.getDailyAnalytics,
}))
vi.mock('./api/prs', () => ({ getPRs: apiMocks.getPRs, getExercisePRs: apiMocks.getExercisePRs }))
vi.mock('./api/workouts', () => ({
  getWorkout: apiMocks.getWorkout,
  getWorkouts: apiMocks.getWorkouts,
  createWorkout: apiMocks.createWorkout,
  completeWorkout: apiMocks.completeWorkout,
  deleteWorkout: apiMocks.deleteWorkout,
  addExerciseToWorkout: apiMocks.addExerciseToWorkout,
  addSetToExerciseSession: apiMocks.addSetToExerciseSession,
  removeExerciseFromWorkout: apiMocks.removeExerciseFromWorkout,
  updateSet: apiMocks.updateSet,
  deleteSet: apiMocks.deleteSet,
}))
vi.mock('./components/Charts', () => ({
  StrengthChart: () => <div>Estimated 1RM chart</div>,
  ExerciseVolumeChart: () => <div>Exercise volume chart</div>,
}))

const benchPress: Exercise = {
  id: 'bench-press',
  name: 'Barbell Bench Press',
  muscleGroup: 'Chest',
  equipment: 'Barbell',
  category: 'Compound',
  latestPerformance: '—',
  bestE1rm: 0,
}
const lateralRaise: Exercise = {
  id: 'lateral-raise',
  name: 'Dumbbell Lateral Raise',
  muscleGroup: 'Shoulders',
  equipment: 'Dumbbell',
  category: 'Isolation',
  latestPerformance: '—',
  bestE1rm: 0,
}
const exerciseAnalytics: ExerciseAnalytics = {
  sessions: 1,
  totalSets: 1,
  totalVolume: 600,
  bestWeight: 60,
  bestReps: 10,
  bestE1rm: 101.3,
  latestE1rm: 101.3,
  prCount: 1,
  strengthProgression: [{ date: '2026-10-20', e1rm: 101.3 }],
  volumeOverTime: [{ label: '2026-10-20', volume: 600 }],
}
const records: PersonalRecord[] = [{
  id: 'pr-1',
  exercise: 'Barbell Bench Press',
  type: 'Estimated 1RM PR',
  value: '101.3 kg',
  date: '2026-10-20',
}]
const dailyAnalytics: ApiDailyAnalytics = {
  workoutId: 'workout-1',
  date: '2026-10-20',
  totalExercises: 1,
  totalWorkingSets: 1,
  totalReps: 10,
  totalVolume: 600,
  totalWarmupSets: 0,
  averageRpe: 8,
  averageRir: 2,
  exercises: [{
    exerciseId: benchPress.id,
    exerciseName: benchPress.name,
    sets: 1,
    workingSets: 1,
    reps: 10,
    volume: 600,
    averageRpe: 8,
  }],
  prs: [],
  estimatedOneRepMaxChanges: [],
}

let createdWorkout: Workout | null = null

function completedWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    name: 'Training session',
    date: '2026-10-20',
    durationMinutes: 45,
    exercises: [],
    completed: true,
    personalRecords: [],
    ...overrides,
  }
}

function renderWithProviders(element: ReactNode, initialEntries = ['/']) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>{element}</MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  createdWorkout = null
  apiMocks.getExercises.mockResolvedValue([benchPress, lateralRaise])
  apiMocks.getExercise.mockResolvedValue(benchPress)
  apiMocks.getExerciseAnalytics.mockResolvedValue(exerciseAnalytics)
  apiMocks.getDashboardAnalytics.mockResolvedValue({
    totalWorkouts: 2,
    totalPrs: records.length,
    totalVolume: 600,
    exerciseCount: 1,
  })
  apiMocks.getDailyAnalytics.mockResolvedValue(dailyAnalytics)
  apiMocks.getPRs.mockResolvedValue(records)
  apiMocks.getExercisePRs.mockResolvedValue(records)
  apiMocks.getWorkout.mockImplementation(async () => createdWorkout ?? completedWorkout())
  apiMocks.getWorkouts.mockResolvedValue([])
  apiMocks.createWorkout.mockImplementation(async (workout: Omit<Workout, 'id'>) => {
    createdWorkout = { ...workout, id: 'created-workout' }
    return createdWorkout
  })
  apiMocks.completeWorkout.mockResolvedValue(completedWorkout())
  apiMocks.deleteWorkout.mockResolvedValue(undefined)
})

describe('Level Up frontend', () => {
  it('renders the dashboard and its backend training summary', async () => {
    renderWithProviders(<DashboardPage />)
    expect(await screen.findByRole('heading', { name: 'Good morning, athlete.' })).toBeInTheDocument()
    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(screen.getByText('Recent PRs')).toBeInTheDocument()
  })

  it('completes a workout with multiple entered sets', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/workouts/new" element={<NewWorkoutPage />} />
        <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />
      </Routes>,
      ['/workouts/new'],
    )

    fireEvent.change(await screen.findByRole('combobox', { name: 'Select an exercise' }), { target: { value: 'bench-press' } })
    fireEvent.change(await screen.findByRole('spinbutton', { name: 'Set 1 weight' }), { target: { value: '60' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Set 1 reps' }), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add set' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Set 2 weight' }), { target: { value: '65' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Set 2 reps' }), { target: { value: '8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Complete workout' }))

    expect(await screen.findByRole('heading', { name: 'Training session' })).toBeInTheDocument()
    expect(screen.getByText('65 kg')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows exercise library search using loaded exercises', async () => {
    renderWithProviders(<ExercisesPage />)
    expect(await screen.findByRole('heading', { name: 'Exercises' })).toBeInTheDocument()
    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Search exercises' }), { target: { value: 'lateral' } })
    expect(screen.getByText('Dumbbell Lateral Raise')).toBeInTheDocument()
    expect(screen.queryByText('Barbell Bench Press')).not.toBeInTheDocument()
  })

  it('renders exercise-level strength and volume analytics', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
      </Routes>,
      ['/exercises/bench-press'],
    )
    expect(await screen.findByRole('heading', { name: 'Barbell Bench Press', level: 1 })).toBeInTheDocument()
    expect(screen.getAllByText('101.3 kg').length).toBeGreaterThan(0)
    expect(screen.getByText('Exercise volume chart')).toBeInTheDocument()
    expect(screen.getByText('Performance trends')).toBeInTheDocument()
  })

  it('shows backend personal-record milestones', async () => {
    renderWithProviders(<PRsPage />)
    expect(await screen.findByRole('heading', { name: 'Proof of progress.' })).toBeInTheDocument()
    expect(screen.getByText('Estimated 1RM PR')).toBeInTheDocument()
    expect(screen.getByText('101.3 kg')).toBeInTheDocument()
  })

  it('loads analytics for a completed workout from the backend', async () => {
    apiMocks.getWorkouts.mockResolvedValue([completedWorkout()])
    renderWithProviders(<AnalyticsPage />)
    expect(await screen.findByRole('heading', { name: 'Your work, visualized.' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Choose a completed workout' })).toHaveValue('workout-1')
    expect(screen.getByText('Exercise breakdown')).toBeInTheDocument()
    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument()
  })

  it('defaults API requests to the local backend and supports configured base URLs', () => {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080'
    const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '')
    expect(apiClient.defaults.baseURL).toBe(normalizedBaseUrl.endsWith('/api/v1') ? normalizedBaseUrl : `${normalizedBaseUrl}/api/v1`)
    expect(isApiConfigured).toBe(true)
    expect(requireApiConfigured).not.toThrow()
  })
})
