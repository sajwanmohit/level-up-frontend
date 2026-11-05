import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { ArrowRight, LockKeyhole, LogOut, Mail, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiErrorMessage } from '../../api/client'
import { clearAuthenticatedSession, isAuthenticated, login, setAuthenticatedSession, signup } from '../../api/auth'
import { getActiveUser, userChangedEventName } from '../../api/user'
import { Button, Card, TextInput } from '../../components/ui'

type AuthMode = 'signup' | 'login'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [signupNotice, setSignupNotice] = useState('')
  const [validationError, setValidationError] = useState('')
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated())
  const isSignup = mode === 'signup'
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const syncSession = () => {
      queryClient.clear()
      setAuthenticated(isAuthenticated())
    }
    window.addEventListener(userChangedEventName(), syncSession)
    return () => window.removeEventListener(userChangedEventName(), syncSession)
  }, [queryClient])

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      setMode('login')
      setSignupNotice('Account created. Log in to continue.')
    },
  })
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      setAuthenticatedSession(session)
      const state = location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null
      const destination = state?.from?.pathname?.startsWith('/') && state.from.pathname !== '/auth'
        ? `${state.from.pathname}${state.from.search ?? ''}${state.from.hash ?? ''}`
        : '/dashboard'
      navigate(destination, { replace: true })
    },
  })
  const mutation = isSignup ? signupMutation : loginMutation

  if (authenticated) {
    const user = getActiveUser()
    return (
      <main className="auth-page auth-account-page">
        <section className="auth-panel">
          <Link to="/dashboard" className="brand auth-brand">
            <span className="brand-mark">L</span>
            <span><strong>level up</strong><small>TRAINING LOG</small></span>
          </Link>
          <div className="auth-content">
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h1 id="auth-title">You’re signed in.</h1>
            <p className="auth-description">Your training workspace is ready.</p>
            <Card className="auth-user-card">
              <span className="avatar">{(user?.name || 'M').slice(0, 1).toUpperCase()}</span>
              <div><strong>{user?.name}</strong><small>{user?.email}</small></div>
            </Card>
            <Button className="auth-submit" onClick={() => navigate('/dashboard')}>Go to dashboard <ArrowRight size={16} /></Button>
            <Button variant="secondary" className="auth-submit auth-logout" onClick={() => {
              clearAuthenticatedSession()
              queryClient.clear()
              setAuthenticated(false)
              navigate('/auth', { replace: true })
            }}><LogOut size={16} /> Sign out</Button>
          </div>
        </section>
      </main>
    )
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setSignupNotice('')
    setValidationError('')
    signupMutation.reset()
    loginMutation.reset()
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <Link to="/dashboard" className="brand auth-brand">
          <span className="brand-mark">L</span>
          <span><strong>level up</strong><small>TRAINING LOG</small></span>
        </Link>

        <div className="auth-content">
          <p className="eyebrow">YOUR TRAINING, YOUR ACCOUNT</p>
          <h1 id="auth-title">{isSignup ? 'Build your next level.' : 'Welcome back.'}</h1>
          <p className="auth-description">
            {isSignup
              ? 'Create an account to keep your training progress together.'
              : 'Sign in to pick up where your training left off.'}
          </p>

          <div className="auth-tabs" role="group" aria-label="Account action">
            <button type="button" aria-pressed={isSignup} onClick={() => changeMode('signup')}>Sign up</button>
            <button type="button" aria-pressed={!isSignup} onClick={() => changeMode('login')}>Log in</button>
          </div>

          <form className="auth-form" onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            const name = String(form.get('name') ?? '').trim()
            const email = String(form.get('email')).trim()
            const password = String(form.get('password'))
            if (isSignup && !name) {
              setValidationError('Enter your name.')
              return
            }
            const passwordCharacters = Array.from(password).length
            if (passwordCharacters < 8 || passwordCharacters > 72) {
              setValidationError('Password must be between 8 and 72 characters.')
              return
            }
            if (new TextEncoder().encode(password).length > 72) {
              setValidationError('Password must be no more than 72 UTF-8 bytes.')
              return
            }
            setValidationError('')
            if (isSignup) {
              signupMutation.mutate({
                name,
                email: email.toLowerCase(),
                password,
              })
            } else {
              loginMutation.mutate({ email: email.toLowerCase(), password })
            }
          }}>
            {isSignup && (
              <label className="auth-field">
                <span>Full name</span>
                <span className="auth-input-wrap"><UserRound size={17} aria-hidden="true" />
                  <TextInput name="name" autoComplete="name" required placeholder="Your name" />
                </span>
              </label>
            )}
            <label className="auth-field">
              <span>Email address</span>
              <span className="auth-input-wrap"><Mail size={17} aria-hidden="true" />
                <TextInput name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" />
              </span>
            </label>
            <label className="auth-field">
              <span>Password</span>
              <span className="auth-input-wrap"><LockKeyhole size={17} aria-hidden="true" />
                <TextInput
                  name="password"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  placeholder="8–72 characters"
                />
              </span>
            </label>
            {signupNotice && <p className="auth-success" role="status">{signupNotice}</p>}
            {validationError && <p className="auth-notice" role="alert">{validationError}</p>}
            {signupMutation.error && isSignup && <p className="auth-notice" role="alert">{apiErrorMessage(signupMutation.error)}</p>}
            {loginMutation.error && !isSignup && (
              <p className="auth-notice" role="alert">
                {axios.isAxiosError(loginMutation.error) && loginMutation.error.response?.status === 401
                  ? 'Email or password is incorrect.'
                  : 'Unable to sign in right now. Please try again.'}
              </p>
            )}
            <Button type="submit" className="auth-submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'} <ArrowRight size={16} />
            </Button>
          </form>

          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : 'New to Level Up?'}{' '}
            <button type="button" onClick={() => changeMode(isSignup ? 'login' : 'signup')}>
              {isSignup ? 'Log in' : 'Create an account'}
            </button>
          </p>
          <p className="auth-preview-note">Your sign-in token is stored for this browser session. The backend validates it on API requests.</p>
        </div>
      </section>

      <aside className="auth-story" aria-label="Level Up training">
        <div className="auth-story-mark"><span>01</span><span>SHOW UP</span></div>
        <div>
          <p className="eyebrow">CONSISTENCY BUILDS STRENGTH</p>
          <h2>Small wins.<br />Stronger you.</h2>
          <p>Track your sessions, celebrate your milestones, and keep moving forward.</p>
        </div>
        <div className="auth-story-footer"><span>TRAIN. TRACK. PROGRESS.</span><span>LEVEL UP / V1</span></div>
      </aside>
    </main>
  )
}
