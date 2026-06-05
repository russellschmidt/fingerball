// Zero-asset sound + haptics. All sounds are synthesized with Web Audio, so
// nothing to download. Call these from inside a tap handler (before any await)
// so iOS resumes the audio context on the user gesture.
//
// Note: navigator.vibrate works on Android; iOS Safari ignores it (Apple
// doesn't implement web vibration). Sound still plays everywhere.

let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported — ignore */
  }
}

function tone(
  c: AudioContext,
  type: OscillatorType,
  freqs: [number, number][], // [frequency, time-offset]
  peak: number,
  dur: number,
) {
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freqs[0][0], t)
  for (const [f, dt] of freqs.slice(1)) o.frequency.exponentialRampToValueAtTime(f, t + dt)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

/** Upvote: cartoon boing (pitch springs up then settles). */
export function fxUp() {
  const c = ac()
  if (!c) return
  tone(c, 'triangle', [[300, 0], [900, 0.08], [560, 0.18]], 0.25, 0.26)
  buzz(15)
}

/** Downvote: sad descending womp. */
export function fxDown() {
  const c = ac()
  if (!c) return
  tone(c, 'sawtooth', [[420, 0], [120, 0.26]], 0.2, 0.3)
  buzz([10, 30, 10])
}

/** Undo a vote: soft tick. */
export function fxUndo() {
  const c = ac()
  if (!c) return
  tone(c, 'sine', [[240, 0]], 0.12, 0.12)
  buzz(8)
}

/** Disco toggle: ascending sparkle on, descending on off. */
export function fxDisco(on: boolean) {
  const c = ac()
  if (!c) return
  const notes = on ? [523, 659, 784, 1047] : [784, 659, 523, 392]
  notes.forEach((f, i) => {
    const t = c.currentTime + i * 0.07
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'square'
    o.frequency.setValueAtTime(f, t)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    o.connect(g).connect(c.destination)
    o.start(t)
    o.stop(t + 0.13)
  })
  buzz(on ? [15, 20, 15, 20, 30] : 20)
}

/** New person added: basketball swish (filtered noise). */
export function fxSwish() {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  const dur = 0.35
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(1100, t)
  bp.frequency.exponentialRampToValueAtTime(4200, t + dur)
  bp.Q.value = 0.8
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.05)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(g).connect(c.destination)
  src.start(t)
  src.stop(t + dur)
  buzz([20, 25, 45])
}
