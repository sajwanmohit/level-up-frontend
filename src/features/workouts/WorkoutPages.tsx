import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Trophy, X } from 'lucide-react'
import { apiErrorMessage, isApiNotFound } from '../../api/client'
import { getExercises } from '../../api/exercises'
import {
  addExerciseToWorkout,
  addSetToExerciseSession,
  completeWorkout,
  createWorkout,
  deleteSet,
  deleteWorkout,
  getWorkout,
  getWorkouts,
  removeExerciseFromWorkout,
  updateSet,
} from '../../api/workouts'
import type { Exercise, SetEntry, SetRequest, Workout, WorkoutExercise } from '../../types'
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeading, Select, TextInput } from '../../components/ui'

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
  return workout.exercises.reduce((total, entry) => total + entry.sets.reduce((sum, set) => sum + (set.warmup ? 0 : set.weight * set.reps), 0), 0)
}

function WorkoutSetRow({
  set,
  editable,
  pending,
  onUpdate,
  onDelete,
}: {
  set: SetEntry
  editable: boolean
  pending: boolean
  onUpdate: (request: SetRequest) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [weight, setWeight] = useState(String(set.weight))
  const [reps, setReps] = useState(String(set.reps))
  const [rpe, setRpe] = useState(set.rpe === null ? '' : String(set.rpe))
  const [rir, setRir] = useState(set.rir === null ? '' : String(set.rir))
  const [warmup, setWarmup] = useState(set.warmup)
  const [failure, setFailure] = useState(set.failure)
  const parsedWeight = Number(weight)
  const parsedReps = Number(reps)
  const parsedRpe = rpe === '' ? undefined : Number(rpe)
  const parsedRir = rir === '' ? undefined : Number(rir)
  const valid = weight !== '' && Number.isFinite(parsedWeight) && parsedWeight >= 0
    && parsedWeight <= 999999.99 && Number(parsedWeight.toFixed(2)) === parsedWeight
    && reps !== '' && Number.isInteger(parsedReps) && parsedReps > 0
    && (parsedRpe === undefined || (Number.isFinite(parsedRpe) && parsedRpe >= 0 && parsedRpe <= 10))
    && (parsedRir === undefined || (Number.isFinite(parsedRir) && parsedRir >= 0))

  return (
    <tr>
      <td><span className={`set-number${set.warmup ? ' warmup-number' : ''}`}>{set.warmup ? 'W' : set.number}</span></td>
      <td>{editing ? <TextInput aria-label={`Edit set ${set.number} weight`} type="number" min="0" max="999999.99" step="0.01" value={weight} onChange={(event) => setWeight(event.target.value)} /> : `${set.weight} kg`}</td>
      <td>{editing ? <TextInput aria-label={`Edit set ${set.number} reps`} type="number" min="1" step="1" value={reps} onChange={(event) => setReps(event.target.value)} /> : set.reps}</td>
      <td>{editing ? <TextInput aria-label={`Edit set ${set.number} RPE`} type="number" min="0" max="10" step="any" value={rpe} onChange={(event) => setRpe(event.target.value)} /> : set.rpe ?? '—'}</td>
      <td>{editing ? <TextInput aria-label={`Edit set ${set.number} RIR`} type="number" min="0" step="any" value={rir} onChange={(event) => setRir(event.target.value)} /> : set.rir ?? '—'}</td>
      <td>{editing ? <input aria-label={`Edit set ${set.number} warmup`} type="checkbox" checked={warmup} onChange={(event) => setWarmup(event.target.checked)} /> : set.warmup ? 'Yes' : 'No'}</td>
      <td>{editing ? <input aria-label={`Edit set ${set.number} failure`} type="checkbox" checked={failure} onChange={(event) => setFailure(event.target.checked)} /> : set.failure ? 'Yes' : 'No'}</td>
      <td>{set.warmup ? '—' : `${(set.weight * set.reps).toLocaleString()} kg`}</td>
      {editable && <td className="set-actions">
        {editing ? <>
          <Button size="sm" disabled={pending || !valid} onClick={() => {
            onUpdate({
              setNumber: set.number,
              weight: parsedWeight,
              reps: parsedReps,
              ...(parsedRpe === undefined ? {} : { rpe: parsedRpe }),
              ...(parsedRir === undefined ? {} : { rir: parsedRir }),
              warmup,
              failure,
            })
          }}>{pending ? 'Saving…' : 'Save'}</Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setEditing(false)}>Cancel</Button>
        </> : <>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={onDelete} aria-label={`Delete set ${set.number}`}><X size={15} /></Button>
        </>}
      </td>}
    </tr>
  )
}

