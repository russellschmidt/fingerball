import { Link, useNavigate } from 'react-router-dom'
import { useFeedData, scoreFor, myVote } from '../lib/data'
import { useAuth } from '../auth'
import { supabase } from '../lib/supabase'
import { HAPPY, OPINION, type FeedEvent } from '../lib/types'
import { fxUp, fxDown, fxUndo } from '../lib/fx'
import FingerBall from './FingerBall'

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Feed() {
  const { member, signOut } = useAuth()
  const { people, members, votes, superlatives, events, loading } = useFeedData()
  const navigate = useNavigate()

  const nameOf = (uid: string) => members[uid]?.display_name ?? 'someone'
  const personName = (id: string | null) =>
    id ? people.find((p) => p.id === id)?.name ?? 'someone' : 'someone'

  function describe(e: FeedEvent): string {
    const who = nameOf(e.actor)
    switch (e.type) {
      case 'person_added':
        return `${who} added ${personName(e.person_id)}`
      case 'superlative_added':
        return `${who} crowned ${personName(e.person_id)} “${e.payload?.text ?? ''}”`
      case 'voted':
        return `${who} ${e.payload?.value > 0 ? '👍' : '👎'} ${personName(e.person_id)}`
      case 'merged':
        return `${who} merged two cards`
      default:
        return `${who} did something`
    }
  }

  async function vote(personId: string, value: number) {
    if (!member) return
    const current = myVote(votes, personId, member.id)
    if (current === value) {
      fxUndo()
      await supabase.from('votes').delete().eq('person_id', personId).eq('member_id', member.id)
    } else {
      value > 0 ? fxUp() : fxDown()
      await supabase
        .from('votes')
        .upsert({ person_id: personId, member_id: member.id, value }, { onConflict: 'person_id,member_id' })
      await supabase.from('events').insert({
        type: 'voted',
        actor: member.id,
        person_id: personId,
        payload: { value },
      })
    }
  }

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">
          <FingerBall size={44} speed={3} />
          <span className="logo small">Fingerball</span>
        </div>
        <div className="topbar-right">
          <span className="me">{member?.display_name}</span>
          <button className="ghost tiny" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {events.length > 0 && (
        <div className="ticker">
          {events.slice(0, 8).map((e) => (
            <span
              key={e.id}
              className="ticker-item"
              onClick={() => e.person_id && navigate(`/person/${e.person_id}`)}
            >
              {describe(e)} · {timeAgo(e.created_at)}
            </span>
          ))}
        </div>
      )}

      <main className="list">
        {loading && <p className="muted center">Loading…</p>}
        {!loading && people.length === 0 && (
          <p className="muted center">No one scored yet. Tap ＋ to add the first person.</p>
        )}

        {people.map((p) => {
          const sups = superlatives.filter((s) => s.person_id === p.id)
          const score = scoreFor(votes, p.id)
          const mine = myVote(votes, p.id, member?.id)
          return (
            <article className="card person" key={p.id}>
              <Link to={`/person/${p.id}`} className="person-main">
                {p.image_url ? (
                  <img className="avatar" src={p.image_url} alt={p.name} />
                ) : (
                  <div className="avatar placeholder">{p.name.slice(0, 1).toUpperCase()}</div>
                )}
                <div className="person-text">
                  <h3>{p.name}</h3>
                  <div className="emoji-row">
                    {p.happy_to_see_us && <span title="Happy to see us">{HAPPY[p.happy_to_see_us]}</span>}
                    {p.opinion_change && <span title="Opinion of us">{OPINION[p.opinion_change]}</span>}
                  </div>
                  {p.interesting_facts && <p className="facts">{p.interesting_facts}</p>}
                  {sups.length > 0 && (
                    <div className="chips">
                      {sups.slice(0, 4).map((s) => (
                        <span className="chip" key={s.id}>
                          {s.text}
                        </span>
                      ))}
                      {sups.length > 4 && <span className="chip more">+{sups.length - 4}</span>}
                    </div>
                  )}
                </div>
              </Link>
              <div className="votecol">
                <button className={`vote up ${mine > 0 ? 'on' : ''}`} onClick={() => vote(p.id, 1)}>
                  ▲
                </button>
                <span className={`score ${score > 0 ? 'pos' : score < 0 ? 'neg' : ''}`}>{score}</span>
                <button className={`vote down ${mine < 0 ? 'on' : ''}`} onClick={() => vote(p.id, -1)}>
                  ▼
                </button>
              </div>
            </article>
          )
        })}
      </main>

      <button className="fab" onClick={() => navigate('/add')} aria-label="Add person">
        ＋
      </button>
    </div>
  )
}
