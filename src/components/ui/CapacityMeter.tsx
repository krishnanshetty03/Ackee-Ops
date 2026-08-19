import s from './CapacityMeter.module.css'

export function CapacityMeter({
  value,
  ceiling,
  segments,
  label = 'Bags requested today',
  caption,
}: {
  value: number
  ceiling: number
  segments?: number
  label?: string
  caption?: string
}) {
  const pct = Math.min(1, value / ceiling)
  const over = value > ceiling
  const warn = !over && pct > 0.8
  const tone = over ? s.over : warn ? s.warn : ''

  return (
    <div className={s.wrap}>
      <div className={s.labels}>
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span className={s.figure}>
          {value} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>/ {ceiling} bags</span>
        </span>
      </div>
      <div className={s.track}>
        <div className={[s.fill, tone].join(' ')} style={{ width: `${pct * 100}%` }} />
        {segments && segments > 1 && (
          <div className={s.segments}>
            {Array.from({ length: segments }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        )}
      </div>
      {caption && <div className={[s.caption, over ? s.over : ''].join(' ')}>{caption}</div>}
    </div>
  )
}
