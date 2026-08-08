import type { CSSProperties } from 'react'
import s from './Avatar.module.css'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export function Avatar({
  initials,
  hue,
  size = 'md',
  status,
}: {
  initials: string
  hue: number
  size?: Size
  status?: 'online' | 'busy' | 'offline'
}) {
  return (
    <span className={[s.avatar, s[size]].join(' ')} style={{ '--h': hue } as CSSProperties}>
      {initials}
      {status && <span className={[s.statusRing, s[status]].join(' ')} />}
    </span>
  )
}
