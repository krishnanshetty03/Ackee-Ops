import type { ReactNode } from 'react'
import s from './Badge.module.css'

type Tone = 'neutral' | 'gold' | 'green' | 'red' | 'earth'

export function Badge({ tone = 'neutral', dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={[s.badge, s[tone]].join(' ')}>
      {dot && <span className={s.dot} />}
      {children}
    </span>
  )
}

const STATUS_TONE: Record<string, Tone> = {
  unassigned: 'neutral',
  assigned: 'gold',
  fulfilled: 'green',
  flagged: 'red',
  planned: 'neutral',
  dispatched: 'gold',
  completed: 'green',
  active: 'gold',
  arrived_factory: 'earth',
  received: 'green',
  pending: 'neutral',
  arrived: 'gold',
  open: 'red',
  resolved: 'green',
  available: 'green',
  on_route: 'gold',
  off_duty: 'neutral',
  pass: 'green',
  fail: 'red',
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? 'neutral'
  return (
    <Badge tone={tone} dot>
      {label ?? status.replace(/_/g, ' ')}
    </Badge>
  )
}
