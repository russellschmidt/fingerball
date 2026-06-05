import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Member } from './lib/types'

type AuthState = {
  session: Session | null
  member: Member | null
  loading: boolean
  refreshMember: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadMember(uid: string) {
    const { data } = await supabase.from('members').select('*').eq('id', uid).maybeSingle()
    setMember((data as Member) ?? null)
  }

  async function refreshMember() {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) await loadMember(data.session.user.id)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMember(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user) await loadMember(data.session.user.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user) await loadMember(s.user.id)
      else setMember(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <Ctx.Provider value={{ session, member, loading, refreshMember, signOut }}>
      {children}
    </Ctx.Provider>
  )
}
