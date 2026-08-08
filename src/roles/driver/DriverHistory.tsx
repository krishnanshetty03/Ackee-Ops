import d from './driver.module.css'
import { useTallawahStore } from '../../store/useStore'
import { selectDriverHistory } from '../../store/selectors'
import { EmptyState } from '../../components/ui/EmptyState'
import { CheckCircle, ListChecks } from '../../components/icons'
import { fmtBags, fmtClock, fmtDayLabel, todayIso } from '../../lib/format'

export function DriverHistory({ driverId }: { driverId: string }) {
  const history = useTallawahStore((st) => selectDriverHistory(st, driverId))
  const now = useTallawahStore((st) => st.now)
  const today = todayIso(now)

  if (history.length === 0) {
    return <EmptyState icon={<ListChecks size={22} />} title="No completed shipments yet" desc="Runs you finish and hand off to receiving will show up here." />
  }

  return (
    <>
      <div className={d.sectionLabel}>{history.length} completed shipments</div>
      <div className={d.stopList}>
        {history.map((sh) => {
          const bags = sh.stops.reduce((sum, st) => sum + (st.actualBags ?? 0), 0)
          return (
            <div key={sh.id} className={d.historyItem}>
              <span className={d.historyIcon}>
                <CheckCircle size={16} />
              </span>
              <div className={d.historyText}>
                <div className={d.historyTitle}>{sh.id}</div>
                <div className={d.historyMeta}>
                  {sh.stops.length} stops · {fmtBags(bags)} · {sh.closedAt ? fmtDayLabel(new Date(sh.closedAt).toISOString().slice(0, 10), today) : ''}
                  {sh.closedAt ? ` · ${fmtClock(sh.closedAt)}` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
