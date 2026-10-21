import { getActiveUser } from '../../api/user'
import { UserSetup } from './UserSetup'

export function SettingsPage() {
  return <UserSetup currentUser={getActiveUser()} />
}
