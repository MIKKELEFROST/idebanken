import type { IdeaStatus } from './types'

/** Områderne som de blev besluttet i designforløbet. */
export const CATEGORIES = [
  'Kamp',
  'Træning',
  'Økonomi',
  'Spilleregenskaber, værdier og vurderinger',
  'Klubber',
  'Klubbots',
  'Liga og turneringer',
  'Markedet',
  'Andet',
] as const

export const IMPORTANCE = ['Nice to have', 'Vigtigt', 'Kritisk for mig'] as const

export type StatusDef = { value: IdeaStatus; label: string; color: string }

/** Kolonnerne på brættet, i den rækkefølge de vises. */
export const STATUSES: StatusDef[] = [
  { value: 'nye', label: 'Nye idéer', color: '#59A3D8' },
  { value: 'vurdering', label: 'Under vurdering', color: '#E8A33D' },
  { value: 'planlagt', label: 'Godkendt', color: '#8B6FC4' },
  { value: 'udvikling', label: 'I udvikling', color: '#93CB45' },
  { value: 'test', label: 'Under test', color: '#31A8B8' },
  { value: 'udgivet', label: 'Udgivet', color: '#3E9B5F' },
  { value: 'afvist', label: 'Afslået', color: '#C46B6B' },
]

export const statusDef = (value: IdeaStatus): StatusDef =>
  STATUSES.find((s) => s.value === value) ?? STATUSES[0]

export const SORT_OPTIONS = [
  { value: 'stemmer', label: 'Flest stemmer' },
  { value: 'nyeste', label: 'Nyeste først' },
  { value: 'kommentarer', label: 'Mest omdiskuteret' },
] as const

export type SortKey = (typeof SORT_OPTIONS)[number]['value']
