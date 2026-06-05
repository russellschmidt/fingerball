import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFeedData, scoreFor, myVote } from '../lib/data'
import { useAuth } from '../auth'
import { supabase } from '../lib/supabase'
import { HAPPY, HAPPY_LABEL, OPINION, OPINION_LABEL } from '../lib/types'
import { fxUp, fxDown, fxUndo } from '../lib/fx'

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const { member } = useAuth()
  const navigate = useNavigate()
  const { people, members, votes, superlatives, loading } = useFeedData()

  const [supInput, setSupInput] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="muted center screen">Loading…</p>
  const person = people.find((p) => p.id === id)
  if (!person) return <p className="muted center screen">That card is gone (maybe merged).</p>

  const sups = superlatives.filter((s) => s.person_id === person.id)
  const score = scoreFor(votes, person.id)
  const mine = myVote(votes, person.id, member?.id)

  async function vote(value: number) {
    if (!member || !person) return
    if (mine === value) {
      fxUndo()
      await supabase.from('votes').delete().eq('person_id', person.id).eq('member_id', member.id)
    } else {
      value > 0 ? fxUp() : fxDown()
      await supabase
        .from('votes')
        .upsert({ person_id: person.id, member_id: member.id, value }, { onConflict: 'person_id,member_id' })
      await supabase.from('events').insert({ type: 'voted', actor: member.id, person_id: person.id, payload: { value } })
    }
  }

  async function suggest(e: FormEvent) {
    e.preventDefault()
    if (!member || !person) return
    const text = supInput.trim()
    if (!text) return
    setSupInput('')
    await supabase.from('superlatives').insert({ person_id: person.id, text, suggested_by: member.id })
    await supabase.from('events').insert({
      type: 'superlative_added',
      actor: member.id,
      person_id: person.id,
      payload: { text },
    })
  }

  async function doMerge() {
    if (!mergeTarget || !person) return
    setBusy(true)
    const { error } = await supabase.rpc('merge_person', { from_id: person.id, into_id: mergeTarget })
    setBusy(false)
    if (error) alert(error.message)
    else navigate(`/person/${mergeTarget}`)
  }

  const others = people.filter((p) => p.id !== person.id)

  return (
    <div className="screen">
      <header className="topbar">
        <button className="ghost" onClick={() => navigate('/')}>
          ← Feed
        </button>
        <span className="logo small">{person.name}</span>
        <span style={{ width: 60 }} />
      </header>

      <main className="detail">
        <div className="detail-head">
          {person.image_url ? (
            <img className="avatar big" src={person.image_url} alt={person.name} />
          ) : (
            <div className="avatar big placeholder">{person.name.slice(0, 1).toUpperCase()}</div>
          )}
          <div>
            <h2>{person.name}</h2>
            <p className="muted">added by {members[person.added_by]?.display_name ?? 'someone'}</p>
            <div className="votecol row">
              <button className={`vote up ${mine > 0 ? 'on' : ''}`} onClick={() => vote(1)}>
                ▲
              </button>
              <span className={`score ${score > 0 ? 'pos' : score < 0 ? 'neg' : ''}`}>{score}</span>
              <button className={`vote down ${mine < 0 ? 'on' : ''}`} onClick={() => vote(-1)}>
                ▼
              </button>
            </div>
          </div>
        </div>

        <div className="stat-row">
          {person.happy_to_see_us && (
            <div className="stat">
              <span className="big">{HAPPY[person.happy_to_see_us]}</span>
              <span className="lbl">{HAPPY_LABEL[person.happy_to_see_us]}</span>
            </div>
          )}
          {person.opinion_change && (
            <div className="stat">
              <span className="big">{OPINION[person.opinion_change]}</span>
              <span className="lbl">{OPINION_LABEL[person.opinion_change]}</span>
            </div>
          )}
        </div>

        {person.interesting_facts && (
          <section>
            <h4>Facts</h4>
            <p className="facts">{person.interesting_facts}</p>
          </section>
        )}

        <section>
          <h4>Superlatives</h4>
          {sups.length === 0 && <p className="muted">None yet — suggest one.</p>}
          <div className="chips">
            {sups.map((s) => (
              <span className="chip" key={s.id}>
                {s.text}
                <em className="by"> · {members[s.suggested_by]?.display_name ?? '?'}</em>
              </span>
            ))}
          </div>
          <form className="sup-add" onSubmit={suggest}>
            <input
              value={supInput}
              onChange={(e) => setSupInput(e.target.value)}
              placeholder="Suggest a superlative"
            />
            <button className="ghost" type="submit">
              Add
            </button>
          </form>
        </section>

        {others.length > 0 && (
          <section className="merge">
            <h4>Merge</h4>
            <p className="muted">Same person as another card? Merge this one into it.</p>
            <div className="sup-add">
              <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}>
                <option value="">Choose a card…</option>
                {others.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button className="ghost danger" disabled={!mergeTarget || busy} onClick={doMerge}>
                {busy ? '…' : 'Merge'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
