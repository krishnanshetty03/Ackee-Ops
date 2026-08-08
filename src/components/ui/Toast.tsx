import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import s from './Toast.module.css'
import { Bell, CheckCircle, AlertTriangle, Truck, Package } from '../icons'

type ToastKind = 'request' | 'route' | 'shipment' | 'exception' | 'receiving' | 'generic'
export interface ToastItem {
  id: string
  title: string
  body?: string
  kind?: ToastKind
  onClick?: () => void
}
type Position = 'topRight' | 'bottomRight' | 'topCenter'

interface Ctx {
  push: (t: Omit<ToastItem, 'id'>) => void
}

const ToastCtx = createContext<Ctx | null>(null)

function iconFor(kind?: ToastKind) {
  switch (kind) {
    case 'request':
      return { icon: <Bell size={14} />, tone: '' }
    case 'route':
      return { icon: <Truck size={14} />, tone: '' }
    case 'shipment':
      return { icon: <Truck size={14} />, tone: 'green' }
    case 'exception':
      return { icon: <AlertTriangle size={14} />, tone: 'red' }
    case 'receiving':
      return { icon: <Package size={14} />, tone: 'green' }
    default:
      return { icon: <CheckCircle size={14} />, tone: 'green' }
  }
}

export function ToastProvider({ children, position = 'topRight' }: { children: ReactNode; position?: Position }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    seq.current += 1
    const id = `toast-${seq.current}`
    setItems((prev) => [...prev, { ...t, id }].slice(-4))
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 5200)
  }, [])

  const dismiss = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id))

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className={[s.viewport, s[position]].join(' ')}>
        {items.map((t) => {
          const { icon, tone } = iconFor(t.kind)
          return (
            <div
              key={t.id}
              className={s.toast}
              onClick={() => {
                t.onClick?.()
                dismiss(t.id)
              }}
            >
              <span className={[s.iconWrap, tone ? s[tone as 'green' | 'red'] : ''].join(' ')}>{icon}</span>
              <div className={s.body}>
                <div className={s.title}>{t.title}</div>
                {t.body && <div className={s.desc}>{t.body}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
