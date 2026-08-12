import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import m from './md.module.css'
import { useTallawahStore } from '../../store/useStore'
import { selectBagIntakeKpis, selectCapacityKpis, selectExceptionKpis, selectFarmerActivityKpis } from '../../store/selectors'
import {
  EXPORT_CLEARANCES,
  ONLINE_STORE,
  SALES_FY_LABEL,
  salesAvgWonDealUsd,
  salesFytdWonUsd,
  salesGoalUsd,
  salesLostUsd,
  salesOpenFunnel,
  salesOpenPipelineUsd,
  salesRepPerformance,
  salesRevenueByMonth,
  salesRevenueByQuarter,
  salesTopAccountsByRevenue,
  salesTopOpenDeals,
  salesWeightedForecastUsd,
  salesWinRate,
  WAREHOUSES,
} from '../../lib/seed'
import { Card, CardHeader } from '../../components/ui/Card'
import { CapacityMeter } from '../../components/ui/CapacityMeter'
import { StatusBadge } from '../../components/ui/Badge'
import { Sparkline } from '../../components/charts/Sparkline'
import { GaugeChart } from '../../components/charts/GaugeChart'
import { ColumnChart } from '../../components/charts/ColumnChart'
import { FunnelChart } from '../../components/charts/FunnelChart'
import { HBarChart } from '../../components/charts/HBarChart'
import { EmptyState } from '../../components/ui/EmptyState'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { pseudoTrailingSeries } from '../../lib/pseudoSeries'
import { fmtRelativeTime, fmtUsd, fmtUsdCompact } from '../../lib/format'
import { AlertTriangle, BarChart, Factory, Filter, ListChecks, LogOut, Package, Send, Star, Truck, Users, Weight } from '../../components/icons'
import type { DealStage } from '../../lib/types'
import type { Theme } from '../../lib/useTheme'

