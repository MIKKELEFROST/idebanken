import { useState } from 'react'
import { useAuth } from '../lib/auth-context'

export function AdminLogin({ notice }: { notice?: string }) {
  const { signIn, signOut, session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke logge ind.')
    } finally {
      setBusy(false)
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
          <div className="nav-item is-active">Administration</div>
        </div>
      </div>

      <div className="content">
        <div className="login-wrap panel">
          <div className="panel-head">Log ind</div>
          <form className="login-body" onSubmit={submit}>
            {notice && <div className="notice">{notice}</div>}

            <label className="field">
              <span className="field-label">E-mail</span>
              <input
                className="input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Kodeord</span>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <div className="error-box">{error}</div>}

            <div className="row-actions">
              <button className="btn btn-orange is-large" type="submit" disabled={busy}>
                {busy ? 'Logger ind…' : 'Log ind'}
              </button>
              {session && (
                <button className="btn btn-plain" type="button" onClick={() => void signOut()}>
                  Log ud
                </button>
              )}
              <a href="/">Til brættet</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
