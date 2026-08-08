// Small dependency-free SVG bar chart with an optional "highlighted range" —
// mirrors the emphasized-recent-period pattern (muted history, bright current window).
export function MiniBarChart({
  values,
  width = 280,
  height = 84,
  highlightFrom,
  barColor = 'var(--border-strong)',
  highlightColor = 'var(--green)',
  gap = 3,
}: {
  values: number[]
  width?: number
  height?: number
  /** index from which bars use highlightColor instead of barColor */
  highlightFrom?: number
  barColor?: string
  highlightColor?: string
  gap?: number
}) {
  const max = Math.max(...values, 1)
  const barWidth = (width - gap * (values.length - 1)) / values.length

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {values.map((v, i) => {
        const h = Math.max(2, (v / max) * (height - 2))
        const x = i * (barWidth + gap)
        const y = height - h
        const highlighted = highlightFrom !== undefined && i >= highlightFrom
        return <rect key={i} x={x} y={y} width={barWidth} height={h} rx={Math.min(2.5, barWidth / 2)} fill={highlighted ? highlightColor : barColor} opacity={highlighted ? 1 : 0.55} />
      })}
    </svg>
  )
}
