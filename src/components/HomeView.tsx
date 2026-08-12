import { useState } from 'react'
import s from '../App.module.css'
import { BarChart, Grid, Leaf, ChevronRight, Truck, RefreshCw } from './icons'
import { ThemeToggle } from './ui/ThemeToggle'
import { ConfirmDialog } from './ui/Sheet'
import type { AppView } from '../lib/types'
import type { Theme } from '../lib/useTheme'
import type { CSSProperties } from 'react'

const TONE = {
  gold: { ['--tint' as string]: 'var(--gold-soft)', ['--tintColor' as string]: 'var(--gold-ink)' },
  green: { ['--tint' as string]: 'var(--green-soft)', ['--tintColor' as string]: 'var(--green-ink)' },
  earth: { ['--tint' as string]: 'var(--earth-soft)', ['--tintColor' as string]: 'var(--earth)' },
  neutral: { ['--tint' as string]: 'var(--surface-3)', ['--tintColor' as string]: 'var(--text)' },
} satisfies Record<string, CSSProperties>

const ROLES = [
  { num: '01', view: 'farmer' as AppView, icon: Leaf, title: 'Farmer', desc: 'WhatsApp channel — bags, pickup or self-drop, farm location.', tone: TONE.green },
  { num: '02', view: 'staff' as AppView, icon: Grid, title: 'Staff', desc: 'Ops dashboard — intake, dispatch, tracking, receiving, exceptions.', tone: TONE.gold },
  { num: '03', view: 'driver' as AppView, icon: Truck, title: 'Driver', desc: 'Field app — today’s route, stop by stop, bags collected.', tone: TONE.earth },
  { num: '04', view: 'md' as AppView, icon: BarChart, title: 'Management', desc: 'Export sales — revenue to goal, pipeline, quota attainment.', tone: TONE.neutral },
]

export function HomeView({
  onNavigate,
  theme,
  onToggleTheme,
  onReset,
}: {
  onNavigate: (v: AppView) => void
  theme: Theme
  onToggleTheme: () => void
  onReset: () => void
}) {
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className={s.home}>
      <div className={s.homeLeft}>
        <div className={s.homeTopRow}>
          <span className={s.homeWordmark}>
            <img src="./logo.png" alt="" width={26} height={26} style={{ objectFit: 'contain' }} />
            Tallawah Ops
          </span>
          <div className={s.homeUtilityRow}>
            <button className={s.homeUtilityBtn} onClick={() => setConfirmReset(true)} title="Reset demo data" aria-label="Reset demo data">
              <RefreshCw size={15} />
            </button>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>

        <h1 className={s.homeHeadline}>
          Farmer to factory, <em>tracked end to end.</em>
        </h1>

        <nav className={s.homeList}>
          {ROLES.map((role) => (
            <button key={role.view} className={s.homeRow} onClick={() => onNavigate(role.view)}>
              <span className={s.homeRowNum}>{role.num}</span>
              <span className={s.homeRowIcon} style={role.tone}>
                <role.icon size={17} />
              </span>
              <span className={s.homeRowText}>
                <span className={s.homeRowTitle}>{role.title}</span>
                <span className={s.homeRowDesc}>{role.desc}</span>
              </span>
              <span className={s.homeRowArrow}>
                <ChevronRight size={18} />
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className={s.homeRight}>
        <span className={s.homeRightKente} />
        <span className={s.homeRightDots} />
        <img src="./logo.png" alt="Tallawah Foods Ghana Ltd" className={s.homeRightLogo} />
        <span className={s.homeRightCaption}>Kumasi Depot · Ashanti Region</span>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        body="This clears every request, route, shipment, and chat back to the starting scenario. Useful right before a fresh run-through."
        confirmLabel="Reset"
        danger
        onConfirm={() => {
          onReset()
          setConfirmReset(false)
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
