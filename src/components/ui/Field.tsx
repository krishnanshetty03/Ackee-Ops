import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import s from './Field.module.css'
import { Check, Minus, Plus } from '../icons'

export function FieldGroup({ label, hint, children }: { label?: string; hint?: string; children: ReactNode }) {
  return (
    <div className={s.group}>
      {label && (
        <div className={s.label}>
          <span>{label}</span>
          {hint && <span className={s.hint}>{hint}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={s.input} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={s.select} {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={s.textarea} {...props} />
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className={s.stepper}>
      <button type="button" className={s.stepperBtn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease">
        <Minus size={14} />
      </button>
      <input
        className={s.stepperValue}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10)
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min)
        }}
      />
      <button type="button" className={s.stepperBtn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase">
        <Plus size={14} />
      </button>
    </div>
  )
}

export function RadioCards<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; title: string; desc?: string; icon?: ReactNode; tone?: 'gold' | 'green' | 'red' }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className={s.radioCards}>
      {options.map((opt) => {
        const selectedCls = opt.tone === 'green' ? s.selectedGreen : opt.tone === 'red' ? s.selectedRed : s.selected
        return (
          <button
            key={opt.value}
            type="button"
            className={[s.radioCard, opt.value === value ? selectedCls : ''].join(' ')}
            onClick={() => onChange(opt.value)}
          >
            <span className={s.radioCardTitle}>
              {opt.icon}
              {opt.title}
            </span>
            {opt.desc && <span className={s.radioCardDesc}>{opt.desc}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <button type="button" className={s.checkboxRow} onClick={() => onChange(!checked)}>
      <span className={[s.checkbox, checked ? s.checked : ''].join(' ')}>{checked && <Check size={12} />}</span>
      {label}
    </button>
  )
}