export function WorkoutsPage() {
  const query = useQuery({ queryKey: ['workouts'], queryFn: () => getWorkouts() })
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
              <div className="workout-info"><div className="workout-name-line"><h3>{workout.name}</h3><Badge tone={workout.completed ? 'green' : 'amber'}>{workout.completed ? 'Completed' : 'In progress'}</Badge></div><p>{workout.exercises.length ? workout.exercises.map((item) => item.exercise.name).join(' · ') : 'Open to see exercises and sets'}</p></div>
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

  function submitWorkout(completed: boolean) {
    const now = new Date()
    mutation.mutate({
      name: name.trim() || 'Training session',
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      startedAt: new Date(startedAt).toISOString(),
      durationMinutes: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      exercises: entries,
      completed,
    })
  }

  const availableExercises = exercisesQuery.data?.filter((exercise) => !entries.some((entry) => entry.exercise.id === exercise.id)) ?? []
  const hasInvalidSet = entries.some((entry) => entry.sets.some((set) =>
    !Number.isFinite(set.weight) || set.weight < 0 || set.weight > 999999.99
    || Number(set.weight.toFixed(2)) !== set.weight
    || !Number.isInteger(set.reps) || set.reps <= 0
    || (set.rpe !== null && (!Number.isFinite(set.rpe) || set.rpe < 0 || set.rpe > 10))
    || (set.rir !== null && (!Number.isFinite(set.rir) || set.rir < 0)),
  ))

  return (
    <div className="page-stack">
      <Link to="/workouts" className="back-link"><ArrowLeft size={16} /> Back to workouts</Link>
      <PageHeading eyebrow="NEW SESSION" title="Start a workout" description="Log the work. The progress takes care of itself." />
      {mutation.error && <ErrorState message={apiErrorMessage(mutation.error)} />}
      <Card className="workout-composer">
        <label className="field-label" htmlFor="workout-name">Workout name</label>
        <TextInput id="workout-name" maxLength={120} placeholder="e.g. Upper body — strength" value={name} onChange={(event) => setName(event.target.value)} />
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
                  <td><TextInput aria-label={`Set ${set.number} RPE`} type="number" min="0" max="10" step="any" placeholder="—" value={set.rpe ?? ''} onChange={(event) => updateSet(entry.exercise.id, set.id, 'rpe', event.target.value ? Number(event.target.value) : null)} /></td>
                  <td><TextInput aria-label={`Set ${set.number} RIR`} type="number" min="0" step="any" placeholder="—" value={set.rir ?? ''} onChange={(event) => updateSet(entry.exercise.id, set.id, 'rir', event.target.value ? Number(event.target.value) : null)} /></td>
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
        <Button variant="secondary" disabled={mutation.isPending || entries.length === 0 || hasInvalidSet} onClick={() => submitWorkout(false)}>
          {mutation.isPending ? 'Saving…' : 'Save draft'}
        </Button>
        <Button disabled={mutation.isPending || entries.length === 0 || hasInvalidSet} onClick={() => submitWorkout(true)}>
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
  const workout = workoutQuery.data
  const [completedWorkout, setCompletedWorkout] = useState<Workout | null>(null)
  const editable = Boolean(workout && !(completedWorkout ?? workout).completed)
  const exerciseQuery = useQuery({
    queryKey: ['exercises'],
    queryFn: getExercises,
    enabled: editable,
  })
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const refreshWorkout = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['workout', workoutId] }),
    queryClient.invalidateQueries({ queryKey: ['workouts'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] }),
  ])
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
  const addExerciseMutation = useMutation({
    mutationFn: (input: { exerciseId: string; exerciseOrder: number }) => addExerciseToWorkout(workoutId, input),
    onSuccess: async () => {
      setSelectedExerciseId('')
      await refreshWorkout()
    },
  })
  const removeExerciseMutation = useMutation({
    mutationFn: (exerciseSessionId: string) => removeExerciseFromWorkout(workoutId, exerciseSessionId),
    onSuccess: refreshWorkout,
  })
  const addSetMutation = useMutation({
    mutationFn: ({ sessionId, request }: { sessionId: string; request: SetRequest }) => addSetToExerciseSession(sessionId, request),
    onSuccess: refreshWorkout,
  })
  const updateSetMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: SetRequest }) => updateSet(id, request),
    onSuccess: refreshWorkout,
  })
  const deleteSetMutation = useMutation({
    mutationFn: deleteSet,
    onSuccess: refreshWorkout,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteWorkout,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workouts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] }),
        queryClient.invalidateQueries({ queryKey: ['dailyAnalytics'] }),
        queryClient.invalidateQueries({ queryKey: ['prs'] }),
        queryClient.invalidateQueries({ queryKey: ['exerciseAnalytics'] }),
      ])
      navigate('/workouts')
    },
  })
  const navigate = useNavigate()
  const availableExercises = (exerciseQuery.data ?? []).filter((exercise) =>
    !workout?.exercises.some((entry) => entry.exercise.id === exercise.id),
  )
  const exerciseOrder = Math.max(0, ...(workout?.exercises.map((entry) => entry.order ?? 0) ?? [])) + 1

  if (workoutQuery.isLoading) return <LoadingState />
  if (workoutQuery.error && isApiNotFound(workoutQuery.error)) return <Card><EmptyState title="Workout not found" description="This workout may have been removed." action={<Link to="/workouts"><Button variant="secondary">Back to workouts</Button></Link>} /></Card>
  if (workoutQuery.error) return <ErrorState message={apiErrorMessage(workoutQuery.error)} retry={() => { void workoutQuery.refetch() }} />
  if (!workout) return <Card><EmptyState title="Workout not found" description="This workout may have been removed." action={<Link to="/workouts"><Button variant="secondary">Back to workouts</Button></Link>} /></Card>

  const sets = workout.exercises.reduce((sum, entry) => sum + entry.sets.length, 0)
  const currentWorkout = completedWorkout ?? workout
  return (
    <div className="page-stack">
      <Link to="/workouts" className="back-link"><ArrowLeft size={16} /> Workout history</Link>
      <PageHeading eyebrow={new Date(workout.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} title={workout.name}
        action={<Badge tone={currentWorkout.completed ? 'green' : 'amber'}>{currentWorkout.completed ? 'Completed' : 'In progress'}</Badge>} />
      {(completedWorkout ?? workout).personalRecords?.map((record) => <div className="pr-notice" key={record.id}><div className="pr-notice-icon"><Trophy size={21} /></div><div><span>NEW PR · {record.type.toUpperCase()}</span><strong>{record.exercise} — {record.value}</strong></div></div>)}
      {completeMutation.error && <ErrorState message={apiErrorMessage(completeMutation.error)} />}
      {deleteMutation.error && <ErrorState message={apiErrorMessage(deleteMutation.error)} />}
      {addExerciseMutation.error && <ErrorState message={apiErrorMessage(addExerciseMutation.error)} />}
      {removeExerciseMutation.error && <ErrorState message={apiErrorMessage(removeExerciseMutation.error)} />}
      {addSetMutation.error && <ErrorState message={apiErrorMessage(addSetMutation.error)} />}
      {updateSetMutation.error && <ErrorState message={apiErrorMessage(updateSetMutation.error)} />}
      {deleteSetMutation.error && <ErrorState message={apiErrorMessage(deleteSetMutation.error)} />}
      {editable && exerciseQuery.error && <ErrorState message={apiErrorMessage(exerciseQuery.error)} retry={() => { void exerciseQuery.refetch() }} />}
      <div className="stats-grid detail-stats">
        <div className="mini-stat"><span>Duration</span><strong>{workout.durationMinutes || '—'}{workout.durationMinutes ? ' min' : ''}</strong></div>
        <div className="mini-stat"><span>Exercises</span><strong>{workout.exercises.length}</strong></div>
        <div className="mini-stat"><span>Sets</span><strong>{sets}</strong></div>
        <div className="mini-stat"><span>Volume</span><strong>{totalVolume(workout).toLocaleString()} kg</strong></div>
      </div>
      {workout.exercises.map((entry) => (
        <Card key={entry.exercise.id} className="detail-exercise">
          <div className="entry-heading"><div><span className="eyebrow">{entry.exercise.muscleGroup.toUpperCase()}</span><h2>{entry.exercise.name}</h2></div><div className="entry-actions"><Link className="text-link" to={`/exercises/${entry.exercise.id}`}>Progress <ArrowRight size={14} /></Link>{editable && entry.sessionId && <Button variant="ghost" size="sm" disabled={removeExerciseMutation.isPending} onClick={() => entry.sessionId && removeExerciseMutation.mutate(entry.sessionId)} aria-label={`Remove ${entry.exercise.name} from workout`}><X size={16} /></Button>}</div></div>
          <div className="set-table-wrap"><table className="set-table detail-table"><thead><tr><th>SET</th><th>WEIGHT</th><th>REPS</th><th>RPE</th><th>RIR</th><th>WARMUP</th><th>FAILURE</th><th>VOLUME</th>{editable && <th>ACTIONS</th>}</tr></thead>
            <tbody>{entry.sets.map((set) => <WorkoutSetRow
              key={set.id}
              set={set}
              editable={editable}
              pending={updateSetMutation.isPending || deleteSetMutation.isPending}
              onUpdate={(request) => updateSetMutation.mutate({ id: set.id, request })}
              onDelete={() => deleteSetMutation.mutate(set.id)}
            />)}</tbody>
          </table></div>
          {editable && entry.sessionId && <Button variant="secondary" size="sm" disabled={addSetMutation.isPending} onClick={() => {
            const setNumber = Math.max(0, ...entry.sets.map((set) => set.number)) + 1
            if (entry.sessionId) addSetMutation.mutate({ sessionId: entry.sessionId, request: { setNumber, weight: 0, reps: 1, warmup: false, failure: false } })
          }}><Plus size={15} /> Add set</Button>}
        </Card>
      ))}
      {editable && <Card className="add-exercise-row">
        <div><h3>Add an exercise</h3><p className="muted">Choose from your exercise library.</p></div>
        {exerciseQuery.isLoading ? <span className="muted">Loading exercises…</span> : (
          <Select aria-label="Add exercise to workout" value={selectedExerciseId} disabled={addExerciseMutation.isPending} onChange={(event) => {
            setSelectedExerciseId(event.target.value)
            if (event.target.value) addExerciseMutation.mutate({ exerciseId: event.target.value, exerciseOrder })
          }}>
            <option value="">Select exercise…</option>
            {availableExercises.map((exercise) => <option value={exercise.id} key={exercise.id}>{exercise.name} · {exercise.muscleGroup}</option>)}
          </Select>
        )}
      </Card>}
      <div className="workout-actions">
        {!(completedWorkout ?? workout).completed && <Button variant="secondary" disabled={completeMutation.isPending} onClick={() => completeMutation.mutate(workout.id)}><Check size={17} /> {completeMutation.isPending ? 'Saving…' : 'Complete workout'}</Button>}
        <Button variant="ghost" disabled={deleteMutation.isPending} onClick={() => setShowDeleteConfirmation(true)}><Trash2 size={16} /> {deleteMutation.isPending ? 'Deleting…' : 'Delete workout'}</Button>
      </div>
      <ConfirmDialog
        open={showDeleteConfirmation}
        title="Delete workout?"
        message="This permanently removes the workout and its exercises, sets, and associated records."
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete workout'}
        onCancel={() => setShowDeleteConfirmation(false)}
        onConfirm={() => deleteMutation.mutate(workout.id)}
      />
    </div>
  )
}
