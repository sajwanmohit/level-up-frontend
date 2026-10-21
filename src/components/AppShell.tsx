import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity, BarChart3, Dumbbell, LayoutDashboard, Settings2, Trophy, Plus, ArrowUpRight,
} from 'lucide-react'
import { isApiConfigured } from '../api/client'
import { getActiveUser, userChangedEventName, type UserProfile } from '../api/user'
import { UserSetup } from '../features/settings/UserSetup'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workouts', label: 'Workouts', icon: Activity },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/prs', label: 'Personal records', icon: Trophy },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AppShell() {
  const queryClient = useQueryClient()
  const [activeUser, setActiveUser] = useState<UserProfile | null>(() => getActiveUser())

  useEffect(() => {
    const syncUser = () => {
      queryClient.clear()
      setActiveUser(getActiveUser())
    }
    window.addEventListener(userChangedEventName(), syncUser)
    return () => window.removeEventListener(userChangedEventName(), syncUser)
  }, [queryClient])

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
          <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Settings2 size={18} strokeWidth={1.8} /><span>Settings</span>
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
          <NavLink to="/settings" aria-label="Settings" className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>
            <Settings2 size={19} />
          </NavLink>
        </div>
        <main className="main-content">
          {!isApiConfigured
            ? <div className="page-stack"><h1>Backend configuration required</h1><p className="muted">Set <code>VITE_API_BASE_URL</code> in <code>.env.local</code> for local development or in your production environment, then restart or rebuild the app.</p></div>
            : !activeUser ? <UserSetup /> : <Outlet />}
        </main>
        <footer className="app-footer"><span>Train. Track. Progress.</span><span>LEVEL UP / V1</span></footer>
      </div>
    </div>
  )
}
