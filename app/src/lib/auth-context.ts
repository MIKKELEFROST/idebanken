import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthValue = {
  session: Session | null
  /** At kunne logge ind er ikke nok — e-mailen skal stå i admins-tabellen. */
  admin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth skal bruges inden i <AuthProvider>')
  return value
}
