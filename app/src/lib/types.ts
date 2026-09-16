export type IdeaStatus =
  | 'nye'
  | 'vurdering'
  | 'planlagt'
  | 'udvikling'
  | 'test'
  | 'udgivet'
  | 'afvist'

export type ReviewState = 'pending' | 'approved' | 'discarded'

export type Idea = {
  id: number
  title: string
  body: string
  category: string
  importance: string
  author: string
  status: IdeaStatus
  review_state: ReviewState
  hidden: boolean
  official_reply: string
  tags: string[]
  up_count: number
  down_count: number
  comment_count: number
  merged_into: number | null
  created_at: string
  updated_at: string
}

export type Comment = {
  id: number
  idea_id: number
  author: string
  body: string
  hidden: boolean
  created_at: string
}

export type BoardSettings = {
  id: number
  require_approval: boolean
  allow_dislike: boolean
}

/** -1, 0 eller 1 — den besøgendes egen stemme på en idé. */
export type VoteValue = -1 | 0 | 1

/** Kolonnerne som de rendreres: felterne der læses offentligt. */
export const IDEA_COLUMNS =
  'id,title,body,category,importance,author,status,review_state,hidden,official_reply,tags,up_count,down_count,comment_count,merged_into,created_at,updated_at'

export const COMMENT_COLUMNS = 'id,idea_id,author,body,hidden,created_at'
