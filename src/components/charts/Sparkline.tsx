// Small dependency-free SVG sparkline — smoothed polyline + soft gradient fill.
// Values only; no axes/gridlines by design (a sparkline shows shape, not scale).
export function Sparkline({
  values,
  width = 120,
  height = 40,
  color = 'var(--green)',
  strokeWidth = 2,
  fill = true,
}: {
  values: number[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
  fill?: boolean
}) {
  if (values.length < 2) return <svg width={width} height={height} />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = strokeWidth
  const stepX = (width - pad * 2) / (values.length - 1)
  const pts = values.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return [x, y]
  })

  // Catmull-Rom -> Bezier smoothing for a gentle curve instead of jagged segments
  function smoothPath(points: number[][]) {
    if (points.length < 3) return `M ${points.map((p) => p.join(',')).join(' L ')}`
    let d = `M ${points[0][0]},${points[0][1]}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2] ?? p2
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
    }
    return d
  }

  const linePath = smoothPath(pts)
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]},${height} L ${pts[0][0]},${height} Z`
  const gradId = `spark-grad-${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {fill && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path d={linePath} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={strokeWidth + 1.2} fill={color} />
    </svg>
  )
}
