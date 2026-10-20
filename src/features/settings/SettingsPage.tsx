import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Save } from 'lucide-react'
import { getSettings, updateSettings } from '../../api/settings'
import { isApiConfigured } from '../../api/client'
import { getActiveUser } from '../../api/user'
import type { TrainingSettings } from '../../types'
import { Button, Card, ErrorState, LoadingState, PageHeading } from '../../components/ui'
import { UserSetup } from './UserSetup'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function SettingsPage() {
  if (isApiConfigured) return <UserSetup currentUser={getActiveUser()} />
  return <DemoSettingsPage />
}

function DemoSettingsPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const [trainingDays, setTrainingDays] = useState<string[] | null>(null)
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (settings) => {
      setTrainingDays(settings.trainingDays)
      void queryClient.setQueryData(['settings'], settings)
    },
  })

  if (query.isLoading) return <LoadingState label="Loading your preferences…" />
  if (query.error) return <ErrorState message="Training settings couldn't be loaded." retry={() => { void query.refetch() }} />

  const days = trainingDays ?? query.data?.trainingDays ?? []
  function toggleDay(day: string) {
    setTrainingDays((current) => {
      const selected = current ?? query.data?.trainingDays ?? []
      return selected.includes(day) ? selected.filter((item) => item !== day) : [...selected, day]
    })
  }
  function save() {
    const settings: TrainingSettings = { trainingDays: days }
    mutation.mutate(settings)
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="PREFERENCES" title="Settings" description="Make Level Up work around your training." />
      {mutation.error && <ErrorState message="Your schedule couldn't be saved. Please try again." />}
      {mutation.isSuccess && <div className="success-message" role="status"><Check size={16} /> Schedule saved successfully.</div>}
      <Card className="settings-card">
        <div className="settings-heading"><div><p className="eyebrow">TRAINING SCHEDULE</p><h2>Your training days</h2><p className="muted">Choose the days you usually train. You can change this any time.</p></div><span className="day-count">{days.length}<small>days / week</small></span></div>
        <div className="weekday-list">
          {weekdays.map((day) => {
            const selected = days.includes(day)
            return <button key={day} type="button" aria-pressed={selected} className={`weekday-row${selected ? ' selected' : ''}`} onClick={() => toggleDay(day)}>
              <span className="weekday-name">{day}</span><span className={`weekday-status${selected ? ' on' : ''}`}>{selected ? <><Check size={14} /> Training</> : 'Rest day'}</span><span className={`toggle-switch${selected ? ' on' : ''}`} aria-hidden="true"><span /></span>
            </button>
          })}
        </div>
        <div className="settings-footer"><p>Training frequency is calculated from your selected schedule.</p><Button onClick={save} disabled={mutation.isPending}><Save size={16} /> {mutation.isPending ? 'Saving…' : 'Save schedule'}</Button></div>
      </Card>
      <Card className="settings-note"><div className="settings-note-mark">i</div><div><strong>Built to grow with you</strong><p>Your training preferences are kept separate from activity data, so new modules can be added without changing your schedule.</p></div></Card>
    </div>
  )
}
