import { apiClient, isApiConfigured, requireApiConfigured } from './client'

const PROFILE_KEY = 'level-up.active-user'
const USER_CHANGED_EVENT = 'level-up-user-changed'

export type UserProfile = {
  id: string
  name: string
  email: string
}

export function getActiveUser(): UserProfile | null {
  if (!isApiConfigured) return null
  const saved = localStorage.getItem(PROFILE_KEY)
  if (!saved) return null
  const profile: unknown = JSON.parse(saved)
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
  if (!user) throw new Error('Set up a user in Settings before loading user data.')
  return user.id
}

export function setActiveUser(user: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event(USER_CHANGED_EVENT))
}

export async function createUser(input: Pick<UserProfile, 'name' | 'email'>): Promise<UserProfile> {
  requireApiConfigured()
  const { data } = await apiClient.post<UserProfile>('/users', input)
  return data
}

export function userChangedEventName(): string {
  return USER_CHANGED_EVENT
}
