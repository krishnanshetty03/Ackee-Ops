import { useEffect, useState } from 'react'
import s from '../staff.module.css'
import { PageHead, PageInner } from '../StaffShell'
import { useTallawahStore } from '../../../store/useStore'
import { TrackingMap } from '../../../components/map/TrackingMap'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DeliveryTracker } from './DeliveryTracker'
import { Navigation, Truck } from '../../../components/icons'
import type { Theme } from '../../../lib/useTheme'
import { fmtBags } from '../../../lib/format'

export function Tracking({ theme }: { theme: Theme }) {
  const shipments = useTallawahStore((st) => st.shipments)
  const drivers = useTallawahStore((st) => st.drivers)
  const vehicles = useTallawahStore((st) => st.vehicles)
  const focusShipmentId = useTallawahStore((st) => st.focusShipmentId)
  const setFocusShipment = useTallawahStore((st) => st.setFocusShipment)
  const [follow, setFollow] = useState(true)

  const live = shipments.filter((sh) => sh.status === 'active' || sh.status === 'arrived_factory').sort((a, b) => b.startedAt - a.startedAt)

  // keep a shipment focused whenever one is out, so the live tracker always has something to show
  useEffect(() => {
    if (live.length === 0) return
    if (!focusShipmentId || !live.some((sh) => sh.id === focusShipmentId)) {
      setFocusShipment(live[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.length, focusShipmentId])

  const focused = live.find((sh) => sh.id === focusShipmentId)
  const focusedDriver = focused ? drivers.find((d) => d.id === focused.driverId) : undefined
  const focusedVehicle = focused ? vehicles.find((v) => v.id === focused.vehicleId) : undefined
  const others = live.filter((sh) => sh.id !== focused?.id)

  return (
    <PageInner>
      <PageHead title="In-Transit Tracking" desc="Live-enough visibility into where each vehicle is and what it's collected while the route runs." />

      <div className={s.trackingLayout}>
        <div className={s.mapCard}>
          <TrackingMap shipments={shipments} drivers={drivers} theme={theme} focusShipmentId={focusShipmentId} onSelectShipment={setFocusShipment} follow={follow} />
          <div className={s.legend}>
            <span className={s.legendItem}>
              <span className={s.legendSwatch} style={{ background: 'var(--brand-black)' }} />
              Depot
            </span>
            <span className={s.legendItem}>
              <span className={s.legendSwatch} style={{ background: 'var(--surface-3)', border: '1px solid var(--border-strong)' }} />
              Pending stop
            </span>
            <span className={s.legendItem}>
              <span className={s.legendSwatch} style={{ background: 'var(--gold-fill)' }} />
              Arrived
            </span>
            <span className={s.legendItem}>
              <span className={s.legendSwatch} style={{ background: 'var(--green)' }} />
              Collected
            </span>
          </div>
          {focused && (
            <button
              className={[s.followBtn, follow ? s.on : ''].join(' ')}
              onClick={() => setFollow((v) => !v)}
              title={follow ? 'Following the tracked vehicle' : 'Camera is free — click to follow'}
            >
              <Navigation size={13} />
              {follow ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className={s.shipmentList}>
          {live.length === 0 ? (
            <EmptyState icon={<Truck size={20} />} title="No vehicles out" desc="Dispatch a route to see it move here in real time." />
          ) : (
            <>
              {focused && <DeliveryTracker shipment={focused} driver={focusedDriver} vehicle={focusedVehicle} />}

              {others.length > 0 && (
                <>
                  <div className={s.otherVehiclesLabel}>Other vehicles</div>
                  {others.map((sh) => {
                    const driver = drivers.find((d) => d.id === sh.driverId)
                    const vehicle = vehicles.find((v) => v.id === sh.vehicleId)
                    const done = sh.stops.filter((st) => st.status === 'completed').length
                    const collected = sh.stops.reduce((sum, st) => sum + (st.actualBags ?? 0), 0)
                    const totalEst = sh.stops.reduce((sum, st) => sum + st.estimatedBags, 0)
                    return (
                      <button key={sh.id} className={s.shipmentCard} onClick={() => setFocusShipment(sh.id)}>
                        <div className={s.shipmentTop}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: `linear-gradient(155deg, hsl(${driver?.avatarHue ?? 40} 62% 60%), hsl(${driver?.avatarHue ?? 40} 58% 42%))`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              flex: 'none',
                            }}
                          >
                            <Truck size={14} />
                          </div>
                          <div className={s.shipmentText}>
                            <div className={s.shipmentName}>{driver?.name}</div>
                            <div className={s.shipmentMeta}>
                              {vehicle?.plate} · {sh.id}
                            </div>
                          </div>
                        </div>

                        {sh.status === 'arrived_factory' ? (
                          <div className={s.shipmentMeta} style={{ color: 'var(--earth)', fontWeight: 700 }}>
                            Back at depot — awaiting receiving
                          </div>
                        ) : (
                          <>
                            <div className={s.stopTrack}>
                              {sh.stops.map((stop, i) => (
                                <span key={stop.requestId} className={[s.stopDot, stop.status === 'completed' ? s.done : i === sh.legIndex ? s.current : ''].join(' ')} />
                              ))}
                            </div>
                            <div className={s.shipmentFoot}>
                              <span>
                                {done}/{sh.stops.length} stops
                              </span>
                              <span className="mono" style={{ fontFamily: 'var(--font-mono)' }}>
                                {fmtBags(collected)} / {totalEst}
                              </span>
                            </div>
                          </>
                        )}
                      </button>
                    )
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </PageInner>
  )
}
