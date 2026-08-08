import d from './driver.module.css'
import { useTallawahStore } from '../../store/useStore'
import { selectDriverActiveShipment, selectDriverHistory, selectDriverPendingRoute } from '../../store/selectors'
import { Button } from '../../components/ui/Button'
import { CheckCircle, ChevronRight, Factory, Sparkles, Truck } from '../../components/icons'
import { fmtBags, todayIso } from '../../lib/format'

export function DriverHome({ driverId }: { driverId: string }) {
  const setDriverTab = useTallawahStore((st) => st.setDriverTab)
  const requests = useTallawahStore((st) => st.requests)
  const now = useTallawahStore((st) => st.now)
  const pendingRoute = useTallawahStore((st) => selectDriverPendingRoute(st, driverId))
  const activeShipment = useTallawahStore((st) => selectDriverActiveShipment(st, driverId))
  const history = useTallawahStore((st) => selectDriverHistory(st, driverId))

  const today = todayIso(now)
  const todaysHistory = history.filter((sh) => sh.closedAt && todayIso(sh.closedAt) === today)
  const bagsToday =
    todaysHistory.reduce((sum, sh) => sum + sh.stops.reduce((a, st) => a + (st.actualBags ?? 0), 0), 0) +
    (activeShipment?.stops.reduce((a, st) => a + (st.actualBags ?? 0), 0) ?? 0)
  const stopsToday = todaysHistory.reduce((sum, sh) => sum + sh.stops.length, 0) + (activeShipment?.stops.filter((s) => s.status === 'completed').length ?? 0)

  const showPendingBanner = pendingRoute && !activeShipment
  const showActiveBanner = !!activeShipment

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
