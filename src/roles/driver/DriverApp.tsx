import d from './driver.module.css'
import { useTallawahStore } from '../../store/useStore'
import { selectUnreadDriverNotifications } from '../../store/selectors'
import { Bell, Home, ListChecks, Truck, User } from '../../components/icons'
import { DriverHome } from './DriverHome'
import { DriverRoute } from './DriverRoute'
import { DriverHistory } from './DriverHistory'
import { DriverProfile } from './DriverProfile'
import type { DriverTab } from '../../lib/types'
import type { Theme } from '../../lib/useTheme'

const NAV: { tab: DriverTab; label: string; icon: (p: { size?: number }) => JSX.Element }[] = [
  { tab: 'home', label: 'Home', icon: Home },
  { tab: 'route', label: 'Route', icon: Truck },
  { tab: 'history', label: 'History', icon: ListChecks },
  { tab: 'profile', label: 'Profile', icon: User },
]

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DriverApp({ driverId, onSignOut, theme }: { driverId: string; onSignOut?: () => void; theme: Theme }) {
  const driver = useTallawahStore((st) => st.drivers.find((d2) => d2.id === driverId))!
  const vehicle = useTallawahStore((st) => st.vehicles.find((v) => v.id === driver.vehicleId))
  const driverTab = useTallawahStore((st) => st.driverTab)
  const setDriverTab = useTallawahStore((st) => st.setDriverTab)
  const unread = useTallawahStore((st) => selectUnreadDriverNotifications(st, driverId))
  const now = useTallawahStore((st) => st.now)

  const firstName = driver.name.split(' ')[0]

  return (
    <div className={d.screen}>
      <div className={d.header}>
        <div className={d.headerTop}>
          <div className={d.greeting}>
            <span className={d.greetingHi}>{greetingFor(new Date(now).getHours())}</span>
            <span className={d.greetingName}>{firstName}</span>
          </div>
          <div className={d.headerRight}>
            <button className={d.bellBtn} aria-label="Notifications">
              <Bell size={16} />
              {unread > 0 && <span className={d.bellDot} />}
            </button>
          </div>
        </div>
        <div className={d.vehicleChip}>
          <span className={[d.vehicleChipDot, driver.status === 'on_route' ? d.busy : ''].join(' ')} />
          {vehicle?.plate} · {vehicle?.model}
        </div>
      </div>

      <div className={d.body}>
        {driverTab === 'home' && <DriverHome driverId={driverId} theme={theme} />}
        {driverTab === 'route' && <DriverRoute driverId={driverId} theme={theme} />}
        {driverTab === 'history' && <DriverHistory driverId={driverId} />}
        {driverTab === 'profile' && <DriverProfile driverId={driverId} onSignOut={onSignOut} />}
      </div>

      <div className={d.bottomNav}>
        {NAV.map(({ tab, label, icon: Icon }) => (
          <button key={tab} className={[d.navBtn, tab === driverTab ? d.active : ''].join(' ')} onClick={() => setDriverTab(tab)}>
            <Icon size={19} />
            <span className={d.navBtnLabel}>{label}</span>
            {tab === 'home' && unread > 0 && <span className={d.navDot} />}
          </button>
        ))}
      </div>
    </div>
  )
}
