import s from '../App.module.css'
import { PhoneFrame, BrowserFrame } from './ui/DeviceFrame'
import { PersonaSwitcher } from './PersonaSwitcher'
import { FarmerApp } from '../roles/farmer/FarmerApp'
import { DriverApp } from '../roles/driver/DriverApp'
import { StaffApp } from '../roles/staff/StaffApp'
import { useTallawahStore } from '../store/useStore'
import { Leaf, Truck, Grid } from './icons'
import type { Theme } from '../lib/useTheme'
import type { CSSProperties } from 'react'

const TONE = {
  green: { ['--tint' as string]: 'var(--green-soft)', ['--tintColor' as string]: 'var(--green-ink)' },
  gold: { ['--tint' as string]: 'var(--gold-soft)', ['--tintColor' as string]: 'var(--gold-ink)' },
  earth: { ['--tint' as string]: 'var(--earth-soft)', ['--tintColor' as string]: 'var(--earth)' },
} satisfies Record<string, CSSProperties>

export function PresentView({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const farmers = useTallawahStore((st) => st.farmers)
  const drivers = useTallawahStore((st) => st.drivers)
  const vehicles = useTallawahStore((st) => st.vehicles)
  const activeFarmerId = useTallawahStore((st) => st.activeFarmerId)
  const activeDriverId = useTallawahStore((st) => st.activeDriverId)
  const setActiveFarmerId = useTallawahStore((st) => st.setActiveFarmerId)
  const setActiveDriverId = useTallawahStore((st) => st.setActiveDriverId)

  return (
    <div className={s.present}>
      <div className={s.panel}>
        <div className={s.panelHead}>
          <span className={s.panelTag} style={TONE.green}>
            <span className={s.panelTagIcon}>
              <Leaf size={12} />
            </span>
            Farmer · WhatsApp
          </span>
          <PersonaSwitcher
            activeId={activeFarmerId}
            onSelect={setActiveFarmerId}
            options={farmers.map((f) => ({ id: f.id, name: f.name, meta: f.community, initials: f.initials, hue: f.avatarHue }))}
          />
        </div>
        <div className={s.panelStage} style={{ justifyContent: 'center' }}>
          <PhoneFrame dark={theme === 'dark'}>
            <FarmerApp farmerId={activeFarmerId} theme={theme} />
          </PhoneFrame>
        </div>
      </div>

      <div className={s.panel}>
        <div className={s.panelHead}>
          <span className={s.panelTag} style={TONE.gold}>
            <span className={s.panelTagIcon}>
              <Grid size={12} />
            </span>
            Staff · Ops dashboard
          </span>
        </div>
        <div className={s.panelStage}>
          <BrowserFrame url="ops.tallawahfoods.com/dashboard">
            <StaffApp theme={theme} onToggleTheme={onToggleTheme} />
          </BrowserFrame>
        </div>
      </div>

      <div className={s.panel}>
        <div className={s.panelHead}>
          <span className={s.panelTag} style={TONE.earth}>
            <span className={s.panelTagIcon}>
              <Truck size={12} />
            </span>
            Driver · Field app
          </span>
          <PersonaSwitcher
            activeId={activeDriverId}
            onSelect={setActiveDriverId}
            options={drivers.map((d) => ({ id: d.id, name: d.name, meta: vehicles.find((v) => v.id === d.vehicleId)?.plate ?? '', initials: d.initials, hue: d.avatarHue }))}
          />
        </div>
        <div className={s.panelStage} style={{ justifyContent: 'center' }}>
          <PhoneFrame dark={theme === 'dark'}>
            <DriverApp driverId={activeDriverId} />
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
