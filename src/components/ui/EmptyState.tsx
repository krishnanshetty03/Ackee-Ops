import type { ReactNode } from 'react'
import s from './EmptyState.module.css'

export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className={s.wrap}>
      <div className={s.iconWrap}>{icon}</div>
      <div className={s.title}>{title}</div>
      {desc && <div className={s.desc}>{desc}</div>}
      {action}
    </div>
  )
}
