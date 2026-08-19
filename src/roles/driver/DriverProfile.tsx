import d from './driver.module.css'
import { useTallawahStore } from '../../store/useStore'
import { selectDriverHistory } from '../../store/selectors'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { LogOut, Star } from '../../components/icons'
import { fmtBags } from '../../lib/format'

export function DriverProfile({ driverId, onSignOut }: { driverId: string; onSignOut?: () => void }) {
  const driver = useTallawahStore((st) => st.drivers.find((d2) => d2.id === driverId))!
  const vehicle = useTallawahStore((st) => st.vehicles.find((v) => v.id === driver.vehicleId))
  const history = useTallawahStore((st) => selectDriverHistory(st, driverId))
  const toggleAvailability = useTallawahStore((st) => st.toggleDriverAvailability)

  const totalBags = history.reduce((sum, sh) => sum + sh.stops.reduce((a, st) => a + (st.actualBags ?? 0), 0), 0)
  const onRoute = driver.status === 'on_route'

  return (
    <>
      <div className={d.profileHead}>
        <Avatar initials={driver.initials} hue={driver.avatarHue} size="xl" />
        <div className={d.profileName}>{driver.name}</div>
        <div className={d.profileMeta}>{driver.phone}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Star size={12} style={{ color: 'var(--gold-fill)' }} />
          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{history.length} shipments completed</span>
        </div>
      </div>

      <div>
        <div className={d.sectionLabel}>Availability</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '12px 15px' }}>
          <div>
            <div style={{ fontSize: 12.8, fontWeight: 700 }}>{onRoute ? 'Out on a route' : driver.status === 'available' ? 'Available' : 'Off duty'}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{onRoute ? "Can't change status mid-route" : 'Tap to toggle'}</div>
          </div>
          <div className={d.statusSwitch}>
            <button className={[d.statusOpt, driver.status === 'available' ? d.on : ''].join(' ')} disabled={onRoute} onClick={() => driver.status !== 'available' && toggleAvailability(driverId)}>
              On
            </button>
            <button className={[d.statusOpt, driver.status === 'off_duty' ? d.off : ''].join(' ')} disabled={onRoute} onClick={() => driver.status !== 'off_duty' && toggleAvailability(driverId)}>
              Off
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className={d.sectionLabel}>Lifetime</div>
        <div className={d.statRow} style={{ marginTop: 8 }}>
          <div className={d.statTile}>
            <span className={d.statValue}>{history.length}</span>
            <span className={d.statLabel}>Shipments</span>
          </div>
          <div className={d.statTile}>
            <span className={d.statValue}>{totalBags}</span>
            <span className={d.statLabel}>Bags</span>
          </div>
        </div>
      </div>

      <div>
        <div className={d.sectionLabel}>Vehicle</div>
        <div className={d.profileList} style={{ marginTop: 8 }}>
          <div className={d.profileRow}>
            <span className={d.profileRowLabel}>Plate</span>
            <span className={d.profileRowValue}>{vehicle?.plate}</span>
          </div>
          <div className={d.profileRow}>
            <span className={d.profileRowLabel}>Model</span>
            <span className={d.profileRowValue}>{vehicle?.model}</span>
          </div>
          <div className={d.profileRow}>
            <span className={d.profileRowLabel}>Capacity</span>
            <span className={d.profileRowValue}>{fmtBags(vehicle?.capacityBags ?? 0)}</span>
          </div>
        </div>
      </div>

      {onSignOut && (
        <Button variant="ghost" block icon={<LogOut size={14} />} onClick={onSignOut} style={{ color: 'var(--red-ink)' }}>
          Sign out
        </Button>
      )}
    </>
  )
}
