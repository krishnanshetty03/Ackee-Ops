import c from './BarCharts.module.css'

export interface HBarDatum {
  label: string
  meta?: string
  value: number
}

/** Ranked horizontal bars — for "top N by amount" lists where the label is a
 *  name that needs room to breathe, so it sits above its own bar. */
export function HBarChart({ data, color = 'var(--gold-fill)', valueFormat }: { data: HBarDatum[]; color?: string; valueFormat: (n: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={c.rows}>
      {data.map((d) => (
        <div key={d.label} className={c.row}>
          <span className={c.rowLabel}>
            {d.label}
            {d.meta && <span className={c.rowMeta}> · {d.meta}</span>}
          </span>
          <span className={c.rowValue}>{valueFormat(d.value)}</span>
          <div className={c.rowTrack}>
            <div className={c.rowFill} style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}
