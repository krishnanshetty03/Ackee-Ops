import ps from '../PhoneRolePage.module.css'
import { PhoneFrame } from '../../components/ui/DeviceFrame'
import { DriverApp } from './DriverApp'
import { PersonaSwitcher } from '../../components/PersonaSwitcher'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTallawahStore } from '../../store/useStore'
import type { Theme } from '../../lib/useTheme'
import { Truck } from '../../components/icons'

export function DriverView({ theme, onToggleTheme, onSignOut }: { theme: Theme; onToggleTheme: () => void; onSignOut?: () => void }) {
  const drivers = useTallawahStore((st) => st.drivers)
  const vehicles = useTallawahStore((st) => st.vehicles)
  const activeDriverId = useTallawahStore((st) => st.activeDriverId)
  const setActiveDriverId = useTallawahStore((st) => st.setActiveDriverId)

  return (
    <div className={ps.page}>
      <div className={ps.topBar}>
        <div className={ps.topBarLeft}>
          <span className={ps.roleTag}>
            <span className={ps.roleTagIcon}>
              <Truck size={16} />
            </span>
            Driver app
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <PersonaSwitcher
            label="Signed in as"
            activeId={activeDriverId}
            onSelect={setActiveDriverId}
            options={drivers.map((dr) => ({
              id: dr.id,
              name: dr.name,
              meta: vehicles.find((v) => v.id === dr.vehicleId)?.plate ?? '',
              initials: dr.initials,
              hue: dr.avatarHue,
            }))}
          />
        </div>
      </div>
      <div className={ps.stageArea}>
        <div className={ps.phoneShadowFloor} style={{ width: 'min(392px, 88vw)' }}>
          <PhoneFrame dark={theme === 'dark'}>
            <DriverApp driverId={activeDriverId} onSignOut={onSignOut} />
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
