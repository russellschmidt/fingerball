import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth'
import { compressImage } from '../lib/image'
import { fxSwish } from '../lib/fx'
import { HAPPY, HAPPY_LABEL, OPINION, OPINION_LABEL } from '../lib/types'

export default function AddPerson() {
  const { member } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [happy, setHappy] = useState<number | null>(null)
  const [opinion, setOpinion] = useState<number | null>(null)
  const [facts, setFacts] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [supInput, setSupInput] = useState('')
  const [sups, setSups] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  function addSup() {
    const t = supInput.trim()
    if (t && !sups.includes(t)) setSups([...sups, t])
    setSupInput('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!member) return
    setBusy(true)
    setErr(null)
    try {
      let image_url: string | null = null
      if (file) {
        const img = await compressImage(file)
        const ext = img.name.split('.').pop() || 'jpg'
        const path = `${crypto.randomUUID()}.${ext}`
        const up = await supabase.storage.from('people-photos').upload(path, img, {
          cacheControl: '3600',
          upsert: false,
          contentType: img.type,
        })
        if (up.error) throw up.error
        image_url = supabase.storage.from('people-photos').getPublicUrl(path).data.publicUrl
      }

      const ins = await supabase
        .from('people')
        .insert({
          name: name.trim(),
          image_url,
          added_by: member.id,
          happy_to_see_us: happy,
          opinion_change: opinion,
          interesting_facts: facts.trim() || null,
        })
        .select('id')
        .single()
      if (ins.error) throw ins.error
      const personId = ins.data.id as string

      if (sups.length) {
        const rows = sups.map((text) => ({
          person_id: personId,
          text,
          suggested_by: member.id,
        }))
        const s = await supabase.from('superlatives').insert(rows)
        if (s.error) throw s.error
      }

      await supabase.from('events').insert({
        type: 'person_added',
        actor: member.id,
        person_id: personId,
        payload: { name: name.trim() },
      })

      fxSwish()
      navigate('/')
    } catch (e: any) {
      setErr(e.message ?? 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="ghost" onClick={() => navigate('/')}>
          ← Back
        </button>
        <span className="logo small">Add person</span>
        <span style={{ width: 60 }} />
      </header>

      <form className="form" onSubmit={submit}>
        <label className="field-label">Name *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Who is it?" />

        <label className="field-label">Photo (optional)</label>
        {preview && (
          <div className="photo-preview-wrap">
            <img className="photo-preview" src={preview} alt="preview" />
          </div>
        )}
        <div className="photo-actions">
          <label className="photo-btn">
            🖼️ Camera roll
            <input type="file" accept="image/*" onChange={onPhoto} hidden />
          </label>
          <label className="photo-btn">
            📸 Camera
            <input type="file" accept="image/*" capture="environment" onChange={onPhoto} hidden />
          </label>
        </div>

        <label className="field-label">Happy to see us?</label>
        <div className="emoji-pick">
          {[1, 2, 3].map((v) => (
            <button
              type="button"
              key={v}
              className={`emoji-btn ${happy === v ? 'on' : ''}`}
              onClick={() => setHappy(happy === v ? null : v)}
            >
              <span className="big">{HAPPY[v]}</span>
              <span className="lbl">{HAPPY_LABEL[v]}</span>
            </button>
          ))}
        </div>

        <label className="field-label">Opinion of us changed?</label>
        <div className="emoji-pick">
          {[1, 2, 3].map((v) => (
            <button
              type="button"
              key={v}
              className={`emoji-btn ${opinion === v ? 'on' : ''}`}
              onClick={() => setOpinion(opinion === v ? null : v)}
            >
              <span className="big">{OPINION[v]}</span>
              <span className="lbl">{OPINION_LABEL[v]}</span>
            </button>
          ))}
        </div>

        <label className="field-label">Interesting facts</label>
        <textarea value={facts} onChange={(e) => setFacts(e.target.value)} rows={3} placeholder="Anything notable…" />

        <label className="field-label">Superlatives</label>
        <div className="sup-add">
          <input
            value={supInput}
            onChange={(e) => setSupInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSup()
              }
            }}
            placeholder="e.g. Most Likely To Vanish"
          />
          <button type="button" className="ghost" onClick={addSup}>
            Add
          </button>
        </div>
        {sups.length > 0 && (
          <div className="chips">
            {sups.map((s) => (
              <span className="chip" key={s} onClick={() => setSups(sups.filter((x) => x !== s))}>
                {s} ✕
              </span>
            ))}
          </div>
        )}

        {err && <p className="error">{err}</p>}
        <button className="primary" disabled={busy || !name.trim()}>
          {busy ? 'Saving…' : 'Add to the feed'}
        </button>
      </form>
    </div>
  )
}
