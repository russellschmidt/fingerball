import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import type { Member, Person, Superlative, Vote, FeedEvent } from './types'

export type FeedData = {
  people: Person[]
  members: Record<string, Member>
  votes: Vote[]
  superlatives: Superlative[]
  events: FeedEvent[]
  loading: boolean
  reload: () => Promise<void>
}

export function useFeedData(): FeedData {
  const [people, setPeople] = useState<Person[]>([])
  const [members, setMembers] = useState<Record<string, Member>>({})
  const [votes, setVotes] = useState<Vote[]>([])
  const [superlatives, setSuperlatives] = useState<Superlative[]>([])
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reload = useCallback(async () => {
    const [p, m, v, s, e] = await Promise.all([
      supabase.from('people').select('*').is('merged_into', null).order('created_at', { ascending: false }),
      supabase.from('members').select('*'),
      supabase.from('votes').select('person_id, member_id, value'),
      supabase.from('superlatives').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(40),
    ])
    setPeople((p.data as Person[]) ?? [])
    const mm: Record<string, Member> = {}
    ;((m.data as Member[]) ?? []).forEach((x) => (mm[x.id] = x))
    setMembers(mm)
    setVotes((v.data as Vote[]) ?? [])
    setSuperlatives((s.data as Superlative[]) ?? [])
    setEvents((e.data as FeedEvent[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
    // Any change to any table triggers a debounced refetch. Simple and
    // plenty fast for a small friend group.
    const debouncedReload = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => reload(), 250)
    }
    const ch = supabase
      .channel('fingerball-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, debouncedReload)
      .subscribe()
    return () => {
      if (timer.current) clearTimeout(timer.current)
      supabase.removeChannel(ch)
    }
  }, [reload])

  return { people, members, votes, superlatives, events, loading, reload }
}

export function scoreFor(votes: Vote[], personId: string): number {
  return votes.filter((v) => v.person_id === personId).reduce((a, v) => a + v.value, 0)
}

/** Number of upvotes (👍) a person has. */
export function upvotesFor(votes: Vote[], personId: string): number {
  return votes.filter((v) => v.person_id === personId && v.value === 1).length
}

/** Upvotes needed to earn the FINGERBALLER stamp. */
export const FINGERBALLER_VOTES = 5

export function myVote(votes: Vote[], personId: string, memberId: string | undefined): number {
  if (!memberId) return 0
  return votes.find((v) => v.person_id === personId && v.member_id === memberId)?.value ?? 0
}
