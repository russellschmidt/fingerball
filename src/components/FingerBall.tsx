import { fxDisco } from '../lib/fx'

type Props = { size?: number; speed?: number }

// A finger with a steel rod surgically implanted in the fingertip, with a ball
// on the end. The whole rig spins in an endless loop. Pure SVG + CSS.
// Tap it to toggle DISCO MODE. 🕺
export default function FingerBall({ size = 120, speed = 3.5 }: Props) {
  function toggleDisco() {
    const on = document.body.classList.toggle('disco')
    fxDisco(on)
  }
  return (
    <div
      className="fingerball"
      style={{ width: size, height: size }}
      onClick={toggleDisco}
      role="button"
      title="tap me 🕺"
    >
      <svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        style={{ animationDuration: `${speed}s` }}
        className="fingerball-spin"
      >
        <defs>
          <radialGradient id="ball" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#ff8a8a" />
            <stop offset="45%" stopColor="#ef2d56" />
            <stop offset="100%" stopColor="#9d0b2c" />
          </radialGradient>
          <linearGradient id="rod" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c8696" />
            <stop offset="45%" stopColor="#e8edf4" />
            <stop offset="100%" stopColor="#6b7484" />
          </linearGradient>
          <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6cda8" />
            <stop offset="100%" stopColor="#e0a578" />
          </linearGradient>
        </defs>

        {/* finger (base at bottom, fingertip pointing up toward the rod) */}
        <rect x="103" y="126" width="34" height="92" rx="17" fill="url(#skin)" stroke="#c98a5e" strokeWidth="2" />
        {/* knuckle crease */}
        <path d="M106 170 q14 8 28 0" fill="none" stroke="#c98a5e" strokeWidth="2" opacity="0.7" />
        {/* fingernail */}
        <ellipse cx="120" cy="140" rx="10" ry="13" fill="#f7ddc7" stroke="#cf9e78" strokeWidth="1.5" />

        {/* steel rod implanted into the fingertip */}
        <rect x="116" y="56" width="8" height="74" rx="3" fill="url(#rod)" stroke="#5d6675" strokeWidth="1" />
        {/* surgical insertion point: stitches where the rod enters the finger */}
        <g stroke="#a23" strokeWidth="2" strokeLinecap="round">
          <line x1="110" y1="128" x2="130" y2="128" />
          <line x1="112" y1="124" x2="112" y2="132" />
          <line x1="120" y1="124" x2="120" y2="132" />
          <line x1="128" y1="124" x2="128" y2="132" />
        </g>

        {/* the ball */}
        <circle cx="120" cy="40" r="24" fill="url(#ball)" stroke="#7a0a22" strokeWidth="1.5" />
        <ellipse cx="112" cy="32" rx="7" ry="4" fill="#ffffff" opacity="0.5" />
      </svg>
    </div>
  )
}
