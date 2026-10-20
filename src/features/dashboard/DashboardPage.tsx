import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Check, Clock3, Dumbbell, Flame, Plus, Trophy, Weight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardAnalytics } from '../../api/analytics'
import { getPRs } from '../../api/prs'
import { getWorkout, getWorkouts } from '../../api/workouts'
import { isApiConfigured } from '../../api/client'
import { FrequencyChart, StrengthChart, WeeklyVolumeChart } from '../../components/Charts'
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
    enabled: isApiConfigured && Boolean(today),
  })

  if (workoutQuery.isLoading || analyticsQuery.isLoading || prsQuery.isLoading || todayDetailQuery.isLoading) return <LoadingState />
  if (workoutQuery.error || analyticsQuery.error || prsQuery.error || todayDetailQuery.error) {
    return <ErrorState message="We couldn't load your dashboard. Check your connection and try again." retry={() => { void workoutQuery.refetch(); void analyticsQuery.refetch(); void prsQuery.refetch(); void todayDetailQuery.refetch() }} />
  }

  const todayView = isApiConfigured ? todayDetailQuery.data ?? today : today
  const analytics = analyticsQuery.data
  const prs = prsQuery.data ?? []
  const apiAnalytics = analytics && 'totalWorkouts' in analytics ? analytics : null
  const demoAnalytics = analytics && 'workoutsThisWeek' in analytics ? analytics : null

  return (
    <div className="page-stack">
      <PageHeading eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()} title="Good morning, athlete." description="Your training, at a glance."
        action={<Link to="/workouts/new"><Button><Plus size={17} /> Start workout</Button></Link>} />
      {!isApiConfigured && <div className="demo-notice"><span><span className="demo-dot" /> DEMO DATA</span><span>Connect your API in <code>.env.local</code> to sync your training.</span></div>}

      <div className="section-title-row"><div><p className="eyebrow">TODAY</p><h2>Today's workout</h2></div><Link className="text-link" to="/workouts">Workout history <ArrowRight size={15} /></Link></div>
      {today ? (
        <Card className="today-card">
          <div className="today-topline"><Badge tone={today.completed ? 'green' : 'amber'}>{today.completed ? 'Completed' : 'In progress'}</Badge><span className="muted">{today.completed ? 'Nice work today' : 'Ready when you are'}</span></div>
          <div className="today-main">
            <div><h3>{today.name}</h3><p className="muted">{todayView?.exercises.length ? todayView.exercises.map((item) => item.exercise.name).join(' · ') : isApiConfigured ? 'Open workout to review session details' : ''}</p></div>
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

      <div className="section-title-row section-title-spaced"><div><p className="eyebrow">YOUR TRAINING</p><h2>{isApiConfigured ? 'All time' : 'This week'}</h2></div><span className="date-chip"><CalendarDays size={15} /> {isApiConfigured ? 'Overall totals' : 'Last 7 days'}</span></div>
      {apiAnalytics && <div className="stats-grid">
        <StatCard label="Total workouts" value={String(apiAnalytics.totalWorkouts)} detail="All time" icon={<Dumbbell size={17} />} />
        <StatCard label="Personal records" value={String(apiAnalytics.totalPrs)} detail="All time" icon={<Trophy size={17} />} />
        <StatCard label="Training volume" value={`${apiAnalytics.totalVolume.toLocaleString()} kg`} detail="Working sets" icon={<Weight size={17} />} />
        <StatCard label="Exercises" value={String(apiAnalytics.exerciseCount)} detail="In your training history" icon={<Flame size={17} />} />
      </div>}
      {demoAnalytics && <div className="stats-grid">
        <StatCard label="Workouts" value={String(demoAnalytics.workoutsThisWeek)} detail="This week" icon={<Dumbbell size={17} />} />
        <StatCard label="Total sets" value={String(demoAnalytics.totalSets)} detail="Across all sessions" icon={<Check size={17} />} />
        <StatCard label="Training volume" value={`${(demoAnalytics.totalVolume / 1000).toFixed(1)}k`} detail="Kilograms moved" icon={<Weight size={17} />} />
        <StatCard label="PRs this month" value={String(demoAnalytics.prsThisMonth)} detail={`${demoAnalytics.consistency}% training consistency`} icon={<Flame size={17} />} />
      </div>}

      <div className="section-title-row section-title-spaced"><div><p className="eyebrow">{isApiConfigured ? 'DAILY BREAKDOWN' : 'KEEP MOVING FORWARD'}</p><h2>{isApiConfigured ? 'Analyze a completed workout' : 'Progress over time'}</h2></div><Link className="text-link" to="/analytics">{isApiConfigured ? 'View analytics' : 'Full analytics'} <ArrowRight size={15} /></Link></div>
      {demoAnalytics && <div className="chart-grid dashboard-charts">
        <WeeklyVolumeChart data={demoAnalytics.weeklyVolume} />
        <StrengthChart data={demoAnalytics.strengthProgression} />
        <FrequencyChart data={demoAnalytics.workoutFrequency} />
      </div>}

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
