import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api'
import type { Idea } from '../lib/types'

export function useAdminIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setIdeas(await api.fetchAllIdeas())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke hente idéerne.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  /** Sætter feltet lokalt med det samme og ruller tilbage hvis serveren siger nej. */
  const patch = useCallback(
    async (id: number, changes: Partial<Idea>) => {
      const before = ideas.find((i) => i.id === id)
      setIdeas((list) => list.map((i) => (i.id === id ? { ...i, ...changes } : i)))
      try {
        await api.updateIdea(id, changes)
      } catch (e) {
        if (before) setIdeas((list) => list.map((i) => (i.id === id ? before : i)))
        throw e
      }
    },
    [ideas],
  )

  return { ideas, loading, error, reload, patch, setIdeas }
}
