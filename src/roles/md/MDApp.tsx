import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import m from './md.module.css'
import { useTallawahStore } from '../../store/useStore'
import { selectBagIntakeKpis, selectCapacityKpis, selectExceptionKpis, selectFarmerActivityKpis } from '../../store/selectors'
import { EXPORT_CLEARANCES, ONLINE_STORE, WAREHOUSES } from '../../lib/seed'
import { Card, CardHeader } from '../../components/ui/Card'
import { CapacityMeter } from '../../components/ui/CapacityMeter'
import { StatusBadge } from '../../components/ui/Badge'
import { Sparkline } from '../../components/charts/Sparkline'
import { EmptyState } from '../../components/ui/EmptyState'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { pseudoTrailingSeries } from '../../lib/pseudoSeries'
import { fmtRelativeTime, fmtUsd } from '../../lib/format'
import { AlertTriangle, Factory, LogOut, Package, Truck, Users, Weight } from '../../components/icons'
import type { Theme } from '../../lib/useTheme'

const CLEARANCE_LABEL: Record<string, string> = { approved: 'Approved', in_review: 'In review', pending: 'Pending' }
const WAREHOUSE_LABEL: Record<string, string> = { ready: 'Ready', in_setup: 'In setup', not_started: 'Not started' }

function pctDelta(current: number, previous: number): string {
  if (previous === 0) return '—'
  const pct = ((current - previous) / previous) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`
}

export function MDApp({ theme, onToggleTheme, onSignOut }: { theme: Theme; onToggleTheme: () => void; onSignOut: () => void }) {
  const bagIntake = useTallawahStore(selectBagIntakeKpis, shallow)
  const capacity = useTallawahStore(selectCapacityKpis, shallow)
  const farmerActivity = useTallawahStore(selectFarmerActivityKpis, shallow)
  const exceptionKpis = useTallawahStore(selectExceptionKpis, shallow)
  const openExceptions = useTallawahStore((st) => st.exceptions.filter((e) => e.status === 'open'))
  const staff = useTallawahStore((st) => st.staff)
  const now = useTallawahStore((st) => st.now)

  const intakeSeries = useMemo(() => pseudoTrailingSeries('md-bag-intake', 7, bagIntake.todayBags), [bagIntake.todayBags])
  const revenueSeries = useMemo(() => pseudoTrailingSeries('md-revenue', 7, Math.round(ONLINE_STORE.revenueMtdUsd / 4)), [])
  const revenueDelta = pctDelta(ONLINE_STORE.revenueMtdUsd, ONLINE_STORE.revenueLastMonthUsd)
  const ordersDelta = pctDelta(ONLINE_STORE.ordersMtd, ONLINE_STORE.ordersLastMonth)

  return (
    <div className={m.page}>
      <div className={m.topBar}>
        <span className={m.wordmark}>
          <img src="./logo.png" alt="" width={24} height={24} style={{ objectFit: 'contain' }} />
          Tallawah Ops
        </span>
        <div className={m.topBarRight}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className={m.signOutBtn} onClick={onSignOut} title="Sign out" aria-label="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <div className={m.inner}>
        <div className={m.head}>
          <div className={m.eyebrow}>Executive Summary</div>
          <h1 className={m.title}>Management Overview</h1>
          <p className={m.desc}>A single high-level view for decision-making — separate from the day-to-day operations screens.</p>
        </div>

        <div className={m.grid}>
          {/* left column */}
          <div className={m.gridCol}>
            {/* ---- Bag Intake ---- */}
            <Card padded>
              <CardHeader title={<span className={m.cardTitle}><Weight size={15} /> Bag Intake</span>} subtitle="Daily and weekly totals across all farmers" />
              <div className={m.intakeRow}>
                <div className={m.bigStat}>
                  <span className={m.bigStatValue}>{bagIntake.todayBags}</span>
                  <span className={m.bigStatLabel}>Bags today</span>
                </div>
                <div className={m.bigStat}>
                  <span className={m.bigStatValue}>{bagIntake.weekBags}</span>
                  <span className={m.bigStatLabel}>Bags this week</span>
                </div>
                <Sparkline values={intakeSeries} width={110} height={40} color="var(--green)" />
              </div>
            </Card>

            {/* ---- Farmer & Staff Activity ---- */}
            <Card padded>
              <CardHeader title={<span className={m.cardTitle}><Users size={15} /> Farmer & Staff Activity</span>} subtitle="Active farmers, new sign-ups, staff performance" />
              <div className={m.intakeRow}>
                <div className={m.bigStat}>
                  <span className={m.bigStatValue}>
                    {farmerActivity.activeCount}
                    <span className={m.bigStatOf}>/{farmerActivity.totalFarmers}</span>
                  </span>
                  <span className={m.bigStatLabel}>Active farmers</span>
                </div>
                <div className={m.bigStat}>
                  <span className={m.bigStatValue}>{farmerActivity.newSignups}</span>
                  <span className={m.bigStatLabel}>New sign-ups</span>
                </div>
                <div className={m.bigStat}>
                  <span className={m.bigStatValue}>{farmerActivity.requestsThisWeek}</span>
                  <span className={m.bigStatLabel}>Requests this week</span>
                </div>
              </div>
              <div className={m.staffRow}>
                <span className={m.staffName}>{staff.name}</span>
                <span className={m.staffRole}>{staff.role} · dispatch team</span>
              </div>
            </Card>

            {/* ---- Revenue & Orders ---- */}
            <Card padded>
              <CardHeader title={<span className={m.cardTitle}><Package size={15} /> Revenue & Orders</span>} subtitle="High-level overview from the online store" />
              <div className={m.intakeRow}>
                <div className={m.bigStat}>
                  <span className={m.bigStatValue}>{fmtUsd(ONLINE_STORE.revenueMtdUsd)}</span>
                  <span className={m.bigStatLabel}>Revenue MTD</span>
                  <span className={[m.deltaBadge, revenueDelta.startsWith('+') ? m.up : m.down].join(' ')}>{revenueDelta} vs last month</span>
                </div>
                <Sparkline values={revenueSeries} width={110} height={40} color="var(--gold-fill)" />
              </div>
              <div className={m.miniStatRow}>
                <div className={m.miniStat}>
                  <span className={m.miniStatValue}>{ONLINE_STORE.ordersMtd}</span>
                  <span className={m.miniStatLabel}>Orders MTD ({ordersDelta})</span>
                </div>
                <div className={m.miniStat}>
                  <span className={m.miniStatValue}>{fmtUsd(ONLINE_STORE.avgOrderValueUsd)}</span>
                  <span className={m.miniStatLabel}>Avg. order value</span>
                </div>
                <div className={m.miniStat}>
                  <span className={m.miniStatValue}>{ONLINE_STORE.topMarket}</span>
                  <span className={m.miniStatLabel}>Top market</span>
                </div>
              </div>
            </Card>
          </div>

          {/* right column */}
          <div className={m.gridCol}>
            {/* ---- Capacity Utilization ---- */}
            <Card padded>
              <CardHeader title={<span className={m.cardTitle}><Truck size={15} /> Capacity Utilization</span>} subtitle="Bags booked vs. the fleet ceiling" />
              <div style={{ marginTop: 14 }}>
                <CapacityMeter
                  value={capacity.demand}
                  ceiling={capacity.ceiling}
                  segments={capacity.fleetSize}
                  label="Booked today"
                  caption={
                    capacity.overCapacity
                      ? `Over capacity — ${capacity.demand - capacity.ceiling} bags won't fit this round.`
                      : `${capacity.ceiling - capacity.demand} bags of headroom · ${capacity.fleetSize} vehicles × 120 bags/round`
                  }
                />
              </div>
            </Card>

            {/* ---- Export & Warehouse Readiness ---- */}
            <Card padded>
              <CardHeader
                title={<span className={m.cardTitle}><Factory size={15} /> Export & Warehouse Readiness</span>}
                subtitle="Import clearances and warehouse status abroad"
              />
              <div className={m.subhead}>Clearances</div>
              <div className={m.readinessList}>
                {EXPORT_CLEARANCES.map((c) => (
                  <div key={c.id} className={m.readinessRow}>
                    <div className={m.readinessInfo}>
                      <span className={m.readinessName}>{c.market}</span>
                      <span className={m.readinessMeta}>{c.authority}</span>
                    </div>
                    <StatusBadge status={c.status} label={CLEARANCE_LABEL[c.status]} />
                  </div>
                ))}
              </div>
              <div className={m.subhead}>Warehouses</div>
              <div className={m.readinessList}>
                {WAREHOUSES.map((w) => (
                  <div key={w.id} className={m.readinessRow}>
                    <div className={m.readinessInfo}>
                      <span className={m.readinessName}>{w.country}</span>
                      <span className={m.readinessMeta}>
                        {w.city} · {w.capacityTons}t capacity
                      </span>
                    </div>
                    <StatusBadge status={w.status} label={WAREHOUSE_LABEL[w.status]} />
                  </div>
                ))}
              </div>
            </Card>

            {/* ---- Exceptions ---- */}
            <Card padded>
              <CardHeader title={<span className={m.cardTitle}><AlertTriangle size={15} /> Exceptions</span>} subtitle="Anything flagged on the Staff dashboard" />
              <div className={m.bigStat} style={{ marginBottom: 12 }}>
                <span className={m.bigStatValue}>{exceptionKpis.openCount}</span>
                <span className={m.bigStatLabel}>{exceptionKpis.openCount === 1 ? 'Open exception' : 'Open exceptions'}</span>
              </div>
              {openExceptions.length === 0 ? (
                <EmptyState icon={<AlertTriangle size={18} />} title="Nothing needs your attention" />
              ) : (
                <div className={m.excList}>
                  {openExceptions.slice(0, 4).map((e) => (
                    <div key={e.id} className={m.excRow}>
                      <span className={m.excDot} />
                      <div className={m.excBody}>
                        <div className={m.excNote}>{e.note}</div>
                        <div className={m.excMeta}>
                          {e.id} · {fmtRelativeTime(e.createdAt, now)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
