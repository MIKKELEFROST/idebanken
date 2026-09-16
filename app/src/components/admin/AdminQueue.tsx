import { useState } from 'react'
import { relativeTime } from '../../lib/time'
import type { Idea } from '../../lib/types'

type Props = {
  ideas: Idea[]
  onApprove: (id: number) => void
  onDiscard: (id: number) => void
  onMerge: (id: number, into: number) => void
}

/** Lidt hjælp til dubletter: samme område og ord der går igen i titlen. */
function similarTo(idea: Idea, all: Idea[]): Idea[] {
  const words = new Set(
    idea.title
      .toLowerCase()
      .split(/[^a-zA-ZæøåÆØÅ0-9]+/)
      .filter((w) => w.length > 4),
  )
  if (words.size === 0) return []

  return all
    .filter((other) => other.id !== idea.id && other.review_state === 'approved')
    .map((other) => {
      const hits = [...words].filter((w) => other.title.toLowerCase().includes(w)).length
      return { other, score: hits + (other.category === idea.category ? 0.5 : 0) }
    })
    .filter((x) => x.score >= 1.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.other)
}

export function AdminQueue({ ideas, onApprove, onDiscard, onMerge }: Props) {
  const [mergeFor, setMergeFor] = useState<number | null>(null)
  const pending = ideas
    .filter((i) => i.review_state === 'pending')
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))

  if (pending.length === 0) {
    return <div className="empty-box">Køen er tom. Alt er behandlet.</div>
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 900 }}>
      {pending.map((idea) => {
        const similar = similarTo(idea, ideas)
        return (
          <div className="queue-card" key={idea.id}>
            <div className="queue-head">
              <div className="queue-title">{idea.title}</div>
              <div className="queue-ref">
                #{idea.id} · {relativeTime(idea.created_at)}
              </div>
            </div>

            <div className="queue-body">{idea.body}</div>

            <div className="chips">
              <span className="chip">{idea.category}</span>
              <span className="chip">{idea.importance}</span>
              <span className="chip">Fra: {idea.author}</span>
            </div>

            {similar.length > 0 && (
              <div className="notice">
                Ligner:{' '}
                {similar.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ' · '}
                    <strong>
                      #{s.id} {s.title}
                    </strong>
                  </span>
                ))}
              </div>
            )}

            <div className="row-actions">
              <button className="btn btn-green" onClick={() => onApprove(idea.id)}>
                Godkend til brættet
              </button>
              <button className="btn btn-danger" onClick={() => onDiscard(idea.id)}>
                Afvis
              </button>
              <button
                className="btn btn-plain"
                onClick={() => setMergeFor(mergeFor === idea.id ? null : idea.id)}
              >
                Flet som dublet
              </button>
            </div>

            {mergeFor === idea.id && (
              <div className="admin-edit">
                <div className="admin-edit-label">Flet ind i</div>
                <div className="row-actions">
                  <select
                    className="select"
                    style={{ maxWidth: 420 }}
                    defaultValue=""
                    onChange={(e) => {
                      const into = Number(e.target.value)
                      if (!into) return
                      onMerge(idea.id, into)
                      setMergeFor(null)
                    }}
                  >
                    <option value="">Vælg den idé den er en dublet af…</option>
                    {ideas
                      .filter((o) => o.review_state === 'approved')
                      .sort((a, b) => b.up_count - a.up_count)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          #{o.id} — {o.title}
                        </option>
                      ))}
                  </select>
                  <button className="btn btn-plain" onClick={() => setMergeFor(null)}>
                    Fortryd
                  </button>
                </div>
                <span className="comment-note">
                  Dubletten kommer ikke på brættet, men bliver liggende i databasen med en
                  henvisning til originalen.
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
