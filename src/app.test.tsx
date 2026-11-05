import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { InternalAxiosRequestConfig } from 'axios'
import { useState, type ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, apiErrorMessage, isApiConfigured, requireApiConfigured } from './api/client'
import { clearAuthenticatedSession, getAccessToken, setAuthenticatedSession } from './api/auth'
import { getActiveUser } from './api/user'
import type { ApiDailyAnalytics, Exercise, ExerciseAnalytics, PersonalRecord, Workout } from './types'
import { AnalyticsPage } from './features/analytics/AnalyticsPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { AppShell } from './components/AppShell'
import { ExerciseDetailPage, ExercisesPage } from './features/exercises/ExercisePages'
import { PRsPage } from './features/prs/PRsPage'
import { AuthPage } from './features/auth/AuthPage'
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

function ProtectedRequestPage() {
  const [requestFailed, setRequestFailed] = useState(false)
  return (
    <button type="button" onClick={async () => {
      try {
        await apiClient.get('/exercises', {
          adapter: async (config) => {
            throw Object.assign(new Error('Unauthorized'), {
              isAxiosError: true,
              response: { data: {}, status: 401, statusText: 'Unauthorized', headers: {}, config },
            })
          },
        })
      } catch {
        setRequestFailed(true)
      }
    }}>
      {requestFailed ? 'Request failed' : 'Make protected request'}
    </button>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
  clearAuthenticatedSession()
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
  it('submits sign-up and switches to login after the empty 201 response', async () => {
    vi.spyOn(apiClient, 'post').mockImplementation(async () => ({ status: 201, data: undefined }) as never)
    renderWithProviders(<AuthPage />)

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Taylor Athlete' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'Taylor@Example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-pass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Account created. Log in to continue.')
    expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', {
      name: 'Taylor Athlete',
      email: 'taylor@example.com',
      password: 'secure-pass',
    })
  })

  it('rejects signup passwords exceeding the backend UTF-8 byte limit', () => {
    const post = vi.spyOn(apiClient, 'post')
    renderWithProviders(<AuthPage />)
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Taylor Athlete' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'taylor@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'é'.repeat(37) } })
    fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form')!)

    expect(screen.getByRole('alert')).toHaveTextContent('no more than 72 UTF-8 bytes')
    expect(post).not.toHaveBeenCalled()
  })

  it('shows a generic login failure for unauthorized credentials', async () => {
    vi.spyOn(apiClient, 'post').mockImplementation(() => Promise.reject(
      Object.assign(new Error('Unauthorized'), { isAxiosError: true, response: { status: 401 } }),
    ))
    renderWithProviders(<AuthPage />)
    fireEvent.click(within(screen.getByRole('group', { name: 'Account action' })).getByRole('button', { name: 'Log in' }))
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'taylor@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-pass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.')
    expect(screen.getByRole('alert')).not.toHaveTextContent('registered')
  })

  it('logs in with the returned backend session and redirects to the requested page', async () => {
    vi.spyOn(apiClient, 'post').mockImplementation(async () => ({
      status: 200,
      data: {
        user: { id: 'user-id', name: 'Taylor Athlete', email: 'taylor@example.com' },
        accessToken: 'backend-token',
      },
    }) as never)
    renderWithProviders(
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<AppShell />}>
          <Route path="/workouts/new" element={<div>New workout page</div>} />
        </Route>
      </Routes>,
      ['/workouts/new'],
    )
    fireEvent.click(within(screen.getByRole('group', { name: 'Account action' })).getByRole('button', { name: 'Log in' }))
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'taylor@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-pass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('New workout page')).toBeInTheDocument()
    expect(getAccessToken()).toBe('backend-token')
    expect(getActiveUser()).toEqual({ id: 'user-id', name: 'Taylor Athlete', email: 'taylor@example.com' })
  })

  it('clears the session when the user signs out', async () => {
    setAuthenticatedSession({
      user: { id: 'user-id', name: 'Taylor Athlete', email: 'taylor@example.com' },
      accessToken: 'backend-token',
    })
    renderWithProviders(<AuthPage />, ['/auth'])

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(getAccessToken()).toBeNull()
    expect(getActiveUser()).toBeNull()
    expect(await screen.findByRole('heading', { name: 'Build your next level.' })).toBeInTheDocument()
  })

  it('renders the sign-up and sign-in forms', () => {
    renderWithProviders(<AuthPage />)

    expect(screen.getByRole('heading', { name: 'Build your next level.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('group', { name: 'Account action' })).getByRole('button', { name: 'Log in' }))
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()
  })

  it('stores the backend token in a session and attaches it to API requests', async () => {
    const user = { id: 'user-id', name: 'Taylor Athlete', email: 'taylor@example.com' }
    setAuthenticatedSession({ user, accessToken: 'backend-token' })
    expect(getAccessToken()).toBe('backend-token')

    const response = await apiClient.get('/exercises', {
      adapter: async (config) => ({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    })
    expect(response.config.headers.get('Authorization')).toBe('Bearer backend-token')
    clearAuthenticatedSession()
    expect(getAccessToken()).toBeNull()
  })

  it('does not send an existing token to public signup and login endpoints', async () => {
    setAuthenticatedSession({
      user: { id: 'user-id', name: 'Taylor Athlete', email: 'taylor@example.com' },
      accessToken: 'stale-token',
    })
    const adapter = async (config: InternalAxiosRequestConfig) => ({
      data: undefined,
      status: 201,
      statusText: 'Created',
      headers: {},
      config,
    })

    const signupResponse = await apiClient.post('/auth/signup', {}, { adapter })
    const loginResponse = await apiClient.post('/auth/login', {}, { adapter })

    expect(signupResponse.config.headers.get('Authorization')).toBeUndefined()
    expect(loginResponse.config.headers.get('Authorization')).toBeUndefined()
    clearAuthenticatedSession()
  })

  it('clears the session and redirects to login after a protected API returns 401', async () => {
    setAuthenticatedSession({
      user: { id: 'user-id', name: 'Taylor Athlete', email: 'taylor@example.com' },
      accessToken: 'backend-token',
    })
    renderWithProviders(
      <Routes>
        <Route path="/auth" element={<div>Sign-in page</div>} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<ProtectedRequestPage />} />
        </Route>
      </Routes>,
      ['/dashboard'],
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Make protected request' }))
    expect(await screen.findByText('Sign-in page')).toBeInTheDocument()
    expect(getAccessToken()).toBeNull()
  })

  it('displays a generic forbidden-resource message for 403 responses', () => {
    const forbidden = Object.assign(new Error('Forbidden'), {
      isAxiosError: true,
      response: { status: 403 },
    })
    expect(apiErrorMessage(forbidden)).toBe("You don't have permission to access this resource.")
  })

  it('redirects unsigned users away from training pages', async () => {
    clearAuthenticatedSession()
    renderWithProviders(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<div>Training workspace</div>} />
        </Route>
        <Route path="/auth" element={<div>Sign-in page</div>} />
      </Routes>,
      ['/dashboard'],
    )

    expect(await screen.findByText('Sign-in page')).toBeInTheDocument()
    expect(screen.queryByText('Training workspace')).not.toBeInTheDocument()
  })

  it('allows a signed-in user to access training pages', () => {
    setAuthenticatedSession({
      user: { id: 'user-id', name: 'Taylor Athlete', email: 'taylor@example.com' },
      accessToken: 'backend-token',
    })
    renderWithProviders(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<div>Training workspace</div>} />
        </Route>
        <Route path="/auth" element={<div>Sign-in page</div>} />
      </Routes>,
      ['/dashboard'],
    )

    expect(screen.getByText('Training workspace')).toBeInTheDocument()
    clearAuthenticatedSession()
  })

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
