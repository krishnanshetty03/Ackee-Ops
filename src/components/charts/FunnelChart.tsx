// Pipeline funnel — one trapezoid per stage, width proportional to the value
// sitting in it, so the drop-off between stages is the thing you see first.
//
// Band fills are fixed hex rather than theme tokens: the value sits *inside* the
// band, and a single dark ink reads on all four of these golds in either theme.
const BAND_FILLS = ['#f6e2a3', '#f0c000', '#d9a406', '#b6800a']
const BAND_INK = '#1c1810'

const W = 268
const BAND_H = 40
const GAP = 4
const CENTER_X = 74
const MAX_HALF = 66
const MIN_HALF = 15
const LABEL_X = 152

export interface FunnelBand {
  label: string
  value: number
  caption: string
}

export function FunnelChart({ bands, valueFormat }: { bands: FunnelBand[]; valueFormat: (n: number) => string }) {
  const max = Math.max(...bands.map((b) => b.value), 1)
  const halfWidth = (v: number) => MIN_HALF + (v / max) * (MAX_HALF - MIN_HALF)
  const height = bands.length * BAND_H + (bands.length - 1) * GAP

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width={W} height={height} style={{ display: 'block', maxWidth: '100%' }} role="img" aria-label="Open pipeline by stage">
      {bands.map((band, i) => {
        const top = i * (BAND_H + GAP)
        const bottom = top + BAND_H
        const halfTop = halfWidth(band.value)
        // taper into the next stage — the last band narrows to a tip
        const halfBottom = i === bands.length - 1 ? halfTop * 0.55 : halfWidth(bands[i + 1].value)
        const mid = top + BAND_H / 2
        return (
          <g key={band.label}>
            <path
              d={`M ${CENTER_X - halfTop},${top} L ${CENTER_X + halfTop},${top} L ${CENTER_X + halfBottom},${bottom} L ${CENTER_X - halfBottom},${bottom} Z`}
              fill={BAND_FILLS[i % BAND_FILLS.length]}
            />
            <text x={CENTER_X} y={mid} fontSize="11.5" fontWeight="700" fill={BAND_INK} textAnchor="middle" dominantBaseline="central">
              {valueFormat(band.value)}
            </text>
            <text x={LABEL_X} y={mid - 5} fontSize="11.5" fontWeight="700" fill="var(--text)" dominantBaseline="central">
              {band.label}
            </text>
            <text x={LABEL_X} y={mid + 8} fontSize="10.5" fill="var(--muted)" dominantBaseline="central">
              {band.caption}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