const CLEARANCE_LABEL: Record<string, string> = { approved: 'Approved', in_review: 'In review', pending: 'Pending' }
const WAREHOUSE_LABEL: Record<string, string> = { ready: 'Ready', in_setup: 'In setup', not_started: 'Not started' }
const STAGE_LABEL: Record<DealStage, string> = {
  prospecting: 'Prospecting',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed won',
  closed_lost: 'Closed lost',
}

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

  // every figure below is a different grouping of the same SALES_DEALS list
  const fytdWonUsd = salesFytdWonUsd()
  const goalUsd = salesGoalUsd()
  const revenueByQuarter = salesRevenueByQuarter()
  const revenueByMonth = salesRevenueByMonth()
  const openPipelineUsd = salesOpenPipelineUsd()
  const weightedForecastUsd = salesWeightedForecastUsd()
  const winRate = salesWinRate()
  const funnel = salesOpenFunnel()
  const topOpenDeals = salesTopOpenDeals(6)
  const topAccounts = salesTopAccountsByRevenue(6)
  const repPerformance = salesRepPerformance()
  const goalAttainment = goalUsd > 0 ? fytdWonUsd / goalUsd : 0

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

        {/* ============ Sales performance dashboard ============ */}
        <div className={m.sectionHead}>
          <div className={m.eyebrow}>Sales · {SALES_FY_LABEL}</div>
          <h2 className={m.sectionTitle}>Export Sales Performance</h2>
          <p className={m.desc}>B2B deals with retail &amp; distribution partners abroad — every tile below reads off the same deal list.</p>
        </div>

        <div className={m.dashGrid}>
          {/* ---- revenue vs goal gauge ---- */}
          <Card padded className={m.span2}>
            <CardHeader title={<span className={m.cardTitle}><BarChart size={15} /> Revenue to Goal</span>} subtitle={`${SALES_FY_LABEL} closed won vs. combined quota`} />
            <div className={m.gaugeWrap}>
              <GaugeChart value={fytdWonUsd} goal={goalUsd} tickFormat={fmtUsdCompact} />
              <div className={m.gaugeReadout}>
                <span className={m.gaugeValue}>{fmtUsd(fytdWonUsd)}</span>
                <span className={[m.deltaBadge, goalAttainment >= 0.8 ? m.up : goalAttainment >= 0.5 ? m.mid : m.down].join(' ')}>{Math.round(goalAttainment * 100)}% of goal</span>
              </div>
            </div>
            <div className={m.tileFoot}>
              {fmtUsd(goalUsd - fytdWonUsd)} to go · weighted pipeline covers {fmtUsd(weightedForecastUsd)} of it
            </div>
          </Card>

          {/* ---- revenue by quarter ---- */}
          <Card padded className={m.span2}>
            <CardHeader title={<span className={m.cardTitle}><BarChart size={15} /> Revenue by Quarter</span>} subtitle="Closed won, fiscal year to date" />
            <ColumnChart data={revenueByQuarter.map((q) => ({ label: q.label, value: q.valueUsd }))} valueFormat={fmtUsdCompact} />
            <div className={m.tileFoot}>Q4 hasn&apos;t opened yet — the year is still mid-flight.</div>
          </Card>

          {/* ---- revenue by month ---- */}
          <Card padded className={m.span2}>
            <CardHeader title={<span className={m.cardTitle}><BarChart size={15} /> Revenue by Month</span>} subtitle="Closed won, fiscal year to date" />
            <ColumnChart data={revenueByMonth.map((mo) => ({ label: mo.label, value: mo.valueUsd }))} color="var(--green)" valueFormat={fmtUsdCompact} />
            <div className={m.tileFoot}>Best month so far: {revenueByMonth.reduce((best, mo) => (mo.valueUsd > best.valueUsd ? mo : best)).label}.</div>
          </Card>

          {/* ---- key metrics ---- */}
          <Card padded className={m.span2}>
            <CardHeader title={<span className={m.cardTitle}><Filter size={15} /> Key Metrics</span>} subtitle={`${SALES_FY_LABEL} deal quality`} />
            <div className={m.kmList}>
              <div className={m.kmRow}>
                <span className={m.kmLabel}>Avg. deal size</span>
                <span className={m.kmValue}>{fmtUsd(salesAvgWonDealUsd())}</span>
              </div>
              <div className={m.kmRow}>
                <span className={m.kmLabel}>Win rate</span>
                <span className={m.kmValue}>{winRate !== null ? `${Math.round(winRate * 100)}%` : '—'}</span>
              </div>
              <div className={m.kmRow}>
                <span className={m.kmLabel}>Lost opportunities</span>
                <span className={[m.kmValue, m.kmValueLost].join(' ')}>{fmtUsd(salesLostUsd())}</span>
              </div>
              <div className={m.kmRow}>
                <span className={m.kmLabel}>Weighted forecast</span>
                <span className={m.kmValue}>{fmtUsd(weightedForecastUsd)}</span>
              </div>
            </div>
            <div className={m.tileFoot}>Forecast discounts each live deal by its stage&apos;s odds, so it isn&apos;t the raw pipeline total.</div>
          </Card>

          {/* ---- pipeline funnel ---- */}
          <Card padded className={m.span2}>
            <CardHeader title={<span className={m.cardTitle}><Send size={15} /> Pipeline by Stage</span>} subtitle={`${fmtUsd(openPipelineUsd)} open across ${funnel.reduce((n, b) => n + b.count, 0)} deals`} />
            <div className={m.funnelWrap}>
              <FunnelChart
                bands={funnel.map((b) => ({
                  label: STAGE_LABEL[b.stage],
                  value: b.valueUsd,
                  caption: `${b.count} deal${b.count === 1 ? '' : 's'}`,
                }))}
                valueFormat={fmtUsdCompact}
              />
            </div>
            <div className={m.tileFoot}>Widest at the top — deals drop out as they progress.</div>
          </Card>

          {/* ---- rep leaderboard ---- */}
          <Card padded className={m.span2}>
            <CardHeader title={<span className={m.cardTitle}><Star size={15} /> Quota Attainment</span>} subtitle="One rep per export market" />
            <div className={m.repList}>
              {repPerformance.map(({ rep, closedWonUsd, dealsWon, dealsOpen, attainment }) => (
                <div key={rep.id} className={m.repRow}>
                  <div className={m.repHead}>
                    <div>
                      <div className={m.repName}>{rep.name}</div>
                      <div className={m.repRegion}>
                        {rep.region} · {dealsWon} won · {dealsOpen} open
                      </div>
                    </div>
                    <span className={m.repAttainment}>{Math.round(attainment * 100)}%</span>
                  </div>
                  <div className={m.repBarTrack}>
                    <div className={m.repBarFill} style={{ width: `${attainment * 100}%` }} />
                  </div>
                  <div className={m.repFigures}>
                    {fmtUsd(closedWonUsd)} <span className={m.repFiguresMuted}>/ {fmtUsd(rep.quotaUsd)} quota</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={m.tileFoot}>The company goal on the dial is these three quotas combined: {fmtUsd(goalUsd)}.</div>
          </Card>

          {/* ---- top open opportunities ---- */}
          <Card padded className={m.span3}>
            <CardHeader title={<span className={m.cardTitle}><ListChecks size={15} /> Top Open Opportunities</span>} subtitle="Biggest live deals, by amount" />
            <table className={m.dealTable}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Stage</th>
                  <th className={m.thNum}>Amount</th>
                  <th className={m.thNum}>Prob.</th>
                </tr>
              </thead>
              <tbody>
                {topOpenDeals.map(({ deal, probability, repName }) => (
                  <tr key={deal.id}>
                    <td>
                      <div className={m.acctName}>{deal.account}</div>
                      <div className={m.acctMeta}>
                        {deal.market} · {repName}
                      </div>
                    </td>
                    <td>
                      <span className={m.stagePill}>{STAGE_LABEL[deal.stage]}</span>
                    </td>
                    <td className={m.numCell}>{fmtUsd(deal.valueUsd)}</td>
                    <td className={m.numCell}>
                      <div className={m.probWrap}>
                        <span>{Math.round(probability * 100)}%</span>
                        <div className={m.probTrack}>
                          <div className={m.probFill} style={{ width: `${probability * 100}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={m.tileFoot}>Probability follows the stage, so it moves with the deal rather than with opinion.</div>
          </Card>

          {/* ---- top accounts by revenue ---- */}
          <Card padded className={m.span3}>
            <CardHeader title={<span className={m.cardTitle}><Package size={15} /> Top Accounts by Revenue</span>} subtitle={`${SALES_FY_LABEL} closed won`} />
            <HBarChart
              data={topAccounts.map((a) => ({ label: a.account, meta: `${a.market} · ${a.repName}`, value: a.valueUsd }))}
              color="var(--green)"
              valueFormat={fmtUsd}
            />
            <div className={m.tileFoot}>The six accounts carrying {Math.round((topAccounts.reduce((n, a) => n + a.valueUsd, 0) / fytdWonUsd) * 100)}% of the year&apos;s revenue.</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
