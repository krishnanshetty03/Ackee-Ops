import { Fragment } from 'react'
import t from './DeliveryTracker.module.css'
import { Avatar } from '../../../components/ui/Avatar'
import { Navigation, Phone, Send } from '../../../components/icons'
import { fmtBags } from '../../../lib/format'
import type { Driver, Shipment, Vehicle } from '../../../lib/types'

/** A live "where's my order" style tracker for the shipment currently focused
 * on the map — driver card, ETA to the next stop, and a stage stepper whose
 * current segment fills in real time with the shipment's own leg progress. */
export function DeliveryTracker({ shipment, driver, vehicle }: { shipment: Shipment; driver?: Driver; vehicle?: Vehicle }) {
  const headingHome = shipment.legIndex >= shipment.stops.length
  const currentStop = headingHome ? null : shipment.stops[shipment.legIndex]
  const remainingSec = Math.max(0, Math.round((shipment.legDurationMs * (1 - shipment.legProgress)) / 1000))
  const arrived = shipment.legProgress >= 0.97 && shipment.status === 'active'

  const etaLabel = headingHome
    ? arrived
      ? 'Pulling into the depot now'
      : `Heading to the depot`
    : arrived
      ? `Arrived at ${currentStop?.farmerName}'s farm`
      : `Next stop — ${currentStop?.farmerName}`

  const doneStops = shipment.stops.filter((s) => s.status === 'completed').length
  const collected = shipment.stops.reduce((sum, s) => sum + (s.actualBags ?? 0), 0)
  const totalEst = shipment.stops.reduce((sum, s) => sum + s.estimatedBags, 0)

  // stepper: [depot-start, ...stops, depot-end] with (stops.length + 1) connecting segments
  const segments = shipment.stops.length + 1
  const dotState = (i: number): 'done' | 'current' | 'pending' => {
    if (i === 0) return 'done' // already left the depot
    if (i === segments) return shipment.status !== 'active' ? 'done' : headingHome ? 'current' : 'pending'
    const stop = shipment.stops[i - 1]
    if (stop.status === 'completed') return 'done'
    if (shipment.legIndex === i - 1) return 'current'
    return 'pending'
  }
  const segFill = (i: number) => (i < shipment.legIndex ? 1 : i === shipment.legIndex ? shipment.legProgress : 0)

  return (
    <div className={t.card}>
      <div className={t.top}>
        <span className={t.avatarWrap}>
          <Avatar initials={driver?.initials ?? '—'} hue={driver?.avatarHue ?? 40} size="md" />
          {shipment.status === 'active' && !arrived && <span className={t.liveDot} />}
        </span>
        <div>
          <div className={t.name}>{driver?.name}</div>
          <div className={t.meta}>
            {vehicle?.plate} · {shipment.id}
          </div>
        </div>
        <div className={t.actions}>
          <button className={t.actionBtn} title={driver?.phone}>
            <Phone size={13} />
          </button>
          <button className={t.actionBtn} title="Message driver">
            <Send size={13} />
          </button>
        </div>
      </div>

      <div className={t.etaBanner}>
        <span className={t.etaIcon}>
          <Navigation size={14} />
        </span>
        <div className={t.etaText}>
          <div className={t.etaValue}>{arrived ? 'Arrived' : `~${remainingSec}s away`}</div>
          <div className={t.etaLabel}>{etaLabel}</div>
        </div>
      </div>

      <div>
        <div className={t.stepper}>
          {Array.from({ length: segments + 1 }).map((_, i) => (
            <Fragment key={i}>
              <span className={[t.stepDot, t[dotState(i)] ?? ''].join(' ')} />
              {i < segments && (
                <span className={t.stepSeg}>
                  <span className={t.stepSegFill} style={{ transform: `scaleX(${segFill(i)})` }} />
                </span>
              )}
            </Fragment>
          ))}
        </div>
        <div className={t.stepLabels}>
          <span>Depot</span>
          <span>Depot</span>
        </div>
      </div>

      <div className={t.statRow}>
        <span>
          <b>{doneStops}</b>/{shipment.stops.length} stops
        </span>
        <span>
          <b>{collected}</b> / {totalEst} bags
        </span>
      </div>
    </div>
  )
}
