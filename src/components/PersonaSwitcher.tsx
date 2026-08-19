import { useState } from 'react'
import s from './PersonaSwitcher.module.css'
import { Avatar } from './ui/Avatar'
import { ChevronDown } from './icons'

export interface PersonaOption {
  id: string
  name: string
  meta: string
  initials: string
  hue: number
}

export function PersonaSwitcher({
  label,
  options,
  activeId,
  onSelect,
}: {
  label?: string
  options: PersonaOption[]
  activeId: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const active = options.find((o) => o.id === activeId) ?? options[0]

  return (
    <div className={s.wrap}>
      <button className={s.trigger} onClick={() => setOpen((v) => !v)}>
        <Avatar initials={active.initials} hue={active.hue} size="sm" />
        <span className={s.triggerText}>
          {label && <span className={s.triggerLabel}>{label}</span>}
          <span className={s.triggerName}>{active.name}</span>
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className={s.overlay} onClick={() => setOpen(false)} />
          <div className={s.menu}>
            <div className={s.menuLabel}>Simulate as</div>
            {options.map((opt) => (
              <button
                key={opt.id}
                className={[s.item, opt.id === activeId ? s.active : ''].join(' ')}
                onClick={() => {
                  onSelect(opt.id)
                  setOpen(false)
                }}
              >
                <Avatar initials={opt.initials} hue={opt.hue} size="sm" />
                <span className={s.itemText}>
                  <span className={s.itemName}>{opt.name}</span>
                  <span className={s.itemMeta}>{opt.meta}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
