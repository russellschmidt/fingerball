// A crying, bleeding finger — the mascot of shame for FINGERBALLED people.
export default function BloodyFinger({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="bloody"
      viewBox="0 0 64 86"
      width={size}
      height={(size * 86) / 64}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bf-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6cda8" />
          <stop offset="100%" stopColor="#e0a578" />
        </linearGradient>
        <linearGradient id="bf-blood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e21b3c" />
          <stop offset="100%" stopColor="#8d0017" />
        </linearGradient>
      </defs>
      {/* finger */}
      <rect x="19" y="6" width="26" height="62" rx="13" fill="url(#bf-skin)" stroke="#c98a5e" strokeWidth="2" />
      {/* nail */}
      <ellipse cx="32" cy="16" rx="7" ry="9" fill="#f7ddc7" stroke="#cf9e78" strokeWidth="1.2" />
      {/* eyes */}
      <circle cx="27" cy="38" r="2.6" fill="#1c1714" />
      <circle cx="37" cy="38" r="2.6" fill="#1c1714" />
      {/* tears */}
      <path d="M27 41 q-2.4 7 0 9 q2.4 -2 0 -9 Z" fill="#36a3ff" />
      <path d="M37 41 q-2.4 7 0 9 q2.4 -2 0 -9 Z" fill="#36a3ff" />
      {/* frown */}
      <path d="M27 53 q5 -5 10 0" fill="none" stroke="#1c1714" strokeWidth="2" strokeLinecap="round" />
      {/* blood pool + drips */}
      <path d="M19 60 q7 9 13 2 q6 9 13 1 l0 7 q-13 8 -26 0 Z" fill="url(#bf-blood)" />
      <path d="M24 72 q-2 7 0 10 q2 -3 0 -10 Z" fill="url(#bf-blood)" />
      <path d="M40 74 q-2 6 0 9 q2 -3 0 -9 Z" fill="url(#bf-blood)" />
    </svg>
  )
}
