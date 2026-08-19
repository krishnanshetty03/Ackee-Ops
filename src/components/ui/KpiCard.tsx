import type { CSSProperties, ReactNode } from 'react'
import s from './KpiCard.module.css'

type Tone = 'gold' | 'green' | 'red' | 'earth' | 'neutral'

const TONE_VARS: Record<Tone, CSSProperties> = {
  gold: { ['--accent-bar' as string]: 'var(--gold)', ['--tint' as string]: 'var(--gold-soft)', ['--tintColor' as string]: 'var(--gold-ink)' },
  green: { ['--accent-bar' as string]: 'var(--green)', ['--tint' as string]: 'var(--green-soft)', ['--tintColor' as string]: 'var(--green-ink)' },
  red: { ['--accent-bar' as string]: 'var(--red)', ['--tint' as string]: 'var(--red-soft)', ['--tintColor' as string]: 'var(--red-ink)' },
  earth: { ['--accent-bar' as string]: 'var(--earth)', ['--tint' as string]: 'var(--earth-soft)', ['--tintColor' as string]: 'var(--earth)' },
  neutral: { ['--accent-bar' as string]: 'var(--faint)', ['--tint' as string]: 'var(--surface-3)', ['--tintColor' as string]: 'var(--text-2)' },
}

export function KpiCard({
  icon,
  label,
  value,
  unit,
  sub,
  subTone,
  tone = 'gold',
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  unit?: string
  sub?: ReactNode
  subTone?: 'warn' | 'good'
  tone?: Tone
}) {
  return (
    <div className={s.card} style={TONE_VARS[tone]}>
      <div className={s.top}>
        <div className={s.label}>{label}</div>
        <div className={s.iconWrap}>{icon}</div>
      </div>
      <div className={s.value}>
        {value}
        {unit && <span className={s.valueUnit}>{unit}</span>}
      </div>
      {sub && <div className={[s.sub, subTone ? s[subTone] : ''].join(' ')}>{sub}</div>}
    </div>
  )
}
