// Semicircular goal gauge — threshold bands plus a needle, the "are we on track
// against the number" shape executives read without having to think about it.
// Bands are fractions of the goal: behind / close / on target.
const BANDS: { from: number; to: number; color: string }[] = [
  { from: 0, to: 0.5, color: 'var(--red)' },
  { from: 0.5, to: 0.8, color: 'var(--gold-fill)' },
  { from: 0.8, to: 1, color: 'var(--green)' },
]

const W = 240
const H = 136
const CX = W / 2
const CY = 122
const R = 96
const TRACK = 15

/** fraction of the goal (0..1) -> point on the arc; 0 is the left end, 1 the right */
function pointAt(fraction: number, radius: number) {
  const rad = (Math.PI * (1 - fraction)) / 1
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) }
}

function bandPath(from: number, to: number) {
  const outer = R + TRACK / 2
  const inner = R - TRACK / 2
  const a = pointAt(from, outer)
  const b = pointAt(to, outer)
  const c = pointAt(to, inner)
  const d = pointAt(from, inner)
  return `M ${a.x},${a.y} A ${outer},${outer} 0 0 1 ${b.x},${b.y} L ${c.x},${c.y} A ${inner},${inner} 0 0 0 ${d.x},${d.y} Z`
}

export function GaugeChart({ value, goal, tickFormat }: { value: number; goal: number; tickFormat: (n: number) => string }) {
  // needle can't leave the dial, but the caller still shows the true figure
  const fraction = goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0
  const tip = pointAt(fraction, R + TRACK / 2 - 4)
  const tail = pointAt(fraction, -12)

  // sized in px like the other charts here — a percentage width leaves the height
  // indefinite, and the dial then draws over whatever the tile puts below it
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', margin: '0 auto' }} role="img" aria-label={`${tickFormat(value)} of ${tickFormat(goal)} goal`}>
      {BANDS.map((b) => (
        <path key={b.from} d={bandPath(b.from, b.to)} fill={b.color} opacity={fraction >= b.from ? 0.95 : 0.28} />
      ))}

      {/* scale ticks at 0 / half / goal */}
      {[0, 0.5, 1].map((f) => {
        const p = pointAt(f, R + TRACK / 2 + 11)
        return (
          <text key={f} x={p.x} y={p.y} fontSize="9.5" fontWeight="600" fill="var(--muted)" textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'} dominantBaseline={f === 0.5 ? 'auto' : 'middle'}>
            {tickFormat(goal * f)}
          </text>
        )
      })}

      <path d={`M ${tail.x},${tail.y} L ${tip.x},${tip.y}`} stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="6.5" fill="var(--surface)" stroke="var(--text)" strokeWidth="3" />
    </svg>
  )
}
