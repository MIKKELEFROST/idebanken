import { useMemo } from 'react'
import { CATEGORIES, STATUSES } from '../../lib/constants'
import type { Idea } from '../../lib/types'

export function AdminStats({ ideas }: { ideas: Idea[] }) {
  const live = useMemo(() => ideas.filter((i) => i.review_state === 'approved'), [ideas])

  const byCategory = useMemo(() => {
    const rows = CATEGORIES.map((c) => ({
      label: c,
      value: live.filter((i) => i.category === c).length,
    }))
    const max = Math.max(1, ...rows.map((r) => r.value))
    return rows.map((r) => ({ ...r, width: `${Math.round((r.value / max) * 100)}%` }))
  }, [live])

  const byStatus = useMemo(() => {
    const rows = STATUSES.map((s) => ({
      label: s.label,
      color: s.color,
      value: live.filter((i) => i.status === s.value).length,
    }))
    const max = Math.max(1, ...rows.map((r) => r.value))
    return rows.map((r) => ({ ...r, width: `${Math.round((r.value / max) * 100)}%` }))
  }, [live])

  const top = useMemo(
    () =>
      [...live]
        .sort((a, b) => b.up_count - b.down_count - (a.up_count - a.down_count))
        .slice(0, 8),
    [live],
  )

  const pending = ideas.filter((i) => i.review_state === 'pending').length
  const discarded = ideas.filter((i) => i.review_state === 'discarded').length
  const comments = live.reduce((sum, i) => sum + i.comment_count, 0)

  return (
    <div className="stat-grid">
      <div className="panel">
        <div className="panel-head">Overblik</div>
        <div className="panel-body">
          <div className="bar-head">
            <span>På brættet</span>
            <span>{live.length}</span>
          </div>
          <div className="bar-head">
            <span>Venter i køen</span>
            <span>{pending}</span>
          </div>
          <div className="bar-head">
            <span>Afvist i køen</span>
            <span>{discarded}</span>
          </div>
          <div className="bar-head">
            <span>Kommentarer</span>
            <span>{comments}</span>
          </div>
          <div className="bar-head">
            <span>Stemmer i alt</span>
            <span>{live.reduce((sum, i) => sum + i.up_count + i.down_count, 0)}</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Idéer pr. område</div>
        <div className="panel-body">
          {byCategory.map((b) => (
            <div className="bar-row" key={b.label}>
              <div className="bar-head">
                <span>{b.label}</span>
                <span>{b.value}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: b.width, background: '#69A221' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Status-fordeling</div>
        <div className="panel-body">
          {byStatus.map((b) => (
            <div className="bar-row" key={b.label}>
              <div className="bar-head">
                <span>{b.label}</span>
                <span>{b.value}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: b.width, background: b.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Mest efterspurgt</div>
        <div className="panel-body">
          {top.length === 0 && <span className="comment-note">Ingen idéer på brættet endnu.</span>}
          {top.map((i) => (
            <div className="top-row" key={i.id}>
              <span className="top-score">{i.up_count - i.down_count}</span>
              <span className="top-title">{i.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
