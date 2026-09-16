import { useCallback, useEffect, useState } from 'react'
import { fetchComments } from '../lib/api'
import { statusDef } from '../lib/constants'
import { relativeTime } from '../lib/time'
import type { Comment, Idea, VoteValue } from '../lib/types'
import { Modal } from './Modal'
import { VoteButtons } from './VoteButtons'

type Props = {
  idea: Idea
  myVote: VoteValue
  allowDislike: boolean
  onClose: () => void
  onVote: (value: 1 | -1) => void
  /** Sender kommentaren og opdaterer brættets tæller. Kaster ved fejl. */
  onComment: (body: string) => Promise<void>
}

/**
 * Dialogen henter selv sine kommentarer. Den monteres med `key={idea.id}`, så
 * et skift til en anden idé giver en ny dialog med tom kladde.
 */
export function IdeaModal({ idea, myVote, allowDislike, onClose, onVote, onComment }: Props) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const status = statusDef(idea.status)

  const load = useCallback(() => {
    fetchComments(idea.id)
      .then(setComments)
      .catch(() => setComments([]))
  }, [idea.id])

  useEffect(load, [load])

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await onComment(text)
      setDraft('')
      load()
    } finally {
      setSending(false)
    }
  }

  const count = comments?.length ?? idea.comment_count

  return (
    <Modal
      onClose={onClose}
      labelledBy="idea-modal-title"
      head={
        <>
          <span className="dot" style={{ background: status.color }} />
          <span className="modal-head-title">{status.label}</span>
          <span className="modal-head-ref">#{idea.id}</span>
        </>
      }
    >
      <h2 className="modal-title" id="idea-modal-title">
        {idea.title}
      </h2>

      <div className="chips">
        <span className="chip">{idea.category}</span>
        <span className="chip">{idea.importance}</span>
        <span className="chip">Fra: {idea.author}</span>
        <span className="chips-when">{relativeTime(idea.created_at)}</span>
      </div>

      <p className="modal-text">{idea.body}</p>

      <div className="vote-bar">
        <VoteButtons
          up={idea.up_count}
          down={idea.down_count}
          myVote={myVote}
          allowDislike={allowDislike}
          size="large"
          upLabel="God idé"
          onVote={onVote}
        />
        <span className="vote-bar-note">Én stemme pr. besøgende</span>
      </div>

      {idea.official_reply && (
        <div className="official-box">
          <div className="official-label">Svar fra holdet</div>
          <div className="official-text">{idea.official_reply}</div>
        </div>
      )}

      <div className="comments">
        <div className="comments-heading">
          {count} {count === 1 ? 'kommentar' : 'kommentarer'}
        </div>

        {comments === null ? (
          <div className="comment-note">Henter kommentarer…</div>
        ) : (
          comments.map((c) => (
            <div className="comment" key={c.id}>
              <div className="comment-head">
                <strong>{c.author}</strong> · {relativeTime(c.created_at)}
              </div>
              <div className="comment-body">{c.body}</div>
            </div>
          ))
        )}

        <textarea
          className="textarea"
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Skriv en kommentar — du behøver ikke skrive hvem du er…"
        />
        <div className="comment-actions">
          <button className="btn btn-green" onClick={send} disabled={sending || !draft.trim()}>
            {sending ? 'Sender…' : 'Send kommentar'}
          </button>
          <span className="comment-note">Hold god tone. Vi fjerner grove kommentarer.</span>
        </div>
      </div>
    </Modal>
  )
}
