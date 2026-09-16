import { useCallback, useEffect, useState } from 'react'
import * as api from '../../lib/api'
import { relativeTime } from '../../lib/time'

type Props = {
  onError: (message: string) => void
  onDone: (message: string) => void
}

export function AdminComments({ onError, onDone }: Props) {
  const [rows, setRows] = useState<api.ModerationComment[] | null>(null)

  const load = useCallback(() => {
    api
      .fetchAllComments()
      .then(setRows)
      .catch((e) => onError(e instanceof Error ? e.message : 'Kunne ikke hente kommentarerne.'))
  }, [onError])

  useEffect(load, [load])

  const act = async (fn: () => Promise<void>, message: string) => {
    try {
      await fn()
      load()
      onDone(message)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Kunne ikke opdatere kommentaren.')
    }
  }

  if (rows === null) return <div className="state-note">Henter kommentarer…</div>
  if (rows.length === 0) return <div className="empty-box">Der er ingen kommentarer endnu.</div>

  return (
    <div style={{ display: 'grid', gap: 9, maxWidth: 900 }}>
      {rows.map((c) => (
        <div className={`mod-row${c.hidden ? ' is-hidden' : ''}`} key={c.id}>
          <div className="mod-row-main">
            <div className="mod-row-meta">
              #{c.idea_id} {c.idea_title} · {c.author} · {relativeTime(c.created_at)}
              {c.hidden ? ' · skjult' : ''}
            </div>
            <div className="comment-body">{c.body}</div>
          </div>
          <div className="row-actions" style={{ marginLeft: 'auto', flex: 'none' }}>
            <button
              className="btn btn-plain"
              onClick={() =>
                void act(
                  () => api.setCommentHidden(c.id, !c.hidden),
                  c.hidden ? 'Kommentaren vises igen' : 'Kommentaren er skjult',
                )
              }
            >
              {c.hidden ? 'Vis igen' : 'Skjul'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (!confirm('Slet kommentaren permanent?')) return
                void act(() => api.deleteComment(c.id), 'Kommentaren er slettet')
              }}
            >
              Slet
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
