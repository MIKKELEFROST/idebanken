import { useState } from 'react'
import { BoardScroll } from '../BoardScroll'
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

  /**
   * Træk-og-slip bygger på HTML5 drag-events, som ikke findes på touch. Pilene
   * flytter et kort én kolonne ad gangen og er derfor den eneste vej på mobil
   * — og ofte den hurtigste på skrivebordet.
   */
  const step = (idea: Idea, direction: -1 | 1) => {
    const at = STATUSES.findIndex((s) => s.value === idea.status)
    const next = STATUSES[at + direction]
    if (next) onMove(idea.id, next.value)
  }

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
        Træk et kort til en anden kolonne, eller brug ‹ og › på kortet. Ændringen er synlig for
        alle med det samme.
      </div>

      <BoardScroll style={{ marginTop: 12 }}>
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
                    <div className="admin-card-move">
                      <button
                        className="move-btn"
                        disabled={s.value === STATUSES[0].value}
                        title="Flyt en kolonne til venstre"
                        aria-label={`Flyt ${idea.title} en kolonne til venstre`}
                        onClick={(e) => {
                          e.stopPropagation()
                          step(idea, -1)
                        }}
                      >
                        ‹
                      </button>
                      <button
                        className="move-btn"
                        disabled={s.value === STATUSES[STATUSES.length - 1].value}
                        title="Flyt en kolonne til højre"
                        aria-label={`Flyt ${idea.title} en kolonne til højre`}
                        onClick={(e) => {
                          e.stopPropagation()
                          step(idea, 1)
                        }}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="column-empty">Ingen idéer</div>}
              </div>
            </div>
          )
        })}
      </BoardScroll>
    </>
  )
}
