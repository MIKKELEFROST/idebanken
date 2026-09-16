import { supabase } from './supabase'
import {
  COMMENT_COLUMNS,
  IDEA_COLUMNS,
  type BoardSettings,
  type Comment,
  type Idea,
  type IdeaStatus,
  type VoteValue,
} from './types'

/** Postgres-fejl fra RPC'erne bærer allerede en dansk besked — brug den. */
function fail(error: { message: string } | null, fallback: string): never {
  throw new Error(error?.message?.replace(/^.*?:\s*/, '') || fallback)
}

// --------------------------------------------------------------- offentligt

export async function fetchBoardIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select(IDEA_COLUMNS)
    .eq('review_state', 'approved')
    .eq('hidden', false)
    .order('created_at', { ascending: false })

  if (error) fail(error, 'Kunne ikke hente idéerne.')
  return (data ?? []) as unknown as Idea[]
}

export async function fetchSettings(): Promise<BoardSettings> {
  const { data, error } = await supabase
    .from('board_settings')
    .select('id,require_approval,allow_dislike')
    .eq('id', 1)
    .single()

  if (error) fail(error, 'Kunne ikke hente indstillingerne.')
  return data as BoardSettings
}

export async function fetchComments(ideaId: number): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_COLUMNS)
    .eq('idea_id', ideaId)
    .eq('hidden', false)
    .order('created_at', { ascending: true })

  if (error) fail(error, 'Kunne ikke hente kommentarerne.')
  return (data ?? []) as unknown as Comment[]
}

export async function fetchMyVotes(visitorKey: string): Promise<Map<number, VoteValue>> {
  const { data, error } = await supabase.rpc('my_votes', { p_visitor_key: visitorKey })
  if (error) fail(error, 'Kunne ikke hente dine stemmer.')

  const votes = new Map<number, VoteValue>()
  for (const row of (data ?? []) as { idea_id: number; value: VoteValue }[]) {
    votes.set(row.idea_id, row.value)
  }
  return votes
}

export async function castVote(
  ideaId: number,
  visitorKey: string,
  value: 1 | -1,
): Promise<{ up_count: number; down_count: number; my_vote: VoteValue }> {
  const { data, error } = await supabase.rpc('cast_vote', {
    p_idea_id: ideaId,
    p_visitor_key: visitorKey,
    p_value: value,
  })

  if (error) fail(error, 'Kunne ikke registrere din stemme.')
  const row = (data as { up_count: number; down_count: number; my_vote: VoteValue }[])[0]
  return row
}

export async function submitIdea(input: {
  title: string
  body: string
  category: string
  importance: string
  author: string
  visitorKey: string
  trap: string
}): Promise<number> {
  const { data, error } = await supabase.rpc('submit_idea', {
    p_title: input.title,
    p_body: input.body,
    p_category: input.category,
    p_importance: input.importance,
    p_author: input.author,
    p_visitor_key: input.visitorKey,
    p_trap: input.trap,
  })

  if (error) fail(error, 'Kunne ikke sende idéen.')
  return data as number
}

export async function addComment(
  ideaId: number,
  visitorKey: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.rpc('add_comment', {
    p_idea_id: ideaId,
    p_visitor_key: visitorKey,
    p_body: body,
    p_author: '',
  })

  if (error) fail(error, 'Kunne ikke sende kommentaren.')
}

// -------------------------------------------------------------------- admin

export async function fetchAllIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select(IDEA_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) fail(error, 'Kunne ikke hente idéerne.')
  return (data ?? []) as unknown as Idea[]
}

export async function updateIdea(id: number, patch: Partial<Idea>): Promise<void> {
  const { error } = await supabase.from('ideas').update(patch).eq('id', id)
  if (error) fail(error, 'Kunne ikke gemme ændringen.')
}

export async function setIdeaStatus(id: number, status: IdeaStatus): Promise<void> {
  await updateIdea(id, { status })
}

export async function approveIdea(id: number): Promise<void> {
  await updateIdea(id, { review_state: 'approved', status: 'nye' })
}

export async function discardIdea(id: number): Promise<void> {
  await updateIdea(id, { review_state: 'discarded' })
}

/** Dubletten lukkes ned og peger på originalen, så historikken bevares. */
export async function mergeIdea(id: number, into: number): Promise<void> {
  await updateIdea(id, { review_state: 'discarded', merged_into: into })
}

export async function deleteIdea(id: number): Promise<void> {
  const { error } = await supabase.from('ideas').delete().eq('id', id)
  if (error) fail(error, 'Kunne ikke slette idéen.')
}

export type ModerationComment = Comment & { idea_title: string }

export async function fetchAllComments(): Promise<ModerationComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`${COMMENT_COLUMNS},ideas(title)`)
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) fail(error, 'Kunne ikke hente kommentarerne.')

  return ((data ?? []) as unknown as (Comment & { ideas: { title: string } | null })[]).map(
    (row) => ({ ...row, idea_title: row.ideas?.title ?? '' }),
  )
}

export async function setCommentHidden(id: number, hidden: boolean): Promise<void> {
  const { error } = await supabase.from('comments').update({ hidden }).eq('id', id)
  if (error) fail(error, 'Kunne ikke opdatere kommentaren.')
}

export async function deleteComment(id: number): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) fail(error, 'Kunne ikke slette kommentaren.')
}

export async function fetchAdminComments(ideaId: number): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_COLUMNS)
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: true })

  if (error) fail(error, 'Kunne ikke hente kommentarerne.')
  return (data ?? []) as unknown as Comment[]
}

export async function updateSettings(patch: Partial<BoardSettings>): Promise<void> {
  const { error } = await supabase.from('board_settings').update(patch).eq('id', 1)
  if (error) fail(error, 'Kunne ikke gemme indstillingen.')
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) return false
  return data === true
}
