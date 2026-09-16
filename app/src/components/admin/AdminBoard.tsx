import { useState } from 'react'
import { STATUSES } from '../../lib/constants'
import type { Idea, IdeaStatus } from '../../lib/types'

type Props = {
  ideas: Idea[]
  onMove: (id: number, status: IdeaStatus) => void
  onOpen: (id: number) => void
}

export function AdminBoard({ ideas, onMove, onOpen }: Props) {
  const [dragging, setDragging] = useState<number | null>(null)
  const [over, setOver] = useState<IdeaStatus | null>(null)

  const live = ideas.filter((i) => i.review_state === 'approved')

  const drop = (status: IdeaStatus) => {
    if (dragging !== null) {
      const idea = live.find((i) => i.id === dragging)
      if (idea && idea.status !== status) onMove(dragging, status)
    }
    setDragging(null)
    setOver(null)
  }

  return (
    <>
      <div className="notice">
        Træk et kort til en anden kolonne for at ændre status. Ændringen er synlig for alle med
        det samme.
      </div>

      <div className="board" style={{ marginTop: 12 }}>
        {STATUSES.map((s) => {
          const items = live
            .filter((i) => i.status === s.value)
            .sort((a, b) => b.up_count - b.down_count - (a.up_count - a.down_count))

          return (
            <div
              key={s.value}
              className={`admin-column${over === s.value ? ' is-drop' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(s.value)
              }}
              onDragLeave={() => setOver((cur) => (cur === s.value ? null : cur))}
              onDrop={(e) => {
                e.preventDefault()
                drop(s.value)
              }}
            >
              <div className="column-stripe" style={{ background: s.color }} />
              <div className="column-head">
                <span className="dot" style={{ background: s.color }} />
                <span className="column-title">{s.label}</span>
                <span className="column-count">{items.length}</span>
              </div>
              <div className="column-body">
                {items.map((idea) => (
                  <div
                    key={idea.id}
                    className={`admin-card${dragging === idea.id ? ' is-dragging' : ''}`}
                    draggable
                    onDragStart={() => setDragging(idea.id)}
                    onDragEnd={() => {
                      setDragging(null)
                      setOver(null)
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(idea.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpen(idea.id)
                      }
                    }}
                  >
                    <div className="admin-card-title">{idea.title}</div>
                    <div className="admin-card-meta">
                      <span>#{idea.id}</span>
                      {idea.hidden && <span>skjult</span>}
                      <span className="is-right">
                        ▲{idea.up_count} ▼{idea.down_count}
                      </span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="column-empty">Ingen idéer</div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tastaturvej til det samme: kortets dialog har en status-vælger. */}
    </>
  )
}
