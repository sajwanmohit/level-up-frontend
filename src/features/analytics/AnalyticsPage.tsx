import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Dumbbell, Flame, Weight } from 'lucide-react'
import { getDailyAnalytics } from '../../api/analytics'
import { getWorkouts } from '../../api/workouts'
import { mapPersonalRecord } from '../../api/mappers'
import { Badge, Card, DataTable, EmptyState, ErrorState, LoadingState, PageHeading, Select, StatCard } from '../../components/ui'
import type { ApiDailyAnalytics } from '../../types'

export function AnalyticsPage() {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('')
  const workoutsQuery = useQuery({ queryKey: ['workouts'], queryFn: getWorkouts })
  const workouts = workoutsQuery.data ?? []
  const completedWorkouts = workouts.filter((workout) => workout.completed)
  const workoutId = completedWorkouts.some((workout) => workout.id === selectedWorkoutId)
    ? selectedWorkoutId
    : completedWorkouts[0]?.id ?? ''
  const analyticsQuery = useQuery({
    queryKey: ['dailyAnalytics', workoutId],
    queryFn: () => getDailyAnalytics(workoutId),
    enabled: Boolean(workoutId),
  })

  if (workoutsQuery.isLoading) return <LoadingState label="Loading completed workouts…" />
  if (workoutsQuery.error) return <ErrorState message="Completed workouts couldn't be loaded." retry={() => { void workoutsQuery.refetch() }} />
  if (!completedWorkouts.length) {
    return (
      <div className="page-stack">
        <PageHeading eyebrow="TRAINING INTELLIGENCE" title="Your work, visualized." description="Review the details of a completed training session." />
        <Card><EmptyState title="No completed workouts yet" description="Complete a workout to see its working sets, volume, RPE, and estimated one-rep max." /></Card>
      </div>
    )
  }
  if (analyticsQuery.isLoading) return <LoadingState label="Preparing your workout analysis…" />
  if (analyticsQuery.error) return <ErrorState message="Workout analytics couldn't be loaded." retry={() => { void analyticsQuery.refetch() }} />
  const analytics = analyticsQuery.data
  if (!analytics) return <ErrorState message="No analytics data was returned." />

  return <DailyAnalyticsView
    analytics={analytics}
    workouts={completedWorkouts.map((workout) => ({ id: workout.id, name: workout.name, date: workout.date }))}
    selectedWorkoutId={workoutId}
    onSelect={setSelectedWorkoutId}
  />
}

function DailyAnalyticsView({
  analytics,
  workouts,
  selectedWorkoutId,
  onSelect,
}: {
  analytics: ApiDailyAnalytics
  workouts: { id: string; name: string; date: string }[]
  selectedWorkoutId: string
  onSelect: (id: string) => void
}) {
  const records = analytics.prs.map(mapPersonalRecord)

  return (
    <div className="page-stack">
      <PageHeading eyebrow="TRAINING INTELLIGENCE" title="Your work, visualized." description="Review the details of a completed training session." />
      <label className="filter-label"><Dumbbell size={16} /><Select aria-label="Choose a completed workout" value={selectedWorkoutId} onChange={(event) => onSelect(event.target.value)}>
        {workouts.map((workout) => <option value={workout.id} key={workout.id}>{workout.date} · {workout.name}</option>)}
      </Select></label>
      <div className="stats-grid">
        <StatCard label="Exercises" value={String(analytics.totalExercises)} detail="In this session" icon={<Dumbbell size={17} />} />
        <StatCard label="Working sets" value={String(analytics.totalWorkingSets)} detail={`${analytics.totalWarmupSets} warmup sets excluded`} icon={<ArrowUpRight size={17} />} />
        <StatCard label="Total volume" value={`${analytics.totalVolume.toLocaleString()} kg`} detail={`${analytics.totalReps} working reps`} icon={<Weight size={17} />} />
        <StatCard label="Average RPE" value={analytics.averageRpe === null ? '—' : `${analytics.averageRpe}`} detail={analytics.averageRir === null ? 'No RIR recorded' : `Average RIR ${analytics.averageRir}`} icon={<Flame size={17} />} />
      </div>
      <div className="section-title-row section-title-spaced"><div><p className="eyebrow">SESSION DETAILS</p><h2>Exercise breakdown</h2></div><span className="date-chip">{analytics.date}</span></div>
      <Card className="table-card"><DataTable
        rows={analytics.exercises}
        getRowKey={(row) => row.exerciseId}
        columns={[
          { key: 'exercise', heading: 'EXERCISE', render: (row) => row.exerciseName },
          { key: 'sets', heading: 'SETS', render: (row) => `${row.workingSets} working / ${row.sets} total` },
          { key: 'reps', heading: 'REPS', render: (row) => row.reps },
          { key: 'volume', heading: 'VOLUME', render: (row) => `${row.volume.toLocaleString()} kg` },
          { key: 'rpe', heading: 'AVG. RPE', render: (row) => row.averageRpe ?? '—' },
        ]}
      /></Card>
      <div className="section-title-row section-title-spaced"><div><p className="eyebrow">STRENGTH MILESTONES</p><h2>Estimated one-rep max</h2></div></div>
      {analytics.estimatedOneRepMaxChanges.length ? <div className="pr-list">
        {analytics.estimatedOneRepMaxChanges.map((change) => <Card className="pr-row" key={change.exerciseId}>
          <div className="pr-copy"><strong>{change.exerciseName}</strong><span>Estimated one-rep max</span></div>
          <div className="pr-values"><strong>{change.estimatedOneRepMax.toFixed(2)} kg</strong></div>
        </Card>)}
      </div> : <Card><EmptyState title="No working sets to analyze" description="Working sets are used to calculate estimated one-rep max." /></Card>}
      {records.length > 0 && <div className="records-list">
        {records.map((record) => <Card key={record.id} className="record-card">
          <div className="record-main"><div className="record-top"><Badge tone="green">{record.type}</Badge><span>{new Date(record.date).toLocaleDateString()}</span></div><h3>{record.exercise}</h3></div>
          <div className="record-value"><span>NEW BEST</span><strong>{record.value}</strong></div>
        </Card>)}
      </div>}
    </div>
  )
}
