// Full-screen one-shot celebration: a big rubber stamp thwacks down over a
// burst of falling confetti. Zero deps. Render it briefly, then unmount.
const COLORS = ['#ff5a1f', '#ff2e7e', '#6c4cff', '#11b3ff', '#b6e600', '#ffd23f']

export default function Celebration({ label = 'SCORED' }: { label?: string }) {
  const pieces = Array.from({ length: 46 }, (_, i) => ({
    i,
    left: Math.random() * 100,
    delay: Math.random() * 0.25,
    dur: 1 + Math.random() * 0.9,
    color: COLORS[i % COLORS.length],
    size: 7 + Math.random() * 7,
  }))

  return (
    <div className="celebrate" aria-hidden="true">
      <div className="confetti">
        {pieces.map((p) => (
          <span
            key={p.i}
            className="confetto"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.6,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>
      <div className="big-stamp">{label}</div>
    </div>
  )
}
