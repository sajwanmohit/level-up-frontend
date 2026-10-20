import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPRs } from '../../api/prs'
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeading } from '../../components/ui'

export function PRsPage() {
  const query = useQuery({ queryKey: ['prs'], queryFn: getPRs })
  if (query.isLoading) return <LoadingState label="Loading your personal records…" />
  if (query.error) return <ErrorState message="Your PR history couldn't be loaded." retry={() => { void query.refetch() }} />
  const records = query.data ?? []

  return (
    <div className="page-stack">
      <PageHeading eyebrow="PERSONAL RECORDS" title="Proof of progress." description="Every milestone, earned one rep at a time." />
      <div className="pr-intro">
        <div className="pr-intro-icon"><Trophy size={22} /></div>
        <div><span>YOUR MILESTONES</span><strong>{records.length} records tracked</strong><p>Weight, reps, estimated 1RM and volume PRs.</p></div>
        <div className="pr-types">{['WEIGHT', 'REPS', 'EST. 1RM', 'VOLUME'].map((type) => <span key={type}>{type}</span>)}</div>
      </div>
      {records.length ? <div className="records-list">
        {records.map((record) => (
          <Card key={record.id} className="record-card">
            <div className="record-icon"><Trophy size={18} /></div>
            <div className="record-main">
              <div className="record-top"><Badge tone="green">{record.type}</Badge><span>{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
              <h3>{record.exercise}</h3>
              {record.previous && record.improvement && <div className="record-comparison"><span>Previous <strong>{record.previous}</strong></span><ArrowUpRight size={15} /><span className="improvement">{record.improvement}</span></div>}
            </div>
            <div className="record-value"><span>NEW BEST</span><strong>{record.value}</strong></div>
          </Card>
        ))}
      </div> : <Card><EmptyState title="No PRs yet. Complete your first workout to start tracking progression." description="Personal records appear here as you build strength." action={<Link to="/workouts/new" className="button button-primary">Start a workout</Link>} /></Card>}
    </div>
  )
}
