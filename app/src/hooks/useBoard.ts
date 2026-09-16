import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from '../lib/api'
import { STATUSES, type SortKey } from '../lib/constants'
import { supabase } from '../lib/supabase'
import type { BoardSettings, Idea, VoteValue } from '../lib/types'
import { visitorKey } from '../lib/visitor'

export type BoardColumn = {
  key: string
  label: string
  color: string
  count: number
  items: Idea[]
}

export function useBoard() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [settings, setSettings] = useState<BoardSettings | null>(null)
  const [myVotes, setMyVotes] = useState<Map<number, VoteValue>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<SortKey>('stemmer')

  const visitor = useMemo(() => visitorKey(), [])

  const load = useCallback(async () => {
    try {
      const [ideaRows, settingRow, votes] = await Promise.all([
        api.fetchBoardIdeas(),
        api.fetchSettings(),
        api.fetchMyVotes(visitor),
      ])
      setIdeas(ideaRows)
      setSettings(settingRow)
      setMyVotes(votes)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Noget gik galt.')
    } finally {
      setLoading(false)
    }
  }, [visitor])

  useEffect(() => {
    void load()
  }, [load])

  // Flytter admin et kort, skal brættet følge med uden at nogen henter siden igen.
  useEffect(() => {
    const channel = supabase
      .channel('board-ideas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => {
        void api.fetchBoardIdeas().then(setIdeas).catch(() => {})
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const vote = useCallback(
    async (ideaId: number, value: 1 | -1) => {
      const before = myVotes.get(ideaId) ?? 0
      const nextVote: VoteValue = before === value ? 0 : value

      // Optimistisk: knappen skal svare med det samme.
      setMyVotes((m) => new Map(m).set(ideaId, nextVote))
      setIdeas((list) =>
        list.map((i) => {
          if (i.id !== ideaId) return i
          const delta = (v: 1 | -1) =>
            (nextVote === v ? 1 : 0) - (before === v ? 1 : 0)
          return {
            ...i,
            up_count: i.up_count + delta(1),
            down_count: i.down_count + delta(-1),
          }
        }),
      )

      try {
        const result = await api.castVote(ideaId, visitor, value)
        setIdeas((list) =>
          list.map((i) =>
            i.id === ideaId
              ? { ...i, up_count: result.up_count, down_count: result.down_count }
              : i,
          ),
        )
        setMyVotes((m) => new Map(m).set(ideaId, result.my_vote))
      } catch (e) {
        // Rul tilbage og lad kalderen vise fejlen.
        setMyVotes((m) => new Map(m).set(ideaId, before))
        void load()
        throw e
      }
    },
    [myVotes, visitor, load],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ideas.filter((i) => {
      if (category && i.category !== category) return false
      if (q && !`${i.title} ${i.body}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [ideas, category, query])

  const columns = useMemo<BoardColumn[]>(() => {
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'nyeste') return b.id - a.id
      if (sort === 'kommentarer') return b.comment_count - a.comment_count
      return b.up_count - b.down_count - (a.up_count - a.down_count)
    })

    return STATUSES.map((s) => {
      const items = sorted.filter((i) => i.status === s.value)
      return { key: s.value, label: s.label, color: s.color, count: items.length, items }
    })
  }, [filtered, sort])

  const countLine = useMemo(() => {
    const n = filtered.length
    let line = n === 1 ? '1 idé' : `${n} idéer`
    if (query.trim()) line += ` matcher “${query.trim()}”`
    if (category) line += ` i ${category}`
    return line
  }, [filtered.length, query, category])

  return {
    ideas,
    settings,
    myVotes,
    loading,
    error,
    query,
    setQuery,
    category,
    setCategory,
    sort,
    setSort,
    columns,
    countLine,
    visitor,
    vote,
    reload: load,
  }
}
