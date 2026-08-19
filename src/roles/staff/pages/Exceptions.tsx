import { useState } from 'react'
import s from '../staff.module.css'
import { PageHead, PageInner } from '../StaffShell'
import { useTallawahStore } from '../../../store/useStore'
import { Card } from '../../../components/ui/Card'
import { Tabs } from '../../../components/ui/Tabs'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import { AlertTriangle, CheckCircle, Clock } from '../../../components/icons'
import { fmtRelativeTime } from '../../../lib/format'
import type { ExceptionType } from '../../../lib/types'

const TYPE_LABEL: Record<ExceptionType, string> = {
  farmer_not_ready: 'Farmer not ready',
  route_over_capacity: 'Route over capacity',
  rescheduled: 'Rescheduled',
  quality_fail: 'Quality check failed',
  other: 'Other',
}

export function Exceptions() {
  const exceptions = useTallawahStore((st) => st.exceptions)
  const now = useTallawahStore((st) => st.now)
  const resolveException = useTallawahStore((st) => st.resolveException)
  const { push } = useToast()
  const [tab, setTab] = useState<'open' | 'resolved'>('open')

  const filtered = exceptions.filter((e) => e.status === tab).sort((a, b) => b.createdAt - a.createdAt)
  const openCount = exceptions.filter((e) => e.status === 'open').length
  const resolvedCount = exceptions.filter((e) => e.status === 'resolved').length

  function handleResolve(id: string, relatedType: string) {
    resolveException(id)
    push({
      title: 'Exception resolved',
      body: relatedType === 'request' ? 'The request is back in the intake queue, unassigned.' : 'Marked as resolved.',
      kind: 'exception',
    })
  }

  return (
    <PageInner>
      <PageHead title="Exceptions" desc="Anything that doesn't go to plan stays visible here instead of quietly disappearing from the queue." />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'open', label: 'Open', count: openCount },
          { value: 'resolved', label: 'Resolved', count: resolvedCount },
        ]}
      />

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={tab === 'open' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            title={tab === 'open' ? 'Nothing flagged' : 'No resolved exceptions yet'}
            desc={tab === 'open' ? 'Everything in the system is on track.' : 'Once you resolve something, it will show up here for reference.'}
          />
        </Card>
      ) : (
        <div className={s.excList}>
          {filtered.map((e) => (
            <div key={e.id} className={[s.excCard, e.status === 'open' ? s.open : ''].join(' ')}>
              <span className={s.excIcon}>{e.status === 'open' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}</span>
              <div className={s.excBody}>
                <div className={s.excTop}>
                  <span className={s.excId}>{e.id}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>{TYPE_LABEL[e.type]}</span>
                  <span className={s.excId}>
                    · {e.relatedType} {e.relatedId}
                  </span>
                </div>
                <div className={s.excNote}>{e.note}</div>
                <div className={s.excMeta}>
                  <Clock size={10} style={{ display: 'inline', verticalAlign: -1.5, marginRight: 3 }} />
                  Flagged {fmtRelativeTime(e.createdAt, now)}
                  {e.rescheduledDate && ` · rescheduled for ${e.rescheduledDate}`}
                  {e.resolvedAt && ` · resolved ${fmtRelativeTime(e.resolvedAt, now)}`}
                </div>
              </div>
              {e.status === 'open' && (
                <div className={s.excActions}>
                  <Button size="sm" variant="secondary" onClick={() => handleResolve(e.id, e.relatedType)}>
                    Resolve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageInner>
  )
}
