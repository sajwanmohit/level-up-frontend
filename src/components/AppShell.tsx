import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity, BarChart3, Dumbbell, LayoutDashboard, UserRound, Trophy, Plus, ArrowUpRight,
} from 'lucide-react'
import { getActiveUser, userChangedEventName, type UserProfile } from '../api/user'
import { isAuthenticated } from '../api/auth'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workouts', label: 'Workouts', icon: Activity },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/prs', label: 'Personal records', icon: Trophy },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AppShell() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [activeUser, setActiveUser] = useState<UserProfile | null>(() => getActiveUser())
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated())

  useEffect(() => {
    const syncUser = () => {
      queryClient.clear()
      setActiveUser(getActiveUser())
      setAuthenticated(isAuthenticated())
    }
    window.addEventListener(userChangedEventName(), syncUser)
    return () => window.removeEventListener(userChangedEventName(), syncUser)
  }, [queryClient])

  if (!authenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/dashboard" className="brand">
          <span className="brand-mark">L</span>
          <span><strong>level up</strong><small>TRAINING LOG</small></span>
        </NavLink>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/auth" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <UserRound size={18} strokeWidth={1.8} /><span>Account</span>
          </NavLink>
          <div className="sidebar-note">
            <div className="avatar">{(activeUser?.name || 'M').slice(0, 1).toUpperCase()}</div>
            <div><strong>{activeUser?.name || 'Member'}</strong><small>{activeUser?.id ?? 'Set up profile'}</small></div>
            <ArrowUpRight size={15} />
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="mobile-header">
          <NavLink to="/dashboard" className="brand">
            <span className="brand-mark">L</span><strong>level up</strong>
          </NavLink>
          <NavLink to="/workouts/new" className="mobile-start" aria-label="Start workout"><Plus size={19} /></NavLink>
        </header>
        <div className="mobile-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} aria-label={label} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>
              <Icon size={19} />
            </NavLink>
          ))}
          <NavLink to="/auth" aria-label="Account" className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>
            <UserRound size={19} />
          </NavLink>
        </div>
        <main className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer"><span>Train. Track. Progress.</span><span>LEVEL UP / V1</span></footer>
      </div>
    </div>
  )
}
