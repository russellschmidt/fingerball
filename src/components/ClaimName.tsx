import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth'
import FingerBall from './FingerBall'

export default function ClaimName() {
  const { session, refreshMember, signOut } = useAuth()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function claim(e: FormEvent) {
    e.preventDefault()
    if (!session?.user) return
    setBusy(true)
    setErr(null)
    const { error } = await supabase.from('members').insert({
      id: session.user.id,
      email: session.user.email,
      display_name: name.trim(),
    })
    setBusy(false)
    if (error) {
      if (error.code === '23505') setErr('That name is taken — pick another.')
      else setErr(error.message)
      return
    }
    await refreshMember()
  }

  return (
    <div className="screen center">
      <FingerBall size={120} />
      <h1 className="logo">Claim your name</h1>
      <p className="tagline">This is how friends will see your scores.</p>
      <form className="card narrow" onSubmit={claim}>
        <label className="field-label">Display name</label>
        <input
          required
          maxLength={24}
          placeholder="e.g. BigMike"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {err && <p className="error">{err}</p>}
        <button className="primary" disabled={busy || !name.trim()}>
          {busy ? 'Claiming…' : "Let's go"}
        </button>
        <button type="button" className="ghost" onClick={signOut}>
          Sign out
        </button>
      </form>
    </div>
  )
}
