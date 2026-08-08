import type { HTMLAttributes, ReactNode } from 'react'
import s from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  hoverable?: boolean
}

export function Card({ padded, hoverable, className, children, ...rest }: CardProps) {
  const cls = [s.card, padded ? s.padded : '', hoverable ? s.hoverable : '', className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className={s.header}>
      <div>
        <div className={s.title}>{title}</div>
        {subtitle && <div className={s.subtitle}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
