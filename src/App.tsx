import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LoadingState } from './components/ui'

const AnalyticsPage = lazy(() => import('./features/analytics/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })))
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ExerciseDetailPage = lazy(() => import('./features/exercises/ExercisePages').then((module) => ({ default: module.ExerciseDetailPage })))
const ExercisesPage = lazy(() => import('./features/exercises/ExercisePages').then((module) => ({ default: module.ExercisesPage })))
const PRsPage = lazy(() => import('./features/prs/PRsPage').then((module) => ({ default: module.PRsPage })))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const NewWorkoutPage = lazy(() => import('./features/workouts/WorkoutPages').then((module) => ({ default: module.NewWorkoutPage })))
const WorkoutDetailPage = lazy(() => import('./features/workouts/WorkoutPages').then((module) => ({ default: module.WorkoutDetailPage })))
const WorkoutsPage = lazy(() => import('./features/workouts/WorkoutPages').then((module) => ({ default: module.WorkoutsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/workouts/new" element={<NewWorkoutPage />} />
              <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
              <Route path="/prs" element={<PRsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
