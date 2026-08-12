import { useEffect, useState } from 'react'
import d from './driver.module.css'
import { useTallawahStore } from '../../store/useStore'
import { selectDriverActiveShipment, selectDriverPendingRoute } from '../../store/selectors'
import { Button } from '../../components/ui/Button'
import { CapacityMeter } from '../../components/ui/CapacityMeter'
import { NumberStepper, RadioCards } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/EmptyState'
import { MiniMap } from '../../components/map/MiniMap'
import { useToast } from '../../components/ui/Toast'
import { Check, CheckCircle, Factory, MapPin, Navigation, Route as RouteIcon, Truck, X } from '../../components/icons'
import { fmtBags } from '../../lib/format'
import type { QualityResult } from '../../lib/types'
import type { Theme } from '../../lib/useTheme'

function navigateTo(lat: number, lng: number) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener,noreferrer')
}

export function DriverRoute({ driverId, theme }: { driverId: string; theme: Theme }) {
  const requests = useTallawahStore((st) => st.requests)
  const pendingRoute = useTallawahStore((st) => selectDriverPendingRoute(st, driverId))
  const activeShipment = useTallawahStore((st) => selectDriverActiveShipment(st, driverId))
  const driverStartRoute = useTallawahStore((st) => st.driverStartRoute)
  const driverMarkStopArrived = useTallawahStore((st) => st.driverMarkStopArrived)
  const driverConfirmPickup = useTallawahStore((st) => st.driverConfirmPickup)
  const driverArriveFactory = useTallawahStore((st) => st.driverArriveFactory)
  const { push } = useToast()

  const [drafts, setDrafts] = useState<Record<string, number>>({})
  const [packagingDrafts, setPackagingDrafts] = useState<Record<string, 'open' | 'unopened'>>({})
  const [qualityDrafts, setQualityDrafts] = useState<Record<string, QualityResult>>({})

  useEffect(() => {
    if (!activeShipment) return
    setDrafts((prev) => {
      const next = { ...prev }
      activeShipment.stops.forEach((stop) => {
        if (stop.status === 'arrived' && next[stop.requestId] === undefined) next[stop.requestId] = stop.estimatedBags
      })
      return next
    })
  }, [activeShipment])

  if (!pendingRoute && !activeShipment) {
    return <EmptyState icon={<RouteIcon size={22} />} title="No active route" desc="Once dispatch assigns you a route, it will open here." />
  }

  // ---- pending: not started yet ----
  if (pendingRoute && !activeShipment) {
    const stops = requests.filter((r) => pendingRoute.requestIds.includes(r.id))
    return (
      <>
        <div className={d.routeSummary}>
          <div className={d.routeSummaryTop}>
            <span className={d.routeSummaryTitle}>{pendingRoute.id}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-ink)' }}>{fmtBags(pendingRoute.totalEstimatedBags)}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{stops.length} stops · starts from the Kumasi depot</div>
        </div>

        <div className={d.sectionLabel}>Stops in order</div>
        <div className={d.stopList}>
          {stops.map((r, i) => (
            <div key={r.id} className={d.stopCard}>
              <span className={d.stopBadge}>{i + 1}</span>
              <div className={d.stopBody}>
                <span className={d.stopName}>{r.farmerName}</span>
                <span className={d.stopMeta}>
                  <MapPin size={12} /> {r.location.community} · {fmtBags(r.estimatedBags)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={d.ctaFooter}>
          <Button
            variant="primary"
            block
            size="lg"
            icon={<Navigation size={16} />}
            onClick={() => {
              driverStartRoute(pendingRoute.id)
              push({ title: 'Route started', body: 'Drive safe — tap each stop as you go.', kind: 'route' })
            }}
          >
            Start route
          </Button>
        </div>
      </>
    )
  }

  if (!activeShipment) return null

  // ---- arrived at factory: recap, read-only ----
  if (activeShipment.status === 'arrived_factory') {
    return (
      <>
        <div className={[d.banner, d.active].join(' ')}>
          <span className={d.bannerLabel}>
            <Factory size={13} /> Back at the depot
          </span>
          <span className={d.bannerTitle}>All {activeShipment.stops.length} stops complete</span>
          <span className={d.bannerDesc}>Waiting on the receiving desk to check your load in.</span>
        </div>
        <div className={d.stopList}>
          {activeShipment.stops.map((stop, i) => (
            <div key={stop.requestId} className={[d.stopCard, d.doneStop].join(' ')}>
              <span className={[d.stopBadge, d.done].join(' ')}>
                <Check size={14} />
              </span>
              <div className={d.stopBody}>
                <span className={d.stopName}>{stop.farmerName}</span>
                <span className={d.stopMeta}>
                  <MapPin size={12} /> {stop.location.community} · collected {stop.actualBags} bags
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  // ---- active: en route ----
  const headingHome = activeShipment.legIndex >= activeShipment.stops.length
  const doneCount = activeShipment.stops.filter((s) => s.status === 'completed').length
  const pct = (doneCount / activeShipment.stops.length) * 100
  const nearlyThere = activeShipment.legProgress >= 0.82
  const bagsCollected = activeShipment.stops.reduce((sum, st) => sum + (st.actualBags ?? 0), 0)
  const totalEstimatedBags = activeShipment.stops.reduce((sum, st) => sum + st.estimatedBags, 0)

  return (
    <>
      <div className={d.routeSummary}>
        <div className={d.routeSummaryTop}>
          <span className={d.routeSummaryTitle}>{activeShipment.id}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-ink)' }}>
            {doneCount}/{activeShipment.stops.length} done
          </span>
        </div>
        <div className={d.progressTrack}>
          <div className={d.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <div style={{ marginTop: 13 }}>
          <CapacityMeter value={bagsCollected} ceiling={totalEstimatedBags} label="Bags collected" />
        </div>
      </div>

      {headingHome ? (
        <div className={d.stopCard} style={{ borderColor: 'var(--gold)', boxShadow: '0 0 0 3px var(--gold-soft)' }}>
          <span className={[d.stopBadge, d.current].join(' ')}>
            <Factory size={14} />
          </span>
          <div className={d.stopBody}>
            <span className={d.stopName}>Head back to the depot</span>
            <span className={d.stopMeta}>{nearlyThere ? 'Pulling in now' : 'On the way…'}</span>
            <div className={d.stopActions}>
              <Button
                variant="primary"
                size="sm"
                disabled={!nearlyThere}
                icon={<Factory size={13} />}
                onClick={() => {
                  driverArriveFactory(activeShipment.id)
                  push({ title: 'Arrived at depot', body: 'Staff can now receive this shipment.', kind: 'shipment' })
                }}
              >
                {nearlyThere ? 'Mark arrived at depot' : 'Approaching depot…'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={d.stopList}>
          {activeShipment.stops.map((stop, i) => {
            const isCurrent = i === activeShipment.legIndex
            const isDone = stop.status === 'completed'
            return (
              <div key={stop.requestId} className={[d.stopCard, isCurrent ? d.currentStop : '', isDone ? d.doneStop : ''].join(' ')}>
                <span className={[d.stopBadge, isDone ? d.done : isCurrent ? d.current : ''].join(' ')}>{isDone ? <Check size={14} /> : i + 1}</span>
                <div className={d.stopBody}>
                  <span className={d.stopName}>{stop.farmerName}</span>
                  <span className={d.stopMeta}>
                    <MapPin size={12} /> {stop.location.community} · est. {fmtBags(stop.estimatedBags)}
                  </span>

                  {isCurrent && stop.status === 'pending' && (
                    <>
                      <div className={d.stopMapWrap}>
                        <MiniMap point={stop.location} theme={theme} height={110} hue={40} />
                      </div>
                      <div className={d.stopActions}>
                        <Button variant="primary" size="sm" disabled={!nearlyThere} icon={<Truck size={13} />} onClick={() => driverMarkStopArrived(activeShipment.id, stop.requestId)}>
                          {nearlyThere ? 'Arrived' : 'On the way…'}
                        </Button>
                        <Button variant="ghost" size="sm" icon={<Navigation size={13} />} onClick={() => navigateTo(stop.location.lat, stop.location.lng)}>
                          Navigate
                        </Button>
                      </div>
                    </>
                  )}

                  {isCurrent && stop.status === 'arrived' && (
                    <>
                      <div className={d.bagEntry}>
                        <span className={d.bagEntryLabel}>Bags collected</span>
                        <NumberStepper
                          value={drafts[stop.requestId] ?? stop.estimatedBags}
                          onChange={(v) => setDrafts((prev) => ({ ...prev, [stop.requestId]: v }))}
                          min={0}
                          max={200}
                        />
                      </div>

                      <div className={d.assessBlock}>
                        <span className={d.bagEntryLabel}>Packaging</span>
                        <RadioCards
                          value={packagingDrafts[stop.requestId] ?? 'unopened'}
                          onChange={(v) => setPackagingDrafts((prev) => ({ ...prev, [stop.requestId]: v }))}
                          options={[
                            { value: 'unopened', title: 'Unopened' },
                            { value: 'open', title: 'Open' },
                          ]}
                        />
                      </div>

                      <div className={d.assessBlock}>
                        <span className={d.bagEntryLabel}>Quality check</span>
                        <RadioCards
                          value={qualityDrafts[stop.requestId] ?? 'pass'}
                          onChange={(v) => setQualityDrafts((prev) => ({ ...prev, [stop.requestId]: v }))}
                          options={[
                            { value: 'pass', title: 'Pass', icon: <Check size={13} />, tone: 'green' },
                            { value: 'fail', title: 'Fail', icon: <X size={13} />, tone: 'red' },
                          ]}
                        />
                      </div>

                      <div className={d.stopActions}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CheckCircle size={13} />}
                          onClick={() =>
                            driverConfirmPickup(
                              activeShipment.id,
                              stop.requestId,
                              drafts[stop.requestId] ?? stop.estimatedBags,
                              qualityDrafts[stop.requestId] ?? 'pass',
                              packagingDrafts[stop.requestId] ?? 'unopened',
                            )
                          }
                        >
                          Confirm pickup
                        </Button>
                      </div>
                    </>
                  )}

                  {isDone && <span className={d.stopMeta}>Collected {stop.actualBags} bags</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
