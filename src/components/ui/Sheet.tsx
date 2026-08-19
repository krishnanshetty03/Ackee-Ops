import type { ReactNode } from 'react'
import { useEffect } from 'react'
import s from './Sheet.module.css'
import { X } from '../icons'
import { Button } from './Button'

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.panel} role="dialog" aria-modal="true">
        <div className={s.header}>
          <div>
            <div className={s.title}>{title}</div>
            {subtitle && <div className={s.subtitle}>{subtitle}</div>}
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className={s.content}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className={s.dialogOverlay} onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={s.dialog} role="alertdialog" aria-modal="true">
        <div className={s.dialogTitle}>{title}</div>
        <div className={s.dialogBody}>{body}</div>
        <div className={s.dialogActions}>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
