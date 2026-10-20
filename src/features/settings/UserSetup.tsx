import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, UserRound } from 'lucide-react'
import { apiErrorMessage } from '../../api/client'
import { createUser, setActiveUser, type UserProfile } from '../../api/user'
import { Button, Card, PageHeading, Select, TextInput } from '../../components/ui'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function UserSetup({ currentUser }: { currentUser?: UserProfile | null }) {
  const [mode, setMode] = useState<'create' | 'existing'>('create')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [saved, setSaved] = useState(false)
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      setActiveUser(user)
      setSaved(true)
    },
  })

  function useExistingUser() {
    if (!uuidPattern.test(userId.trim())) return
    setActiveUser({ id: userId.trim(), name: 'Existing user', email: '' })
    setSaved(true)
  }

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow={currentUser ? 'ACTIVE PROFILE' : 'GETTING STARTED'}
        title={currentUser ? 'Switch training profile' : 'Set up your profile'}
        description={currentUser
          ? `Connected as ${currentUser.name}. Choose another profile or create a new user.`
          : 'Create a user or connect an existing user ID to load your training.'}
      />
      <Card className="settings-card user-setup-card">
        {saved ? <div className="success-message" role="status"><Check size={16} /> Profile selected. Your training data is ready.</div> : null}
        {mutation.error && <div className="inline-error" role="alert">{apiErrorMessage(mutation.error)}</div>}
        <label className="field-label" htmlFor="user-mode">Profile action</label>
        <Select id="user-mode" value={mode} onChange={(event) => {
          setMode(event.target.value === 'existing' ? 'existing' : 'create')
          setSaved(false)
        }}>
          <option value="create">Create a new user</option>
          <option value="existing">Use an existing user ID</option>
        </Select>
        {mode === 'create' ? (
          <form className="user-form" onSubmit={(event) => {
            event.preventDefault()
            setSaved(false)
            mutation.mutate({ name: name.trim(), email: email.trim() })
          }}>
            <label className="field-label" htmlFor="user-name">Name</label>
            <TextInput id="user-name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            <label className="field-label" htmlFor="user-email">Email</label>
            <TextInput id="user-email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            <Button type="submit" disabled={mutation.isPending}><UserRound size={16} />{mutation.isPending ? 'Creating…' : 'Create and continue'}</Button>
          </form>
        ) : (
          <div className="user-form">
            <label className="field-label" htmlFor="existing-user-id">Existing user ID</label>
            <TextInput id="existing-user-id" value={userId} onChange={(event) => {
              setUserId(event.target.value)
              setSaved(false)
            }} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            <Button type="button" disabled={!uuidPattern.test(userId.trim())} onClick={useExistingUser}>Use this ID</Button>
          </div>
        )}
        <p className="muted">User IDs are stored only in this browser. The backend does not provide authentication or a user directory.</p>
      </Card>
    </div>
  )
}
