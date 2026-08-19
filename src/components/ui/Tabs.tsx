import s from './Tabs.module.css'

export interface TabOption<T extends string> {
  value: T
  label: string
  count?: number
}

export function Tabs<T extends string>({ options, value, onChange }: { options: TabOption<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className={s.tabs} role="tablist">
      {options.map((opt) => (
        <button key={opt.value} role="tab" aria-selected={opt.value === value} className={[s.tab, opt.value === value ? s.active : ''].join(' ')} onClick={() => onChange(opt.value)}>
          {opt.label}
          {opt.count !== undefined && <span className={s.count}>{opt.count}</span>}
        </button>
      ))}
    </div>
  )
}
