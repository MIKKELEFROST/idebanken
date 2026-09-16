import { useState } from 'react'
import { CATEGORIES, IMPORTANCE } from '../lib/constants'
import { Modal } from './Modal'

export type SubmitValues = {
  title: string
  body: string
  category: string
  importance: string
  author: string
  trap: string
}

type Props = {
  requireApproval: boolean
  onClose: () => void
  onSubmit: (values: SubmitValues) => Promise<void>
}

const EMPTY: SubmitValues = {
  title: '',
  body: '',
  category: 'Kamp',
  importance: 'Vigtigt',
  author: '',
  trap: '',
}

export function SubmitModal({ requireApproval, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<SubmitValues>(EMPTY)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const set = <K extends keyof SubmitValues>(key: K, value: SubmitValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = async () => {
    if (sending) return
    if (!form.title.trim() || form.body.trim().length < 20) {
      setError(
        'Skriv en titel og mindst et par linjers beskrivelse — ellers kan vi ikke vurdere idéen.',
      )
      return
    }

    setSending(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke sende idéen.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      tone="green"
      labelledBy="submit-modal-title"
      head={
        <span className="modal-head-title" id="submit-modal-title">
          Indsend en idé
        </span>
      }
      foot={
        <div className="modal-foot">
          <button className="btn btn-orange is-large" onClick={submit} disabled={sending}>
            {sending ? 'Sender…' : 'Send idé'}
          </button>
          <span className="modal-foot-note">
            {requireApproval
              ? 'Vi læser alle idéer igennem inden de kommer på brættet — typisk inden for et døgn.'
              : 'Din idé kommer direkte på brættet under “Nye idéer”.'}
          </span>
        </div>
      }
    >
      <div className="form-intro">
        Jo mere du skriver, jo nemmere er det at vurdere idéen. Der er ingen login — vi gemmer
        ikke hvem du er.
      </div>

      <label className="field">
        <span className="field-label">Titel</span>
        <input
          className="input"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Kort og konkret"
          maxLength={160}
        />
      </label>

      <label className="field is-narrow">
        <span className="field-label">Område</span>
        <select
          className="select"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Beskriv idéen</span>
        <textarea
          className="textarea"
          rows={5}
          value={form.body}
          onChange={(e) => set('body', e.target.value)}
          placeholder="Hvad oplever du i dag, hvad ville du hellere have, og hvornår sker det? Skriv gerne et konkret eksempel."
          maxLength={8000}
        />
      </label>

      <div className="choice-row">
        <span className="field-label">Hvor vigtigt er det for dig?</span>
        <div className="choice-buttons">
          {IMPORTANCE.map((o) => (
            <button
              key={o}
              className={`choice${form.importance === o ? ' is-on' : ''}`}
              aria-pressed={form.importance === o}
              onClick={() => set('importance', o)}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <label className="field is-narrow">
        <span className="field-label">
          Dit brugernavn <span className="is-optional">valgfrit</span>
        </span>
        <input
          className="input is-small"
          value={form.author}
          onChange={(e) => set('author', e.target.value)}
          placeholder="vises på kortet"
          maxLength={60}
        />
      </label>

      {/* Honeypot — skjult for mennesker. */}
      <div className="trap" aria-hidden="true">
        <label>
          Lad dette felt stå tomt
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.trap}
            onChange={(e) => set('trap', e.target.value)}
          />
        </label>
      </div>

      {error && <div className="error-box">{error}</div>}
    </Modal>
  )
}
