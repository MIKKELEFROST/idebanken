import type { VoteValue } from '../lib/types'

type Props = {
  up: number
  down: number
  myVote: VoteValue
  allowDislike: boolean
  size?: 'card' | 'large'
  onVote: (value: 1 | -1) => void
  /** Teksten på op-knappen i den store udgave. */
  upLabel?: string
}

export function VoteButtons({
  up,
  down,
  myVote,
  allowDislike,
  size = 'card',
  onVote,
  upLabel,
}: Props) {
  const large = size === 'large' ? ' is-large' : ''

  const stop = (e: React.MouseEvent) => {
    // Kortet er selv klikbart — en stemme må ikke også åbne dialogen.
    e.stopPropagation()
  }

  return (
    <>
      <button
        className={`vote${large}${myVote === 1 ? ' is-on' : ''}`}
        title="God idé"
        aria-pressed={myVote === 1}
        onClick={(e) => {
          stop(e)
          onVote(1)
        }}
      >
        ▲ {upLabel ? `${upLabel} · ${up}` : up}
      </button>
      {allowDislike && (
        <button
          className={`vote is-down${large}${myVote === -1 ? ' is-on' : ''}`}
          title="Ikke for mig"
          aria-pressed={myVote === -1}
          onClick={(e) => {
            stop(e)
            onVote(-1)
          }}
        >
          ▼ {down}
        </button>
      )}
    </>
  )
}
