import { useState } from 'react'
import { AdminBoard } from '../components/admin/AdminBoard'
import { AdminComments } from '../components/admin/AdminComments'
import { AdminIdeaModal } from '../components/admin/AdminIdeaModal'
import { AdminQueue } from '../components/admin/AdminQueue'
import { AdminSettings } from '../components/admin/AdminSettings'
import { AdminStats } from '../components/admin/AdminStats'
import { useAdminIdeas } from '../hooks/useAdminIdeas'
import { useToast } from '../hooks/useToast'
import * as api from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { IdeaStatus } from '../lib/types'

type Tab = 'board' | 'queue' | 'comments' | 'stats' | 'settings'

export function Admin() {
  const { session, signOut } = useAuth()
  const { ideas, loading, error, reload, patch } = useAdminIdeas()
  const { toast, flash } = useToast()

  const [tab, setTab] = useState<Tab>('board')
  const [openId, setOpenId] = useState<number | null>(null)

  const open = ideas.find((i) => i.id === openId) ?? null
  const pendingCount = ideas.filter((i) => i.review_state === 'pending').length

  const fail = (e: unknown) =>
    flash(e instanceof Error ? e.message : 'Noget gik galt.', 'error')

  const move = (id: number, status: IdeaStatus) => {
    void patch(id, { status }).catch(fail)
  }

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'board', label: 'Brættet' },
    { key: 'queue', label: 'Kø', badge: pendingCount },
    { key: 'comments', label: 'Kommentarer' },
    { key: 'stats', label: 'Statistik' },
    { key: 'settings', label: 'Indstillinger' },
  ]

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
          <a className="nav-item" href="/">
            Brættet
          </a>
          <div className="nav-item is-active">Administration</div>
          <div className="spacer" />
          <div className="topbar-tools">
            <span className="count-line">{session?.user.email}</span>
            <button className="btn btn-orange" onClick={() => void signOut()}>
              Log ud
            </button>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="admin-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`admin-tab${tab === t.key ? ' is-on' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.badge ? <span className="admin-tab-badge">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="state-note">Henter…</div>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : (
          <>
            {tab === 'board' && (
              <AdminBoard ideas={ideas} onMove={move} onOpen={(id) => setOpenId(id)} />
            )}

            {tab === 'queue' && (
              <AdminQueue
                ideas={ideas}
                onApprove={(id) => {
                  void api
                    .approveIdea(id)
                    .then(reload)
                    .then(() => flash('Idéen er på brættet'))
                    .catch(fail)
                }}
                onDiscard={(id) => {
                  void api
                    .discardIdea(id)
                    .then(reload)
                    .then(() => flash('Idéen er afvist'))
                    .catch(fail)
                }}
                onMerge={(id, into) => {
                  void api
                    .mergeIdea(id, into)
                    .then(reload)
                    .then(() => flash(`Flettet ind i #${into}`))
                    .catch(fail)
                }}
              />
            )}

            {tab === 'comments' && (
              <AdminComments onError={(m) => flash(m, 'error')} onDone={(m) => flash(m)} />
            )}

            {tab === 'stats' && <AdminStats ideas={ideas} />}

            {tab === 'settings' && (
              <AdminSettings onError={(m) => flash(m, 'error')} onDone={(m) => flash(m)} />
            )}
          </>
        )}
      </div>

      {open && (
        <AdminIdeaModal
          key={open.id}
          idea={open}
          onClose={() => setOpenId(null)}
          onPatch={(changes) => patch(open.id, changes)}
          onDelete={async () => {
            await api.deleteIdea(open.id)
            await reload()
          }}
          onError={(m) => flash(m, 'error')}
          onDone={(m) => flash(m)}
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
