import c from './BarCharts.module.css'

export interface ColumnDatum {
  label: string
  value: number
}

/** Vertical bars with the figure above each one — for a period-over-period
 *  comparison where the label matters as much as the shape (Q1 vs Q2, Jan vs Feb). */
export function ColumnChart({
  data,
  height = 96,
  color = 'var(--gold-fill)',
  valueFormat,
}: {
  data: ColumnDatum[]
  height?: number
  color?: string
  valueFormat: (n: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={c.columns}>
      {data.map((d) => (
        <div key={d.label} className={c.column} title={`${d.label}: ${valueFormat(d.value)}`}>
          <span className={c.columnValue}>{valueFormat(d.value)}</span>
          <div className={c.columnTrack} style={{ height }}>
            {/* a 0 month still gets a hairline so the baseline reads as a bar chart, not a gap */}
            <div className={c.columnFill} style={{ height: Math.max(2, (d.value / max) * height), background: color }} />
          </div>
          <span className={c.columnLabel}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}
