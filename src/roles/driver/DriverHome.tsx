import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import d from './driver.module.css'
import { useTallawahStore } from '../../store/useStore'
import { selectDriverActiveShipment, selectDriverHistory, selectDriverPendingRoute, selectDriverPerformanceKpis } from '../../store/selectors'
import { Button } from '../../components/ui/Button'
import { Sparkline } from '../../components/charts/Sparkline'
import { CapacityMeter } from '../../components/ui/CapacityMeter'
import { MiniMap } from '../../components/map/MiniMap'
import { pseudoTrailingSeries } from '../../lib/pseudoSeries'
import { CheckCircle, ChevronRight, Factory, MapPin, Navigation, Sparkles, Truck } from '../../components/icons'
import { fmtBags, todayIso } from '../../lib/format'
import { navigateTo } from '../../lib/nav'
import { FACTORY, haversineKm } from '../../lib/geo'
import { VEHICLE_CAPACITY } from '../../lib/types'
import type { GeoPoint } from '../../lib/types'
import type { Theme } from '../../lib/useTheme'

export function DriverHome({ driverId, theme }: { driverId: string; theme: Theme }) {
  const setDriverTab = useTallawahStore((st) => st.setDriverTab)
  const requests = useTallawahStore((st) => st.requests)
  const now = useTallawahStore((st) => st.now)
  const driver = useTallawahStore((st) => st.drivers.find((dr) => dr.id === driverId))!
  const vehicle = useTallawahStore((st) => st.vehicles.find((v) => v.id === driver.vehicleId))
  const pendingRoute = useTallawahStore((st) => selectDriverPendingRoute(st, driverId))
  const activeShipment = useTallawahStore((st) => selectDriverActiveShipment(st, driverId))
  const history = useTallawahStore((st) => selectDriverHistory(st, driverId))
  const perf = useTallawahStore((st) => selectDriverPerformanceKpis(st, driverId), shallow)

  const weekTrend = useMemo(() => pseudoTrailingSeries(`driver-bags-${driverId}`, 7, perf.weekBags), [driverId, perf.weekBags])

  const today = todayIso(now)
  const todaysHistory = history.filter((sh) => sh.closedAt && todayIso(sh.closedAt) === today)
  const bagsToday =
    todaysHistory.reduce((sum, sh) => sum + sh.stops.reduce((a, st) => a + (st.actualBags ?? 0), 0), 0) +
    (activeShipment?.stops.reduce((a, st) => a + (st.actualBags ?? 0), 0) ?? 0)
  const stopsToday = todaysHistory.reduce((sum, sh) => sum + sh.stops.length, 0) + (activeShipment?.stops.filter((s) => s.status === 'completed').length ?? 0)

  const showPendingBanner = pendingRoute && !activeShipment
  const showActiveBanner = !!activeShipment

  // ---- what's on the truck right now ----
  const capacityBags = vehicle?.capacityBags ?? VEHICLE_CAPACITY
  const onBoardBags = activeShipment?.stops.reduce((sum, st) => sum + (st.actualBags ?? 0), 0) ?? 0
  const stillToCollect = activeShipment
    ? activeShipment.stops.filter((st) => st.status !== 'completed').reduce((sum, st) => sum + st.estimatedBags, 0)
    : (pendingRoute?.totalEstimatedBags ?? 0)
  const roomLeft = capacityBags - onBoardBags
  const capacityCaption = activeShipment
    ? stillToCollect === 0
      ? `${fmtBags(roomLeft)} of room left · every stop collected`
      : stillToCollect > roomLeft
        ? `${fmtBags(stillToCollect)} still to collect — ${stillToCollect - roomLeft} more than will fit.`
        : `${fmtBags(roomLeft)} of room left · ${fmtBags(stillToCollect)} still to collect`
    : pendingRoute
      ? `Empty · ${fmtBags(pendingRoute.totalEstimatedBags)} planned on your next route`
      : 'Empty — ready for the next route.'

  // ---- where to head next ----
  // heading home covers both the return leg and waiting at the receiving desk
  const headingHome = !!activeShipment && (activeShipment.legIndex >= activeShipment.stops.length || activeShipment.status === 'arrived_factory')
  const nextStop = activeShipment?.stops.find((st) => st.status !== 'completed')
  const firstPendingStop = !activeShipment && pendingRoute ? requests.find((r) => r.id === pendingRoute.requestIds[0]) : undefined
  const destination: { title: string; point: GeoPoint; name: string; meta: string; hue: number } =
    activeShipment && nextStop && !headingHome
      ? { title: 'Next stop', point: nextStop.location, name: nextStop.farmerName, meta: `${nextStop.location.community} · ${fmtBags(nextStop.estimatedBags)} expected`, hue: 40 }
      : firstPendingStop
        ? { title: 'First stop', point: firstPendingStop.location, name: firstPendingStop.farmerName, meta: `${firstPendingStop.location.community} · ${fmtBags(firstPendingStop.estimatedBags)} expected`, hue: 40 }
        : {
            title: activeShipment?.status === 'arrived_factory' ? 'At the depot' : headingHome ? 'Heading to the depot' : 'Home depot',
            point: FACTORY,
            name: 'Kumasi Processing Depot',
            meta: FACTORY.community,
            hue: 150,
          }
  // only meaningful while a shipment is live — that's the only time we have a real position
  const distanceKm = activeShipment ? haversineKm(activeShipment.position, destination.point) : null
  // "0.0 km away" is true but useless once the truck is parked at the gate
  const distanceLabel = distanceKm === null ? null : distanceKm < 0.15 ? "You're here" : `${distanceKm.toFixed(1)} km away`

  return (
    <>
      {showPendingBanner && pendingRoute && (
        <div className={[d.banner, d.job].join(' ')}>
          <span className={d.bannerLabel}>
            <Sparkles size={13} /> New route assigned
          </span>
          <span className={d.bannerTitle}>{pendingRoute.requestIds.length} stops today</span>
          <span className={d.bannerDesc}>
            {fmtBags(pendingRoute.totalEstimatedBags)} to collect ·{' '}
            {requests
              .filter((r) => pendingRoute.requestIds.includes(r.id))
              .slice(0, 2)
              .map((r) => r.location.community)
              .join(', ')}
            {pendingRoute.requestIds.length > 2 ? '…' : ''}
          </span>
          <div className={d.bannerFoot}>
            <Button variant="dark" size="sm" iconRight={<ChevronRight size={14} />} onClick={() => setDriverTab('route')}>
              View route
            </Button>
          </div>
        </div>
      )}

      {showActiveBanner && activeShipment && (
        <div className={[d.banner, d.active].join(' ')}>
          <span className={d.bannerLabel}>
            <Truck size={13} /> {activeShipment.status === 'arrived_factory' ? 'Back at depot' : 'Route in progress'}
          </span>
          <span className={d.bannerTitle}>
            {activeShipment.stops.filter((s) => s.status === 'completed').length}/{activeShipment.stops.length} stops done
          </span>
          <span className={d.bannerDesc}>
            {activeShipment.status === 'arrived_factory' ? 'Waiting on the receiving desk to check you in.' : 'Keep going — tap in to update your next stop.'}
          </span>
          <div className={d.bannerFoot}>
            <Button variant="dark" size="sm" iconRight={<ChevronRight size={14} />} onClick={() => setDriverTab('route')}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {!showPendingBanner && !showActiveBanner && (
        <div className={d.idleCard}>
          <span className={d.idleIcon}>
            <CheckCircle size={24} />
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>You're all set</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 220 }}>No route assigned yet. We'll notify you here the moment dispatch sends one over.</div>
        </div>
      )}

      <div className={d.capacityCard}>
        <div className={d.routeSummaryTop}>
          <span className={d.routeSummaryTitle}>
            <Truck size={15} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
            Vehicle capacity
          </span>
          <span className={d.capacityPlate}>{vehicle?.plate}</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <CapacityMeter value={onBoardBags} ceiling={capacityBags} label="On board" caption={capacityCaption} />
        </div>
      </div>

      <div className={d.routeSummary}>
        <div className={d.routeSummaryTop}>
          <span className={d.routeSummaryTitle}>
            <MapPin size={15} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
            {destination.title}
          </span>
          {distanceLabel && <span className={d.locDistance}>{distanceLabel}</span>}
        </div>
        <div className={d.stopMapWrap} style={{ marginTop: 10 }}>
          <MiniMap point={destination.point} theme={theme} height={128} hue={destination.hue} />
        </div>
        <div className={d.locName}>{destination.name}</div>
        <div className={d.locMeta}>{destination.meta}</div>
        <div className={d.stopActions}>
          <Button variant="ghost" size="sm" icon={<Navigation size={13} />} onClick={() => navigateTo(destination.point.lat, destination.point.lng)}>
            Navigate
          </Button>
        </div>
      </div>

      <div>
        <div className={d.sectionLabel}>Today</div>
        <div className={d.statRow} style={{ marginTop: 8 }}>
          <div className={d.statTile}>
            <span className={d.statValue}>{stopsToday}</span>
            <span className={d.statLabel}>Stops</span>
          </div>
          <div className={d.statTile}>
            <span className={d.statValue}>{bagsToday}</span>
            <span className={d.statLabel}>Bags</span>
          </div>
          <div className={d.statTile}>
            <span className={d.statValue}>{todaysHistory.length}</span>
            <span className={d.statLabel}>Delivered</span>
          </div>
        </div>
      </div>

      <div className={d.routeSummary}>
        <div className={d.routeSummaryTop}>
          <span className={d.routeSummaryTitle}>This week</span>
          <Sparkline values={weekTrend} width={72} height={26} color="var(--green)" />
        </div>
        <div className={d.statRow} style={{ marginTop: 10 }}>
          <div className={d.statTile}>
            <span className={d.statValue}>{perf.weekStops}</span>
            <span className={d.statLabel}>Stops</span>
          </div>
          <div className={d.statTile}>
            <span className={d.statValue}>{perf.weekBags}</span>
            <span className={d.statLabel}>Bags</span>
          </div>
          <div className={d.statTile}>
            <span className={d.statValue}>{perf.qualityPassRate !== null ? `${Math.round(perf.qualityPassRate * 100)}%` : '—'}</span>
            <span className={d.statLabel}>Quality</span>
          </div>
        </div>
      </div>

      <div className={d.routeSummary}>
        <div className={d.routeSummaryTop}>
          <span className={d.routeSummaryTitle}>Lifetime</span>
        </div>
        <div className={d.statRow} style={{ marginTop: 10 }}>
          <div className={d.statTile}>
            <span className={d.statValue}>{perf.lifetimeBags}</span>
            <span className={d.statLabel}>Bags collected</span>
          </div>
          <div className={d.statTile}>
            <span className={d.statValue}>{perf.lifetimeStops}</span>
            <span className={d.statLabel}>Stops done</span>
          </div>
          <div className={d.statTile}>
            <span className={d.statValue}>{perf.avgBagsPerStop}</span>
            <span className={d.statLabel}>Avg/stop</span>
          </div>
        </div>
      </div>

      {activeShipment?.status === 'arrived_factory' && (
        <div className={d.routeSummary}>
          <div className={d.routeSummaryTop}>
            <span className={d.routeSummaryTitle}>
              <Factory size={15} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
              At the depot
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>The receiving desk will check your load in shortly.</div>
        </div>
      )}
    </>
  )
}
