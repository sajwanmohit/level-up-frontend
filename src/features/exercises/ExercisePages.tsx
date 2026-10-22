import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Plus, Search, Trophy, X } from 'lucide-react'
import { apiErrorMessage } from '../../api/client'
import { createExercise, getExercise, getExerciseAnalytics, getExercises } from '../../api/exercises'
import { getExercisePRs } from '../../api/prs'
import { ExerciseVolumeChart, StrengthChart } from '../../components/Charts'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeading, Select, StatCard, TextInput } from '../../components/ui'

export function ExercisesPage() {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('All muscles')
  const [equipment, setEquipment] = useState('All equipment')
  const [category, setCategory] = useState('All types')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [exerciseEquipment, setExerciseEquipment] = useState('')
  const [movementType, setMovementType] = useState('')
  const [compound, setCompound] = useState(true)
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['exercises'], queryFn: getExercises })
  const createMutation = useMutation({
    mutationFn: createExercise,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['exercises'] })
      setShowCreate(false)
      setName('')
      setDescription('')
      setMuscleGroup('')
      setExerciseEquipment('')
      setMovementType('')
      setCompound(true)
    },
  })

  if (query.isLoading) return <LoadingState label="Loading exercise library…" />
  if (query.error) return <ErrorState message="The exercise library couldn't be loaded." retry={() => { void query.refetch() }} />
  const exercises = query.data ?? []
  const muscles = [...new Set(exercises.map((exercise) => exercise.muscleGroup))]
  const equipmentOptions = [...new Set(exercises.map((exercise) => exercise.equipment))]
  const filtered = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(search.toLowerCase())
    && (muscle === 'All muscles' || exercise.muscleGroup === muscle)
    && (equipment === 'All equipment' || exercise.equipment === equipment)
    && (category === 'All types' || exercise.category === category),
  )

  return (
    <div className="page-stack">
      <PageHeading eyebrow="MOVEMENT LIBRARY" title="Exercises" description="A clear view of every movement in your training."
        action={<Button onClick={() => setShowCreate((visible) => !visible)}>{showCreate ? <X size={16} /> : <Plus size={16} />}{showCreate ? 'Close' : 'Add exercise'}</Button>} />
      {showCreate && <Card className="settings-card">
        <h2>Add an exercise</h2>
        {createMutation.error && <div className="inline-error" role="alert">{apiErrorMessage(createMutation.error)}</div>}
        <form className="user-form" onSubmit={(event) => {
          event.preventDefault()
          createMutation.mutate({
            name: name.trim(),
            ...(description.trim() ? { description: description.trim() } : {}),
            ...(muscleGroup.trim() ? { muscleGroup: muscleGroup.trim() } : {}),
            ...(exerciseEquipment.trim() ? { equipment: exerciseEquipment.trim() } : {}),
            ...(movementType.trim() ? { movementType: movementType.trim() } : {}),
            compound,
          })
        }}>
          <label className="field-label" htmlFor="exercise-name">Name</label>
          <TextInput id="exercise-name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
          <label className="field-label" htmlFor="exercise-description">Description</label>
          <TextInput id="exercise-description" maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
          <label className="field-label" htmlFor="exercise-muscle">Muscle group</label>
          <TextInput id="exercise-muscle" maxLength={80} value={muscleGroup} onChange={(event) => setMuscleGroup(event.target.value)} />
          <label className="field-label" htmlFor="exercise-equipment">Equipment</label>
          <TextInput id="exercise-equipment" maxLength={80} value={exerciseEquipment} onChange={(event) => setExerciseEquipment(event.target.value)} />
          <label className="field-label" htmlFor="exercise-movement">Movement type</label>
          <TextInput id="exercise-movement" maxLength={40} value={movementType} onChange={(event) => setMovementType(event.target.value)} />
          <label className="weekday-row selected" htmlFor="exercise-compound">
            <span className="weekday-name">Compound exercise</span>
            <input id="exercise-compound" type="checkbox" checked={compound} onChange={(event) => setCompound(event.target.checked)} />
          </label>
          <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving…' : 'Save exercise'}</Button>
        </form>
      </Card>}
      <div className="filter-bar">
        <div className="search-field"><Search size={17} /><TextInput placeholder="Search exercises" aria-label="Search exercises" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <Select aria-label="Filter by muscle group" value={muscle} onChange={(event) => setMuscle(event.target.value)}><option>All muscles</option>{muscles.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select aria-label="Filter by equipment" value={equipment} onChange={(event) => setEquipment(event.target.value)}><option>All equipment</option>{equipmentOptions.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select aria-label="Filter by exercise type" value={category} onChange={(event) => setCategory(event.target.value)}><option>All types</option><option>Compound</option><option>Isolation</option></Select>
      </div>
      {!exercises.length ? <Card><EmptyState title="No exercises in your library" description="Create an exercise to start building your training history." action={<Button onClick={() => setShowCreate(true)}>Add exercise</Button>} /></Card> : filtered.length ? <div className="exercise-grid">
        {filtered.map((exercise) => <Link to={`/exercises/${exercise.id}`} className="exercise-card-link" key={exercise.id}>
          <Card className="exercise-card">
            <div className="exercise-card-top"><span className="exercise-icon">↗</span><ArrowRight size={16} className="muted-icon" /></div>
            <h3>{exercise.name}</h3>
            <div className="exercise-tags"><Badge>{exercise.muscleGroup}</Badge><Badge>{exercise.equipment}</Badge></div>
            {(exercise.latestPerformance !== '—' || exercise.bestE1rm > 0) && <div className="exercise-card-bottom">
              {exercise.latestPerformance !== '—' && <div><span>Latest</span><strong>{exercise.latestPerformance}</strong></div>}
              {exercise.bestE1rm > 0 && <div><span>Best e1RM</span><strong>{exercise.bestE1rm} kg</strong></div>}
            </div>}
          </Card>
        </Link>)}
      </div> : <Card><EmptyState title="No exercises match" description="Try adjusting your search or filters." action={<Button variant="secondary" onClick={() => { setSearch(''); setMuscle('All muscles'); setEquipment('All equipment'); setCategory('All types') }}>Clear filters</Button>} /></Card>}
    </div>
  )
}

export function ExerciseDetailPage() {
  const { exerciseId = '' } = useParams()
  const exerciseQuery = useQuery({ queryKey: ['exercise', exerciseId], queryFn: () => getExercise(exerciseId) })
  const analyticsQuery = useQuery({
    queryKey: ['exerciseAnalytics', exerciseId],
    queryFn: () => getExerciseAnalytics(exerciseId),
    enabled: exerciseQuery.isSuccess && Boolean(exerciseQuery.data),
  })
  const recordsQuery = useQuery({
    queryKey: ['exercisePrs', exerciseId],
    queryFn: () => getExercisePRs(exerciseId),
    enabled: exerciseQuery.isSuccess && Boolean(exerciseQuery.data),
  })

  if (exerciseQuery.isLoading || (exerciseQuery.data && (analyticsQuery.isLoading || recordsQuery.isLoading))) return <LoadingState label="Loading exercise progression…" />
  if (exerciseQuery.error) return <ErrorState message={apiErrorMessage(exerciseQuery.error)} retry={() => { void exerciseQuery.refetch() }} />
  const exercise = exerciseQuery.data
  const analytics = analyticsQuery.data
  if (!exercise || (!analytics && analyticsQuery.error)) return <Card><EmptyState title="Exercise not found" description="Choose an exercise from the library to view its training history." action={<Link to="/exercises"><Button variant="secondary">Exercise library</Button></Link>} /></Card>
  if (!analytics) return <ErrorState message="Exercise progression couldn't be loaded." retry={() => { void analyticsQuery.refetch() }} />
  if (recordsQuery.error) return <ErrorState message={apiErrorMessage(recordsQuery.error)} retry={() => { void recordsQuery.refetch() }} />
  const records = recordsQuery.data ?? []

  return (
    <div className="page-stack">
      <Link to="/exercises" className="back-link"><ArrowLeft size={16} /> Exercise library</Link>
      <PageHeading eyebrow={`${exercise.muscleGroup.toUpperCase()} · ${exercise.equipment.toUpperCase()}`} title={exercise.name} description={exercise.description || `${exercise.movementType || exercise.category} movement · Training progression and recent performance`} action={<Badge>{exercise.category}</Badge>} />
      <div className="stats-grid exercise-stats">
        <StatCard label="Sessions" value={String(analytics.sessions)} icon={<span>↗</span>} />
        <StatCard label="Total sets" value={String(analytics.totalSets)} icon={<span>⌁</span>} />
        <StatCard label="Total volume" value={`${(analytics.totalVolume / 1000).toFixed(1)}k kg`} icon={<span>↕</span>} />
        <StatCard label="Best e1RM" value={analytics.bestE1rm > 0 ? `${analytics.bestE1rm} kg` : '—'} detail={`${analytics.latestE1rm !== undefined ? `Latest ${analytics.latestE1rm} kg · ` : ''}${analytics.prCount} personal records`} icon={<Trophy size={17} />} />
      </div>
      <div className="exercise-best-grid">
        <Card className="best-card"><span>BEST WEIGHT</span><strong>{analytics.bestWeight > 0 ? analytics.bestWeight : '—'} <small>kg</small></strong></Card>
        <Card className="best-card"><span>BEST REPS</span><strong>{analytics.bestReps ?? '—'} <small>reps</small></strong></Card>
        <Card className="best-card"><span>BEST EST. 1RM</span><strong>{analytics.bestE1rm > 0 ? analytics.bestE1rm : '—'} <small>kg</small></strong></Card>
      </div>
      <div className="section-title-row section-title-spaced"><div><p className="eyebrow">PROGRESSION</p><h2>Performance trends</h2></div></div>
      <div className="chart-grid">
        <StrengthChart data={analytics.strengthProgression} />
        <ExerciseVolumeChart data={analytics.volumeOverTime} />
      </div>
      <div className="section-title-row section-title-spaced"><div><p className="eyebrow">MILESTONES</p><h2>Personal records</h2></div></div>
      {records.length ? <div className="records-list">{records.map((record) => <Card className="record-card" key={record.id}>
        <div className="record-main"><div className="record-top"><Badge tone="green">{record.type}</Badge><span>{new Date(record.date).toLocaleDateString()}</span></div><h3>{record.exercise}</h3></div>
        <div className="record-value"><span>NEW BEST</span><strong>{record.value}</strong></div>
      </Card>)}</div> : <Card><EmptyState title="No personal records for this exercise" description="Records will appear here as you progress." /></Card>}
    </div>
  )
}
