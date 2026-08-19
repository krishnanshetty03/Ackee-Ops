import type { ButtonHTMLAttributes, ReactNode } from 'react'
import s from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  iconOnly?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', block, iconOnly, icon, iconRight, className, children, ...rest }: Props) {
  const cls = [s.btn, s[variant], size === 'sm' ? s.sm : size === 'lg' ? s.lg : '', block ? s.block : '', iconOnly ? s.iconOnly : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  )
}
