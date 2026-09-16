import { relativeTime } from '../lib/time'
import type { Idea, VoteValue } from '../lib/types'
import { VoteButtons } from './VoteButtons'

type Props = {
  idea: Idea
  myVote: VoteValue
  allowDislike: boolean
  onOpen: () => void
  onVote: (value: 1 | -1) => void
}

export function IdeaCard({ idea, myVote, allowDislike, onOpen, onVote }: Props) {
  return (
    <div
      className="card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="card-meta">
        <span>#{idea.id}</span>
        <span className="card-when">{relativeTime(idea.created_at)}</span>
      </div>
      <div className="card-title">{idea.title}</div>
      <div className="card-metaline">{idea.category}</div>
      <div className="card-actions">
        <VoteButtons
          up={idea.up_count}
          down={idea.down_count}
          myVote={myVote}
          allowDislike={allowDislike}
          onVote={onVote}
        />
        <span className="card-comments">{idea.comment_count} svar</span>
      </div>
      {idea.official_reply && <div className="card-official">Svar fra holdet »</div>}
    </div>
  )
}
