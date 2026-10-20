import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, Clock3, Dumbbell, Plus, Trophy, Weight, X } from 'lucide-react'
import { apiErrorMessage, isApiConfigured } from '../../api/client'
import { getExercises } from '../../api/exercises'
import { completeWorkout, createWorkout, getWorkout, getWorkouts } from '../../api/workouts'
import type { Exercise, SetEntry, Workout, WorkoutExercise } from '../../types'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeading, Select, TextInput } from '../../components/ui'

const blankSet = (number: number): SetEntry => ({
  id: crypto.randomUUID(),
  number,
  weight: 0,
  reps: 0,
  rpe: null,
  rir: null,
  warmup: false,
  failure: false,
})

function totalVolume(workout: Workout) {
  return workout.exercises.reduce((total, entry) => total + entry.sets.reduce((sum, set) => sum + set.weight * set.reps, 0), 0)
}

export function WorkoutsPage() {
  const query = useQuery({ queryKey: ['workouts'], queryFn: getWorkouts })
  if (query.isLoading) return <LoadingState />
  if (query.error) return <ErrorState message="Workout history couldn't be loaded." retry={() => { void query.refetch() }} />
  const workouts = query.data ?? []

  return (
    <div className="page-stack">
      <PageHeading eyebrow="YOUR TRAINING LOG" title="Workouts" description="Every session, one step forward."
        action={<Link to="/workouts/new"><Button><Plus size={17} /> Start workout</Button></Link>} />
      {workouts.length ? <div className="workout-list">
        {workouts.map((workout) => (
          <Link key={workout.id} to={`/workouts/${workout.id}`} className="workout-link">
            <Card className="workout-row">
              <div className="workout-date"><span>{new Date(`${workout.date.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit' })}</span><small>{new Date(`${workout.date.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}</small></div>
              <div className="workout-info"><div className="workout-name-line"><h3>{workout.name}</h3><Badge tone={workout.completed ? 'green' : 'amber'}>{workout.completed ? 'Completed' : 'In progress'}</Badge></div><p>{workout.exercises.length ? workout.exercises.map((item) => item.exercise.name).join(' · ') : isApiConfigured ? 'Open to see exercises and sets' : ''}</p></div>
              {!isApiConfigured && <div className="workout-data"><span><Clock3 size={14} />{workout.durationMinutes} min</span><span><Dumbbell size={14} />{workout.exercises.reduce((n, item) => n + item.sets.length, 0)} sets</span><span><Weight size={14} />{totalVolume(workout).toLocaleString()} kg</span><span><Trophy size={14} />{workout.personalRecords?.length ?? 0} PRs</span></div>}
              <span className="workout-date-full">{new Date(`${workout.date.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </Card>
          </Link>
        ))}
      </div> : <Card><EmptyState title="You haven't logged a workout yet." description="Start your first session and build your training history." action={<Link to="/workouts/new"><Button>Start workout</Button></Link>} /></Card>}
    </div>
  )
}

export function NewWorkoutPage() {
  const [name, setName] = useState('')
  const [entries, setEntries] = useState<WorkoutExercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [startedAt] = useState(() => Date.now())
  const exercisesQuery = useQuery({ queryKey: ['exercises'], queryFn: getExercises })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: createWorkout,
    onError: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workouts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] }),
        queryClient.invalidateQueries({ queryKey: ['prs'] }),
      ])
    },
    onSuccess: async (workout) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workouts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['prs'] }),
        queryClient.invalidateQueries({ queryKey: ['exerciseAnalytics'] }),
      ])
      navigate(`/workouts/${workout.id}`)
    },
  })

  function addExercise(exercise: Exercise) {
    if (entries.some((entry) => entry.exercise.id === exercise.id)) return
    setEntries((current) => [...current, { exercise, sets: [blankSet(1)] }])
    setSelectedExercise('')
  }

  function updateSet(exerciseId: string, setId: string, field: keyof SetEntry, value: number | boolean | null) {
    setEntries((current) => current.map((entry) => entry.exercise.id !== exerciseId ? entry : {
      ...entry,
      sets: entry.sets.map((set) => set.id !== setId ? set : { ...set, [field]: value }),
    }))
  }

  function addSet(exerciseId: string) {
    setEntries((current) => current.map((entry) => entry.exercise.id !== exerciseId ? entry : {
      ...entry,
      sets: [...entry.sets, blankSet(entry.sets.length + 1)],
    }))
  }

  function removeExercise(id: string) {
    setEntries((current) => current.filter((entry) => entry.exercise.id !== id))
  }

  const availableExercises = exercisesQuery.data?.filter((exercise) => !entries.some((entry) => entry.exercise.id === exercise.id)) ?? []

  return (
    <div className="page-stack">
      <Link to="/workouts" className="back-link"><ArrowLeft size={16} /> Back to workouts</Link>
      <PageHeading eyebrow="NEW SESSION" title="Start a workout" description="Log the work. The progress takes care of itself." />
      {mutation.error && <ErrorState message={apiErrorMessage(mutation.error)} />}
      <Card className="workout-composer">
        <label className="field-label" htmlFor="workout-name">Workout name</label>
        <TextInput id="workout-name" placeholder="e.g. Upper body — strength" value={name} onChange={(event) => setName(event.target.value)} />
      </Card>

      {entries.map((entry) => (
        <Card key={entry.exercise.id} className="exercise-entry">
          <div className="entry-heading">
            <div><span className="eyebrow">{entry.exercise.muscleGroup.toUpperCase()} · {entry.exercise.equipment.toUpperCase()}</span><h2>{entry.exercise.name}</h2></div>
            <button className="icon-button muted-icon" onClick={() => removeExercise(entry.exercise.id)} aria-label={`Remove ${entry.exercise.name}`}><X size={18} /></button>
          </div>
          <div className="set-table-wrap">
            <table className="set-table">
              <thead><tr><th>SET</th><th>KG</th><th>REPS</th><th>RPE</th><th>RIR</th><th>WARMUP</th><th>FAILURE</th></tr></thead>
              <tbody>{entry.sets.map((set) => (
                <tr key={set.id}>
                  <td><span className={`set-number${set.warmup ? ' warmup-number' : ''}`}>{set.warmup ? 'W' : set.number}</span></td>
                  <td><TextInput aria-label={`Set ${set.number} weight`} type="number" min="0" max="999999.99" step="0.01" value={set.weight || ''} onChange={(event) => updateSet(entry.exercise.id, set.id, 'weight', Number(event.target.value))} /></td>
                  <td><TextInput aria-label={`Set ${set.number} reps`} type="number" min="1" step="1" value={set.reps || ''} onChange={(event) => updateSet(entry.exercise.id, set.id, 'reps', Number(event.target.value))} /></td>
                  <td><TextInput aria-label={`Set ${set.number} RPE`} type="number" min="0" max="10" step="0.01" placeholder="—" value={set.rpe ?? ''} onChange={(event) => updateSet(entry.exercise.id, set.id, 'rpe', event.target.value ? Number(event.target.value) : null)} /></td>
                  <td><TextInput aria-label={`Set ${set.number} RIR`} type="number" min="0" step="0.01" placeholder="—" value={set.rir ?? ''} onChange={(event) => updateSet(entry.exercise.id, set.id, 'rir', event.target.value ? Number(event.target.value) : null)} /></td>
                  <td><input aria-label={`Set ${set.number} warmup`} type="checkbox" checked={set.warmup} onChange={(event) => updateSet(entry.exercise.id, set.id, 'warmup', event.target.checked)} /></td>
                  <td><input aria-label={`Set ${set.number} failure`} type="checkbox" checked={set.failure} onChange={(event) => updateSet(entry.exercise.id, set.id, 'failure', event.target.checked)} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Button variant="secondary" size="sm" onClick={() => addSet(entry.exercise.id)}><Plus size={15} /> Add set</Button>
        </Card>
      ))}

      <Card className="add-exercise-row">
        <div><h3>Add an exercise</h3><p className="muted">Choose from your exercise library.</p></div>
        {exercisesQuery.isLoading ? <span className="muted">Loading exercises…</span> : exercisesQuery.error ? <span className="inline-error">Exercises could not be loaded.</span> : (
          <div className="exercise-picker">
            <Select aria-label="Select an exercise" value={selectedExercise} onChange={(event) => {
              const exercise = availableExercises.find((item) => item.id === event.target.value)
              if (exercise) addExercise(exercise)
            }}>
              <option value="">Select exercise…</option>
              {availableExercises.map((exercise) => <option value={exercise.id} key={exercise.id}>{exercise.name} · {exercise.muscleGroup}</option>)}
            </Select>
          </div>
        )}
      </Card>
      <div className="workout-actions">
        <Link to="/workouts" className="text-link">Cancel</Link>
        <Button disabled={mutation.isPending || entries.length === 0 || entries.some((entry) => entry.sets.some((set) =>
          set.weight < 0 || set.weight > 999999.99 || Number(set.weight.toFixed(2)) !== set.weight
          || set.reps <= 0 || !Number.isInteger(set.reps)
          || (set.rpe !== null && (set.rpe < 0 || set.rpe > 10 || Number(set.rpe.toFixed(2)) !== set.rpe))
          || (set.rir !== null && (set.rir < 0 || Number(set.rir.toFixed(2)) !== set.rir)),
        ))} onClick={() => mutation.mutate({
          name: name.trim() || 'Training session',
          date: new Date().toISOString(),
          durationMinutes: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
          exercises: entries,
          completed: true,
        })}>
          <Check size={17} /> {mutation.isPending ? 'Saving…' : 'Complete workout'}
        </Button>
      </div>
    </div>
  )
}

export function WorkoutDetailPage() {
  const { workoutId = '' } = useParams()
  const queryClient = useQueryClient()
  const workoutQuery = useQuery({ queryKey: ['workout', workoutId], queryFn: () => getWorkout(workoutId) })
  const [completedWorkout, setCompletedWorkout] = useState<Workout | null>(null)
  const completeMutation = useMutation({
    mutationFn: completeWorkout,
    onSuccess: async (updated) => {
      setCompletedWorkout(updated)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workout', workoutId] }),
        queryClient.invalidateQueries({ queryKey: ['workouts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['prs'] }),
        queryClient.invalidateQueries({ queryKey: ['exerciseAnalytics'] }),
      ])
    },
  })

  if (workoutQuery.isLoading) return <LoadingState />
  if (workoutQuery.error) return <ErrorState message="This workout couldn't be loaded." retry={() => { void workoutQuery.refetch() }} />
  const workout = workoutQuery.data
  if (!workout) return <Card><EmptyState title="Workout not found" description="This workout may have been removed." action={<Link to="/workouts"><Button variant="secondary">Back to workouts</Button></Link>} /></Card>

  const sets = workout.exercises.reduce((sum, entry) => sum + entry.sets.length, 0)
  return (
    <div className="page-stack">
      <Link to="/workouts" className="back-link"><ArrowLeft size={16} /> Workout history</Link>
      <PageHeading eyebrow={new Date(workout.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} title={workout.name}
        action={<Badge tone={workout.completed ? 'green' : 'amber'}>{workout.completed ? 'Completed' : 'In progress'}</Badge>} />
      {(completedWorkout ?? workout).personalRecords?.map((record) => <div className="pr-notice" key={record.id}><div className="pr-notice-icon"><Trophy size={21} /></div><div><span>NEW PR · {record.type.toUpperCase()}</span><strong>{record.exercise} — {record.value}</strong><p>Previous: {record.previous} · Improvement: {record.improvement}</p></div></div>)}
      {completeMutation.error && <ErrorState message="This workout couldn't be completed. Please try again." />}
      <div className="stats-grid detail-stats">
        <div className="mini-stat"><span>Duration</span><strong>{workout.durationMinutes || '—'}{workout.durationMinutes ? ' min' : ''}</strong></div>
        <div className="mini-stat"><span>Exercises</span><strong>{workout.exercises.length}</strong></div>
        <div className="mini-stat"><span>Sets</span><strong>{sets}</strong></div>
        <div className="mini-stat"><span>Volume</span><strong>{totalVolume(workout).toLocaleString()} kg</strong></div>
      </div>
      {workout.exercises.map((entry) => (
        <Card key={entry.exercise.id} className="detail-exercise">
          <div className="entry-heading"><div><span className="eyebrow">{entry.exercise.muscleGroup.toUpperCase()}</span><h2>{entry.exercise.name}</h2></div><Link className="text-link" to={`/exercises/${entry.exercise.id}`}>Progress <ArrowRight size={14} /></Link></div>
          <div className="set-table-wrap"><table className="set-table detail-table"><thead><tr><th>SET</th><th>WEIGHT</th><th>REPS</th><th>RPE</th><th>RIR</th><th>VOLUME</th></tr></thead>
            <tbody>{entry.sets.map((set) => <tr key={set.id}><td><span className="set-number">{set.number}</span></td><td>{set.weight} kg</td><td>{set.reps}</td><td>{set.rpe ?? '—'}</td><td>{set.rir ?? '—'}</td><td>{(set.weight * set.reps).toLocaleString()} kg</td></tr>)}</tbody>
          </table></div>
        </Card>
      ))}
      {!(completedWorkout ?? workout).completed && <div className="workout-actions"><Button variant="secondary" disabled={completeMutation.isPending} onClick={() => completeMutation.mutate(workout.id)}><Check size={17} /> {completeMutation.isPending ? 'Saving…' : 'Complete workout'}</Button></div>}
    </div>
  )
}
