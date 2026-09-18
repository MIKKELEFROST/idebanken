import { useState } from 'react'
import { BoardScroll } from '../components/BoardScroll'
import { IdeaCard } from '../components/IdeaCard'
import { IdeaModal } from '../components/IdeaModal'
import { SubmitModal, type SubmitValues } from '../components/SubmitModal'
import { useBoard } from '../hooks/useBoard'
import { useToast } from '../hooks/useToast'
import * as api from '../lib/api'
import { CATEGORIES, SORT_OPTIONS, type SortKey } from '../lib/constants'

export function PublicBoard() {
  const board = useBoard()
  const { toast, flash } = useToast()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const selected = board.ideas.find((i) => i.id === selectedId) ?? null
  const allowDislike = board.settings?.allow_dislike ?? true
  const requireApproval = board.settings?.require_approval ?? true

  const vote = async (ideaId: number, value: 1 | -1) => {
    try {
      await board.vote(ideaId, value)
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Kunne ikke registrere din stemme.', 'error')
    }
  }

  const submit = async (values: SubmitValues) => {
    await api.submitIdea({ ...values, visitorKey: board.visitor })
    setFormOpen(false)
    await board.reload()
    flash(
      requireApproval ? 'Tak! Idéen er sendt til gennemsyn' : 'Tak! Idéen ligger nu på brættet',
    )
  }

  const comment = async (ideaId: number, body: string) => {
    try {
      await api.addComment(ideaId, board.visitor, body)
      await board.reload()
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Kunne ikke sende kommentaren.', 'error')
      throw e
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar-row">
          <div className="brand">
            <div className="brand-mark">ID</div>
            <div className="brand-name">
              idé
              <br />
              board
            </div>
          </div>
          <div className="nav-item is-active">Brættet</div>
          <div className="spacer" />
          <div className="topbar-tools">
            <input
              className="search-input"
              value={board.query}
              onChange={(e) => board.setQuery(e.target.value)}
              placeholder="Søg i idéer…"
              aria-label="Søg i idéer"
            />
            <button className="btn btn-orange" onClick={() => setFormOpen(true)}>
              Indsend idé
            </button>
          </div>
        </div>

        <div className="subbar">
          <div className="subbar-row">
            <span className="subbar-label" id="filter-area">
              Område
            </span>
            <select
              className="subbar-select is-wide"
              aria-labelledby="filter-area"
              value={board.category}
              onChange={(e) => board.setCategory(e.target.value)}
            >
              <option value="">Alle områder</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <span className="subbar-label" id="filter-sort">
              Sortér
            </span>
            <select
              className="subbar-select"
              aria-labelledby="filter-sort"
              value={board.sort}
              onChange={(e) => board.setSort(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="spacer" />
            <span className="count-line">{board.countLine}</span>
          </div>
        </div>
      </div>

      <div className="content">
        {board.loading ? (
          <div className="state-note">Henter brættet…</div>
        ) : board.error ? (
          <div className="error-box">{board.error}</div>
        ) : (
          <BoardScroll>
            {board.columns.map((col) => (
              <div className="column" key={col.key}>
                <div className="column-stripe" style={{ background: col.color }} />
                <div className="column-head">
                  <span className="dot" style={{ background: col.color }} />
                  <span className="column-title">{col.label}</span>
                  <span className="column-count">{col.count}</span>
                </div>
                <div className="column-body">
                  {col.items.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      myVote={board.myVotes.get(idea.id) ?? 0}
                      allowDislike={allowDislike}
                      onOpen={() => setSelectedId(idea.id)}
                      onVote={(v) => void vote(idea.id, v)}
                    />
                  ))}
                  {col.items.length === 0 && <div className="column-empty">Ingen idéer</div>}
                </div>
              </div>
            ))}
          </BoardScroll>
        )}
      </div>

      {selected && (
        <IdeaModal
          key={selected.id}
          idea={selected}
          myVote={board.myVotes.get(selected.id) ?? 0}
          allowDislike={allowDislike}
          onClose={() => setSelectedId(null)}
          onVote={(v) => void vote(selected.id, v)}
          onComment={(body) => comment(selected.id, body)}
        />
      )}

      {formOpen && (
        <SubmitModal
          requireApproval={requireApproval}
          onClose={() => setFormOpen(false)}
          onSubmit={submit}
        />
      )}

      {toast && (
        <div className={`toast${toast.tone === 'error' ? ' is-error' : ''}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}
