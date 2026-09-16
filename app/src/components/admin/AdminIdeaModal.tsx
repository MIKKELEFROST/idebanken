import { useCallback, useEffect, useState } from 'react'
import * as api from '../../lib/api'
import { CATEGORIES, STATUSES, statusDef } from '../../lib/constants'
import { relativeTime } from '../../lib/time'
import type { Comment, Idea, IdeaStatus } from '../../lib/types'
import { Modal } from '../Modal'

type Props = {
  idea: Idea
  onClose: () => void
  onPatch: (changes: Partial<Idea>) => Promise<void>
  onDelete: () => Promise<void>
  onError: (message: string) => void
  onDone: (message: string) => void
}

/** Monteres med `key={idea.id}`, så felterne starter forfra på en anden idé. */
export function AdminIdeaModal({ idea, onClose, onPatch, onDelete, onError, onDone }: Props) {
  const [title, setTitle] = useState(idea.title)
  const [body, setBody] = useState(idea.body)
  const [reply, setReply] = useState(idea.official_reply)
  const [tagDraft, setTagDraft] = useState('')
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [busy, setBusy] = useState(false)

  const status = statusDef(idea.status)

  const loadComments = useCallback(
    () =>
      api
        .fetchAdminComments(idea.id)
        .then(setComments)
        .catch(() => setComments([])),
    [idea.id],
  )

  useEffect(() => {
    void loadComments()
  }, [loadComments])

  const run = async (fn: () => Promise<void>, okMessage?: string) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      if (okMessage) onDone(okMessage)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Kunne ikke gemme.')
    } finally {
      setBusy(false)
    }
  }

  const saveText = () =>
    run(async () => {
      if (title.trim().length < 3 || body.trim().length < 20) {
        throw new Error('Titel og beskrivelse er for korte til at gemme.')
      }
      await onPatch({ title: title.trim(), body: body.trim() })
    }, 'Teksten er gemt')

  const addTag = () => {
    const tag = tagDraft.trim()
    if (!tag || idea.tags.includes(tag)) {
      setTagDraft('')
      return
    }
    setTagDraft('')
    void run(() => onPatch({ tags: [...idea.tags, tag] }))
  }

  const dirty = title !== idea.title || body !== idea.body

  return (
    <Modal
      onClose={onClose}
      labelledBy="admin-idea-title"
      head={
        <>
          <span className="dot" style={{ background: status.color }} />
          <span className="modal-head-title">{status.label}</span>
          <span className="modal-head-ref">
            #{idea.id} · {relativeTime(idea.created_at)}
          </span>
        </>
      }
    >
      <div className="chips">
        <span className="chip">{idea.category}</span>
        <span className="chip">{idea.importance}</span>
        <span className="chip">Fra: {idea.author}</span>
        {idea.hidden && <span className="chip">Skjult</span>}
      </div>

      <div className="admin-edit">
        <div className="admin-edit-label" id="admin-idea-title">
          Rediger
        </div>

        <label className="field">
          <span className="field-label">Titel</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">Beskrivelse</span>
          <textarea
            className="textarea"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>

        <div className="row-actions">
          <button className="btn btn-green" onClick={saveText} disabled={busy || !dirty}>
            Gem tekst
          </button>
          {dirty && <span className="comment-note">Ikke gemt endnu</span>}
        </div>

        <div className="admin-edit-grid">
          <label className="field">
            <span className="field-label">Status</span>
            <select
              className="select"
              value={idea.status}
              onChange={(e) =>
                void run(() => onPatch({ status: e.target.value as IdeaStatus }), 'Status ændret')
              }
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Område</span>
            <select
              className="select"
              value={idea.category}
              onChange={(e) => void run(() => onPatch({ category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <span className="field-label">Tags</span>
          <div className="tag-row">
            {idea.tags.map((t) => (
              <span className="tag" key={t}>
                {t}
                <button
                  onClick={() => void run(() => onPatch({ tags: idea.tags.filter((x) => x !== t) }))}
                  aria-label={`Fjern ${t}`}
                >
                  ✕
                </button>
              </span>
            ))}
            <input
              className="tag-input"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="tilføj tag + Enter"
            />
          </div>
        </div>

        <label className="field">
          <span className="field-label">Officielt svar</span>
          <textarea
            className="textarea"
            rows={2}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Vises på kortet som “Svar fra holdet”…"
          />
        </label>

        <div className="row-actions">
          <button
            className="btn btn-green"
            disabled={busy || reply === idea.official_reply}
            onClick={() =>
              void run(() => onPatch({ official_reply: reply.trim() }), 'Svaret er gemt')
            }
          >
            Gem svar
          </button>
          <button
            className="btn btn-plain"
            disabled={busy}
            onClick={() =>
              void run(
                () => onPatch({ hidden: !idea.hidden }),
                idea.hidden ? 'Idéen er på brættet igen' : 'Idéen er skjult',
              )
            }
          >
            {idea.hidden ? 'Vis på brættet igen' : 'Skjul fra brættet'}
          </button>
          <button
            className="btn btn-danger"
            disabled={busy}
            onClick={() => {
              if (!confirm(`Slet idé #${idea.id} permanent? Kommentarerne slettes med.`)) return
              void run(async () => {
                await onDelete()
                onClose()
              }, 'Idéen er slettet')
            }}
          >
            Slet
          </button>
        </div>
      </div>

      <div className="comments">
        <div className="comments-heading">Kommentarer ({comments?.length ?? 0})</div>
        {comments === null && <div className="comment-note">Henter…</div>}
        {comments?.length === 0 && <div className="comment-note">Ingen kommentarer endnu.</div>}
        {comments?.map((c) => (
          <div className={`mod-row${c.hidden ? ' is-hidden' : ''}`} key={c.id}>
            <div className="mod-row-main">
              <div className="mod-row-meta">
                {c.author} · {relativeTime(c.created_at)}
                {c.hidden ? ' · skjult' : ''}
              </div>
              <div className="comment-body">{c.body}</div>
            </div>
            <button
              className="btn btn-plain"
              style={{ marginLeft: 'auto', flex: 'none' }}
              onClick={() =>
                void run(async () => {
                  await api.setCommentHidden(c.id, !c.hidden)
                  await loadComments()
                })
              }
            >
              {c.hidden ? 'Vis igen' : 'Skjul'}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  )
}
