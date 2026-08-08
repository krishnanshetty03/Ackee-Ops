import { useMemo, useState } from 'react'
import { shallow } from 'zustand/shallow'
import s from '../staff.module.css'
import o from './overview.module.css'
import { PageHead, PageInner } from '../StaffShell'
import { useTallawahStore } from '../../../store/useStore'
import {
  selectAvgTurnaroundMs,
  selectCapacityKpis,
  selectExceptionKpis,
  selectIntakeKpis,
  selectReceivingKpis,
  selectTrackingKpis,
} from '../../../store/selectors'
import { Card, CardHeader } from '../../../components/ui/Card'
import { CapacityMeter } from '../../../components/ui/CapacityMeter'
import { StatusBadge } from '../../../components/ui/Badge'
import { Avatar } from '../../../components/ui/Avatar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { TrackingMap } from '../../../components/map/TrackingMap'
import { MiniMap } from '../../../components/map/MiniMap'
import { Sparkline } from '../../../components/charts/Sparkline'
import { MiniBarChart } from '../../../components/charts/MiniBarChart'
import { TruckIllustration } from '../../../components/illustrations/TruckIllustration'
import { pseudoTrailingSeries } from '../../../lib/pseudoSeries'
import { fmtRelativeTime } from '../../../lib/format'
import { AlertTriangle, Bell, Factory, MapPin, Navigation, Package, Phone, Send, Truck } from '../../../components/icons'
import type { Theme } from '../../../lib/useTheme'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmtDuration(ms: number | null) {
  if (ms === null) return '—'
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${m}m`
}

const STATUS_PROGRESS: Record<string, number> = { unassigned: 0.18, assigned: 0.55, fulfilled: 1, flagged: 0.4 }

export function Overview({ theme }: { theme: Theme }) {
  const intake = useTallawahStore(selectIntakeKpis, shallow)
  const capacity = useTallawahStore(selectCapacityKpis, shallow)
  const tracking = useTallawahStore(selectTrackingKpis, shallow)
  const receiving = useTallawahStore(selectReceivingKpis, shallow)
  const exceptions = useTallawahStore(selectExceptionKpis, shallow)
  const avgTurnaround = useTallawahStore(selectAvgTurnaroundMs)
  const notifications = useTallawahStore((st) => st.notifications)
  const drivers = useTallawahStore((st) => st.drivers)
  const vehicles = useTallawahStore((st) => st.vehicles)
  const shipments = useTallawahStore((st) => st.shipments)
  const requests = useTallawahStore((st) => st.requests)
  const now = useTallawahStore((st) => st.now)
  const setStaffTab = useTallawahStore((st) => st.setStaffTab)
  const setFocusShipment = useTallawahStore((st) => st.setFocusShipment)

  const [mapFilter, setMapFilter] = useState<'active' | 'all'>('all')
  const passRatePct = Math.round(receiving.qualityPassRate * 100)

  const mapShipments = useMemo(
    () => (mapFilter === 'active' ? shipments.filter((sh) => sh.status === 'active') : shipments),
    [shipments, mapFilter],
  )

  const volumeSeries = useMemo(() => pseudoTrailingSeries('collected-bags', 7, tracking.bagsCollectedToday), [tracking.bagsCollectedToday])
  const stockSeries = useMemo(() => pseudoTrailingSeries('stock-onhand', 7, receiving.stockOnHandBags, 0.22), [receiving.stockOnHandBags])
  const todayDow = new Date(now).getDay() // 0=Sun
  const last7Labels = Array.from({ length: 7 }, (_, i) => DAY_LABELS[(todayDow - 6 + i + 700) % 7])

  const featuredDriver = drivers.find((d) => d.status === 'on_route') ?? drivers[0]
  const featuredVehicle = vehicles.find((v) => v.id === featuredDriver?.vehicleId)
  const featuredShipment = shipments.find((sh) => sh.driverId === featuredDriver?.id && (sh.status === 'active' || sh.status === 'arrived_factory'))

  const latestRequest = [...requests].sort((a, b) => b.createdAt - a.createdAt)[0]

  return (
    <PageInner>
      <PageHead title="Overview" desc="Live status across intake, dispatch, in-transit collection, and receiving." />

      {/* ---- hero map ---- */}
      <div className={o.hero}>
        <TrackingMap shipments={mapShipments} drivers={drivers} theme={theme} focusShipmentId={null} onSelectShipment={() => setStaffTab('tracking')} scrollWheelZoom={false} />
        <div className={o.heroTopRow}>
          <span className={o.heroPill}>
            <MapPin size={13} />
            Ashanti Region <span className="muted" style={{ color: 'var(--muted)', fontWeight: 600 }}>· Ghana</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={o.heroFilter}>
              <button className={[o.heroFilterOpt, mapFilter === 'active' ? o.on : ''].join(' ')} onClick={() => setMapFilter('active')}>
                On the road
              </button>
              <button className={[o.heroFilterOpt, mapFilter === 'all' ? o.on : ''].join(' ')} onClick={() => setMapFilter('all')}>
                All vehicles
              </button>
            </div>
            <button className={o.heroExpand} onClick={() => setStaffTab('tracking')} title="Open full tracking view" aria-label="Expand map">
              <Navigation size={15} />
            </button>
          </div>
        </div>
        <div className={o.heroCaption}>
          <b>{tracking.vehiclesOut}</b> of {tracking.fleetSize} vehicles out · <b>{tracking.bagsCollectedToday}</b> bags collected today
        </div>
      </div>

      {/* ---- bento grid ---- */}
      <div className={o.bento}>
        {/* column 1 — volume & queue health */}
        <div className={o.col}>
          <Card padded>
            <div className={o.volumeTop}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5 }}>Collection volume</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Last 7 days</div>
              </div>
              <Sparkline values={volumeSeries} width={110} height={38} color="var(--green)" />
            </div>
            <div className={o.volumeNumbers}>
              <div className={o.volumeMain}>
                <span className={o.volumeValue}>{tracking.bagsCollectedToday}</span>
                <span className={o.volumeLabel}>Bags collected today</span>
              </div>
              <div className={[o.volumeMain, o.volumeSecondary].join(' ')}>
                <span className={o.volumeValue}>{passRatePct}%</span>
                <span className={o.volumeLabel}>Quality pass rate</span>
              </div>
            </div>
          </Card>

          <div className={o.miniRow}>
            <div className={o.miniCard}>
              <span className={o.miniLabel}>Pending requests</span>
              <span className={o.miniValue}>{intake.pendingCount}</span>
              <span className={[o.miniBadge, intake.pendingCount > 0 ? o.gold : ''].join(' ')}>{intake.pendingBags} bags waiting</span>
            </div>
            <div className={o.miniCard}>
              <span className={o.miniLabel}>Open exceptions</span>
              <span className={o.miniValue}>{exceptions.openCount}</span>
              <span className={[o.miniBadge, exceptions.openCount > 0 ? o.warn : ''].join(' ')}>{exceptions.openCount > 0 ? 'Needs attention' : 'All clear'}</span>
            </div>
          </div>
          <div className={o.miniRow}>
            <div className={o.miniCard}>
              <span className={o.miniLabel}>Awaiting receiving</span>
              <span className={o.miniValue}>{receiving.awaitingCount}</span>
              <span className={o.miniBadge}>{receiving.awaitingBags} bags at the gate</span>
            </div>
            <div className={o.miniCard}>
              <span className={o.miniLabel}>Avg. turnaround</span>
              <span className={o.miniValue}>{fmtDuration(avgTurnaround)}</span>
              <span className={o.miniBadge}>Request → collected</span>
            </div>
          </div>
        </div>

        {/* column 2 — fleet */}
        <div className={o.col}>
          <Card padded>
            <div className={o.fleetHead}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5 }}>Fleet</div>
              <span className={o.fleetTotal}>{vehicles.length} total</span>
            </div>
            <div className={o.fleetTiles}>
              <div className={o.fleetTile}>
                <div className={o.fleetTileValue}>
                  {tracking.vehiclesOut}/{tracking.fleetSize}
                </div>
                <div className={o.fleetTileLabel}>Out now</div>
              </div>
              <div className={o.fleetTile}>
                <div className={o.fleetTileValue}>{passRatePct}%</div>
                <div className={o.fleetTileLabel}>Quality</div>
              </div>
              <div className={o.fleetTile}>
                <div className={o.fleetTileValue}>{tracking.bagsRemaining}</div>
                <div className={o.fleetTileLabel}>In transit</div>
              </div>
            </div>

            <div className={o.truckWrap}>
              <TruckIllustration width={230} />
            </div>

            {featuredDriver && (
              <div className={o.driverRow}>
                <Avatar initials={featuredDriver.initials} hue={featuredDriver.avatarHue} size="md" status={featuredDriver.status === 'available' ? 'online' : featuredDriver.status === 'on_route' ? 'busy' : 'offline'} />
                <div className={o.driverText}>
                  <div className={o.driverName}>{featuredDriver.name}</div>
                  <div className={o.driverRole}>
                    Driver · {featuredVehicle?.plate}
                  </div>
                </div>
                <div className={o.driverActions}>
                  <button className={o.driverActionBtn} title={featuredDriver.phone}>
                    <Phone size={13} />
                  </button>
                  <button className={o.driverActionBtn} title="Message driver">
                    <Send size={13} />
                  </button>
                  {featuredShipment && (
                    <button
                      className={o.driverActionBtn}
                      title="Locate on map"
                      onClick={() => {
                        setFocusShipment(featuredShipment.id)
                        setStaffTab('tracking')
                      }}
                    >
                      <MapPin size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* column 3 — latest request & stock */}
        <div className={o.col}>
          <Card padded>
            <div className={o.latestHead}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5 }}>Latest request</div>
              <button className={o.latestSeeAll} onClick={() => setStaffTab('intake')}>
                See all
              </button>
            </div>
            {!latestRequest ? (
              <EmptyState icon={<Package size={18} />} title="No requests yet" />
            ) : (
              <div className={o.latestBody}>
                <div className={o.latestInfo}>
                  <div className={o.latestIdRow}>
                    <span className={o.latestId}>{latestRequest.id}</span>
                    <StatusBadge status={latestRequest.status} />
                  </div>
                  <div className={o.latestMeta}>
                    {latestRequest.farmerName} · {latestRequest.location.community}
                  </div>
                  <div className={o.latestMeta}>{fmtRelativeTime(latestRequest.createdAt, now)}</div>
                  <div className={o.latestProgressTrack}>
                    <div className={o.latestProgressFill} style={{ width: `${(STATUS_PROGRESS[latestRequest.status] ?? 0.1) * 100}%` }}>
                      <span className={o.latestProgressDot} />
                    </div>
                  </div>
                </div>
                <div className={o.latestThumb}>
                  <MiniMap point={latestRequest.location} theme={theme} height={96} hue={38} />
                </div>
              </div>
            )}
          </Card>

          <Card padded>
            <div className={o.stockHead}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5 }}>Stock on hand</div>
              <span className={o.stockDateRange}>Last 7 days</span>
            </div>
            <div className={o.stockValueRow}>
              <span className={o.stockValue}>{receiving.stockOnHandBags} bags</span>
              <span className={o.stockChangeBadge}>{passRatePct}% pass rate</span>
            </div>
            <div className={o.stockChart}>
              <MiniBarChart values={stockSeries} width={280} height={72} highlightFrom={4} highlightColor="var(--gold-fill)" />
              <div className={o.stockChartLabels}>
                {last7Labels.map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card padded>
        <CardHeader title="Today's fleet capacity" subtitle={`${capacity.fleetSize} vehicles × 120 bags per round`} />
        <div style={{ marginTop: 14 }}>
          <CapacityMeter
            value={capacity.demand}
            ceiling={capacity.ceiling}
            segments={capacity.fleetSize}
            caption={
              capacity.overCapacity
                ? `Over capacity — ${capacity.demand - capacity.ceiling} bags won't fit this round. Consider a second round or reschedule.`
                : `${capacity.ceiling - capacity.demand} bags of headroom left today.`
            }
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Activity" subtitle="Latest updates across the system" />
        {notifications.length === 0 ? (
          <EmptyState icon={<Bell size={20} />} title="No activity yet" desc="Requests, dispatches, and receiving updates will show up here." />
        ) : (
          <div className={s.activityList}>
            {notifications.slice(0, 6).map((n) => (
              <div key={n.id} className={s.activityItem}>
                <span className={[s.activityIcon, n.kind === 'exception' ? s.red : n.kind === 'receiving' || n.kind === 'shipment' ? s.green : ''].join(' ')}>
                  {n.kind === 'exception' ? <AlertTriangle size={14} /> : n.kind === 'shipment' ? <Truck size={14} /> : n.kind === 'receiving' ? <Factory size={14} /> : <Bell size={14} />}
                </span>
                <div className={s.activityBody}>
                  <div className={s.activityTitle}>{n.title}</div>
                  <div className={s.activityDesc}>{n.body}</div>
                  <div className={s.activityTime}>{fmtRelativeTime(n.createdAt, now)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageInner>
  )
}
