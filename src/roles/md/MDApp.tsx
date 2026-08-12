import m from './md.module.css'
import {
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
} from '../../lib/seed'
import { Card, CardHeader } from '../../components/ui/Card'
import { GaugeChart } from '../../components/charts/GaugeChart'
import { ColumnChart } from '../../components/charts/ColumnChart'
import { FunnelChart } from '../../components/charts/FunnelChart'
import { HBarChart } from '../../components/charts/HBarChart'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { fmtUsd, fmtUsdCompact } from '../../lib/format'
import { BarChart, Filter, ListChecks, LogOut, Package, Send, Star } from '../../components/icons'
import type { DealStage } from '../../lib/types'
import type { Theme } from '../../lib/useTheme'

const STAGE_LABEL: Record<DealStage, string> = {
  prospecting: 'Prospecting',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed won',
  closed_lost: 'Closed lost',
}

export function MDApp({ theme, onToggleTheme, onSignOut }: { theme: Theme; onToggleTheme: () => void; onSignOut: () => void }) {
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
          <div className={m.eyebrow}>Sales · {SALES_FY_LABEL}</div>
          <h1 className={m.title}>Export Sales Performance</h1>
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
