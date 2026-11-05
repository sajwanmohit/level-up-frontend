import { isApiConfigured } from './client'

const PROFILE_KEY = 'level-up.active-user'
const USER_CHANGED_EVENT = 'level-up-user-changed'

export type UserProfile = {
  id: string
  name: string
  email: string
}

export function getActiveUser(): UserProfile | null {
  if (!isApiConfigured) return null
  const saved = sessionStorage.getItem(PROFILE_KEY)
  if (!saved) return null
  let profile: unknown
  try {
    profile = JSON.parse(saved)
  } catch {
    sessionStorage.removeItem(PROFILE_KEY)
    return null
  }
  if (
    typeof profile !== 'object' || profile === null
    || !('id' in profile) || typeof profile.id !== 'string'
    || !('name' in profile) || typeof profile.name !== 'string'
    || !('email' in profile) || typeof profile.email !== 'string'
  ) return null
  return { id: profile.id, name: profile.name, email: profile.email }
}

export function getRequiredUserId(): string {
  const user = getActiveUser()
  if (!user) throw new Error('Sign in before loading user data.')
  return user.id
}

export function setActiveUser(user: UserProfile): void {
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event(USER_CHANGED_EVENT))
}

export function clearActiveUser(): void {
  sessionStorage.removeItem(PROFILE_KEY)
  localStorage.removeItem(PROFILE_KEY)
  window.dispatchEvent(new Event(USER_CHANGED_EVENT))
}

export function userChangedEventName(): string {
  return USER_CHANGED_EVENT
}
