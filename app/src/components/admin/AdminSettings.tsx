import { useEffect, useState } from 'react'
import * as api from '../../lib/api'
import type { BoardSettings } from '../../lib/types'

type Props = {
  onError: (message: string) => void
  onDone: (message: string) => void
}

export function AdminSettings({ onError, onDone }: Props) {
  const [settings, setSettings] = useState<BoardSettings | null>(null)

  useEffect(() => {
    api
      .fetchSettings()
      .then(setSettings)
      .catch((e) => onError(e instanceof Error ? e.message : 'Kunne ikke hente indstillingerne.'))
  }, [onError])

  if (!settings) return <div className="state-note">Henter indstillinger…</div>

  const toggle = async (patch: Partial<BoardSettings>, message: string) => {
    const before = settings
    setSettings({ ...settings, ...patch })
    try {
      await api.updateSettings(patch)
      onDone(message)
    } catch (e) {
      setSettings(before)
      onError(e instanceof Error ? e.message : 'Kunne ikke gemme indstillingen.')
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 620 }}>
      <div className="panel-head">Regler for brættet</div>
      <div className="panel-body">
        <label className="settings-row">
          <input
            type="checkbox"
            checked={settings.require_approval}
            onChange={(e) =>
              void toggle(
                { require_approval: e.target.checked },
                e.target.checked
                  ? 'Nye idéer skal godkendes først'
                  : 'Nye idéer går direkte på brættet',
              )
            }
          />
          <span>
            Nye idéer skal godkendes før de kommer på brættet
            <span className="settings-hint">
              Slås det fra, lander indsendelser direkte i “Nye idéer”, og køen bruges ikke.
            </span>
          </span>
        </label>

        <label className="settings-row">
          <input
            type="checkbox"
            checked={settings.allow_dislike}
            onChange={(e) =>
              void toggle(
                { allow_dislike: e.target.checked },
                e.target.checked ? 'Der kan stemmes imod' : 'Der kan kun stemmes for',
              )
            }
          />
          <span>
            Besøgende må stemme imod
            <span className="settings-hint">
              Slås det fra, forsvinder ▼-knappen. Stemmer der allerede er afgivet, bliver stående.
            </span>
          </span>
        </label>
      </div>
    </div>
  )
}
