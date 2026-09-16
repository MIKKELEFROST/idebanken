import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isAdmin as checkAdmin } from './api'
import { AuthContext, type AuthValue } from './auth-context'
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [admin, setAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshAdmin = useCallback(async (next: Session | null) => {
    setAdmin(next ? await checkAdmin() : false)
    setLoading(false)
  }, [])

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      void refreshAdmin(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      setSession(next)
      setLoading(true)
      void refreshAdmin(next)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [refreshAdmin])

  const value = useMemo<AuthValue>(
    () => ({
      session,
      admin,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw new Error('Forkert e-mail eller kodeord.')
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, admin, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
