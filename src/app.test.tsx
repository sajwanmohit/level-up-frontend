import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { apiClient, isApiConfigured } from './api/client'
import { AnalyticsPage } from './features/analytics/AnalyticsPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ExerciseDetailPage, ExercisesPage } from './features/exercises/ExercisePages'
import { PRsPage } from './features/prs/PRsPage'
import { NewWorkoutPage, WorkoutDetailPage } from './features/workouts/WorkoutPages'

vi.mock('./components/Charts', () => ({
  WeeklyVolumeChart: () => <div>Weekly volume chart</div>,
  StrengthChart: () => <div>Estimated 1RM chart</div>,
  FrequencyChart: () => <div>Workout frequency chart</div>,
  ExerciseVolumeChart: () => <div>Exercise volume chart</div>,
  BestWeightChart: () => <div>Best weight chart</div>,
}))

function renderWithProviders(element: ReactNode, initialEntries = ['/']) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>{element}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Level Up frontend', () => {
  it('renders the dashboard and its training summary', async () => {
    renderWithProviders(<DashboardPage />)
    expect(await screen.findByRole('heading', { name: 'Good morning, athlete.' })).toBeInTheDocument()
    expect(screen.getByText('Weekly volume chart')).toBeInTheDocument()
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
    const firstWeight = await screen.findByRole('spinbutton', { name: 'Set 1 weight' })
    fireEvent.change(firstWeight, { target: { value: '60' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Set 1 reps' }), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add set' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Set 2 weight' }), { target: { value: '65' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Set 2 reps' }), { target: { value: '8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Complete workout' }))

    expect(await screen.findByRole('heading', { name: 'Training session' })).toBeInTheDocument()
    expect(screen.getByText('65 kg')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows exercise library search and performance data', async () => {
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
    expect(await screen.findByRole('heading', { name: 'Barbell Bench Press' })).toBeInTheDocument()
    expect(screen.getAllByText('101.3 kg').length).toBeGreaterThan(0)
    expect(screen.getByText('Exercise volume chart')).toBeInTheDocument()
    expect(screen.getByText('Recent performance')).toBeInTheDocument()
  })

  it('shows a clear personal-record milestone', async () => {
    renderWithProviders(<PRsPage />)
    expect(await screen.findByRole('heading', { name: 'Proof of progress.' })).toBeInTheDocument()
    expect(screen.getByText('Estimated 1RM PR')).toBeInTheDocument()
    expect(screen.getByText('101.3 kg')).toBeInTheDocument()
    expect(screen.getByText('+3.6%')).toBeInTheDocument()
  })

  it('loads exercise analytics for the selected period and movement', async () => {
    renderWithProviders(<AnalyticsPage />)
    expect(await screen.findByRole('heading', { name: 'Your work, visualized.' })).toBeInTheDocument()
    expect(screen.getByText('Estimated 1RM chart')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Choose an exercise' }), { target: { value: 'bench-press' } })
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Choose an exercise' })).toHaveValue('bench-press'))
  })

  it('derives API configuration only from the Vite environment value', () => {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
    expect(apiClient.defaults.baseURL).toBe(configuredBaseUrl)
    expect(isApiConfigured).toBe(Boolean(configuredBaseUrl))
  })
})
