export type Member = {
  id: string
  email: string | null
  display_name: string
  created_at: string
}

export type Person = {
  id: string
  name: string
  image_url: string | null
  added_by: string
  happy_to_see_us: number | null
  opinion_change: number | null
  interesting_facts: string | null
  merged_into: string | null
  is_fingerballer?: boolean
  is_fingerballed?: boolean
  created_at: string
}

export type Superlative = {
  id: string
  person_id: string
  text: string
  suggested_by: string
  created_at: string
}

export type Vote = {
  person_id: string
  member_id: string
  value: number
}

export type FeedEvent = {
  id: string
  type: string
  actor: string
  person_id: string | null
  payload: Record<string, any>
  created_at: string
}

export const HAPPY: Record<number, string> = { 1: '😀', 2: '😐', 3: '😬' }
export const HAPPY_LABEL: Record<number, string> = { 1: 'Thrilled', 2: 'Meh', 3: 'Not happy' }
export const OPINION: Record<number, string> = { 1: '📈', 2: '➡️', 3: '📉' }
export const OPINION_LABEL: Record<number, string> = {
  1: 'For the better',
  2: 'No change',
  3: 'For the worse',
}
