import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Clock3, Dumbbell, Flame, Plus, Trophy, Weight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardAnalytics } from '../../api/analytics'
import { getPRs } from '../../api/prs'
import { getWorkout, getWorkouts } from '../../api/workouts'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeading, StatCard } from '../../components/ui'
import type { WorkoutExercise } from '../../types'

function volumeOf(exercises: WorkoutExercise[]) {
  return exercises.reduce((total, entry) => total + entry.sets.reduce((sum, set) => sum + (set.warmup ? 0 : set.weight * set.reps), 0), 0)
}

export function DashboardPage() {
  const workoutQuery = useQuery({ queryKey: ['workouts'], queryFn: getWorkouts })
  const analyticsQuery = useQuery({ queryKey: ['dashboardAnalytics'], queryFn: getDashboardAnalytics })
  const prsQuery = useQuery({ queryKey: ['prs'], queryFn: getPRs })

  const workouts = workoutQuery.data ?? []
  const today = workouts.find((workout) => {
    const date = workout.date.length === 10 ? new Date(`${workout.date}T00:00:00`) : new Date(workout.date)
    return date.toDateString() === new Date().toDateString()
  })
  const todayDetailQuery = useQuery({
    queryKey: ['workout', today?.id],
    queryFn: () => today ? getWorkout(today.id) : Promise.resolve(null),
    enabled: Boolean(today),
  })

  if (workoutQuery.isLoading || analyticsQuery.isLoading || prsQuery.isLoading || todayDetailQuery.isLoading) return <LoadingState />
  if (workoutQuery.error || analyticsQuery.error || prsQuery.error || todayDetailQuery.error) {
    return <ErrorState message="We couldn't load your dashboard. Check your connection and try again." retry={() => { void workoutQuery.refetch(); void analyticsQuery.refetch(); void prsQuery.refetch(); void todayDetailQuery.refetch() }} />
  }

  const todayView = todayDetailQuery.data ?? today
  const analytics = analyticsQuery.data
  const prs = prsQuery.data ?? []

  return (
    <div className="page-stack">
      <PageHeading eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()} title="Good morning, athlete." description="Your training, at a glance."
        action={<Link to="/workouts/new"><Button><Plus size={17} /> Start workout</Button></Link>} />
      <div className="section-title-row"><div><p className="eyebrow">TODAY</p><h2>Today's workout</h2></div><Link className="text-link" to="/workouts">Workout history <ArrowRight size={15} /></Link></div>
      {today ? (
        <Card className="today-card">
          <div className="today-topline"><Badge tone={today.completed ? 'green' : 'amber'}>{today.completed ? 'Completed' : 'In progress'}</Badge><span className="muted">{today.completed ? 'Nice work today' : 'Ready when you are'}</span></div>
          <div className="today-main">
            <div><h3>{today.name}</h3><p className="muted">{todayView?.exercises.length ? todayView.exercises.map((item) => item.exercise.name).join(' · ') : 'Open workout to review session details'}</p></div>
            <Link to={`/workouts/${today.id}`} className="icon-button" aria-label="Open workout"><ArrowRight size={19} /></Link>
          </div>
          <div className="today-metrics">
            <div><Dumbbell size={16} /><span>{(todayView ?? today).exercises.reduce((sum, entry) => sum + entry.sets.length, 0)} sets</span></div>
            <div><Weight size={16} /><span>{volumeOf((todayView ?? today).exercises).toLocaleString()} kg volume</span></div>
            <div><Trophy size={16} /><span>{prs.filter((pr) => new Date(pr.date).toDateString() === new Date().toDateString()).length} PRs</span></div>
            <div><Clock3 size={16} /><span>{(todayView ?? today).durationMinutes} min</span></div>
          </div>
        </Card>
      ) : (
        <Card><EmptyState title="No workout logged today" description="Start a session and make today count." action={<Link to="/workouts/new"><Button><Plus size={16} /> Start workout</Button></Link>} /></Card>
      )}

      <div className="section-title-row section-title-spaced"><div><p className="eyebrow">YOUR TRAINING</p><h2>All time</h2></div><span className="date-chip"><CalendarDays size={15} /> Overall totals</span></div>
      {analytics && <div className="stats-grid">
        <StatCard label="Total workouts" value={String(analytics.totalWorkouts)} detail="All time" icon={<Dumbbell size={17} />} />
        <StatCard label="Personal records" value={String(analytics.totalPrs)} detail="All time" icon={<Trophy size={17} />} />
        <StatCard label="Training volume" value={`${analytics.totalVolume.toLocaleString()} kg`} detail="Working sets" icon={<Weight size={17} />} />
        <StatCard label="Exercises" value={String(analytics.exerciseCount)} detail="In your training history" icon={<Flame size={17} />} />
      </div>}

      <div className="section-title-row section-title-spaced"><div><p className="eyebrow">DAILY BREAKDOWN</p><h2>Analyze a completed workout</h2></div><Link className="text-link" to="/analytics">View analytics <ArrowRight size={15} /></Link></div>

      <div className="section-title-row section-title-spaced"><div><p className="eyebrow">MILESTONES</p><h2>Recent PRs</h2></div><Link className="text-link" to="/prs">View all <ArrowRight size={15} /></Link></div>
      {prs.length ? <div className="pr-list">
        {prs.slice(0, 3).map((pr) => (
          <Card key={pr.id} className="pr-row">
            <div className="pr-symbol"><Trophy size={18} /></div>
            <div className="pr-copy"><strong>{pr.exercise}</strong><span>{pr.type} · {new Date(pr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
            <div className="pr-values"><strong>{pr.value}</strong>{pr.previous && <span>from {pr.previous}</span>}</div>
            {pr.improvement && <Badge tone="green">{pr.improvement}</Badge>}
          </Card>
        ))}
      </div> : <Card><EmptyState title="No PRs yet" description="Complete your first workout to start tracking progression." /></Card>}
    </div>
  )
}
