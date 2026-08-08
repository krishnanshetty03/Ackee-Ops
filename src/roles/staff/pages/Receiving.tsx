import { useState } from 'react'
import s from '../staff.module.css'
import { PageHead, PageInner } from '../StaffShell'
import { useTallawahStore } from '../../../store/useStore'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Sheet } from '../../../components/ui/Sheet'
import { NumberStepper, RadioCards, Select } from '../../../components/ui/Field'
import { StatusBadge } from '../../../components/ui/Badge'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import { Check, CheckCircle, Factory, Package, X } from '../../../components/icons'
import { fmtBags, fmtClock, fmtCountdown } from '../../../lib/format'
import { selectFreshnessRemaining } from '../../../store/selectors'
import type { QualityResult } from '../../../lib/types'

interface Line {
  actualBags: number
  quality: QualityResult
  packaging: 'open' | 'unopened'
}

export function Receiving() {
  const shipments = useTallawahStore((st) => st.shipments)
  const drivers = useTallawahStore((st) => st.drivers)
  const stock = useTallawahStore((st) => st.stock)
  const now = useTallawahStore((st) => st.now)
  const staffReceiveShipment = useTallawahStore((st) => st.staffReceiveShipment)
  const { push } = useToast()

  const awaiting = shipments.filter((sh) => sh.status === 'arrived_factory').sort((a, b) => (a.arrivedFactoryAt ?? 0) - (b.arrivedFactoryAt ?? 0))
  const [openId, setOpenId] = useState<string | null>(null)
  const [lines, setLines] = useState<Record<string, Line>>({})

  const openShipment = shipments.find((sh) => sh.id === openId)
  const openDriver = openShipment ? drivers.find((d) => d.id === openShipment.driverId) : undefined

  function openReceiving(shipmentId: string) {
    const sh = shipments.find((x) => x.id === shipmentId)
    if (!sh) return
    const init: Record<string, Line> = {}
    sh.stops.forEach((stop) => {
      init[stop.requestId] = { actualBags: stop.actualBags ?? stop.estimatedBags, quality: 'pass', packaging: 'unopened' }
    })
    setLines(init)
    setOpenId(shipmentId)
  }

  function submit() {
    if (!openShipment) return
    const payload = openShipment.stops.map((stop) => ({
      requestId: stop.requestId,
      actualBags: lines[stop.requestId]?.actualBags ?? stop.estimatedBags,
      quality: lines[stop.requestId]?.quality ?? 'pass',
      packaging: lines[stop.requestId]?.packaging ?? 'unopened',
    }))
    staffReceiveShipment(openShipment.id, payload)
    const failCount = payload.filter((p) => p.quality === 'fail').length
    push({
      title: 'Shipment received',
      body: failCount > 0 ? `${payload.length - failCount} lines passed, ${failCount} flagged for quality` : `All ${payload.length} lines passed quality`,
      kind: 'receiving',
    })
    setOpenId(null)
  }

  const recentStock = [...stock].sort((a, b) => b.receivedAt - a.receivedAt).slice(0, 25)

  return (
    <PageInner>
      <PageHead title="Arrival & Receiving" desc="Close out a shipment once it reaches the depot, verify what actually came in, and convert it into stock." />

      <Card padded>
        <CardHeader title="Awaiting receiving" subtitle={`${awaiting.length} shipment${awaiting.length === 1 ? '' : 's'} at the gate`} />
        <div style={{ marginTop: 14 }}>
          {awaiting.length === 0 ? (
            <EmptyState icon={<Factory size={20} />} title="Yard is clear" desc="Shipments will appear here once a driver marks arrival at the depot." />
          ) : (
            <div className={s.arrivalGrid}>
              {awaiting.map((sh) => {
                const driver = drivers.find((d) => d.id === sh.driverId)
                const bags = sh.stops.reduce((sum, st) => sum + (st.actualBags ?? st.estimatedBags), 0)
                return (
                  <button key={sh.id} className={s.arrivalCard} onClick={() => openReceiving(sh.id)}>
                    <div className={s.arrivalTop}>
                      <span className={s.arrivalId}>{sh.id}</span>
                      <StatusBadge status="arrived_factory" label="At depot" />
                    </div>
                    <div className={s.arrivalMeta}>
                      {driver?.name} · {fmtBags(bags)} · {sh.stops.length} stops
                    </div>
                    <Button variant="dark" size="sm" icon={<Package size={13} />}>
                      Receive shipment
                    </Button>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Stock ledger" subtitle="Freshness clock starts the moment a line is received — 2 days if open, 4–5 if unopened" />
        {recentStock.length === 0 ? (
          <EmptyState icon={<CheckCircle size={20} />} title="No stock received yet" />
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Bags</th>
                  <th>Quality</th>
                  <th>Packaging</th>
                  <th>Received</th>
                  <th>Freshness</th>
                </tr>
              </thead>
              <tbody>
                {recentStock.map((e) => {
                  const remaining = selectFreshnessRemaining(now, e.receivedAt, e.freshnessHours)
                  const pct = Math.max(0, Math.min(1, remaining / (e.freshnessHours * 3600_000)))
                  const tone = pct > 0.5 ? 'var(--green)' : pct > 0.2 ? 'var(--gold-fill)' : 'var(--red)'
                  return (
                    <tr key={e.id}>
                      <td className={s.cellPrimary}>{e.farmerName}</td>
                      <td className={s.cellMono}>{e.bags}</td>
                      <td>
                        <StatusBadge status={e.quality} label={e.quality === 'pass' ? 'Passed' : 'Failed'} />
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{e.packaging}</td>
                      <td className={s.cellMeta}>{fmtClock(e.receivedAt)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={s.freshnessBar}>
                            <span className={s.freshnessFill} style={{ width: `${pct * 100}%`, background: tone }} />
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{fmtCountdown(remaining)}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Sheet
        open={!!openShipment}
        onClose={() => setOpenId(null)}
        title={openShipment?.id}
        subtitle={openDriver ? `${openDriver.name} · arrived ${openShipment?.arrivedFactoryAt ? fmtClock(openShipment.arrivedFactoryAt) : ''}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpenId(null)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<Check size={15} />} onClick={submit}>
              Confirm receiving
            </Button>
          </>
        }
      >
        {openShipment?.stops.map((stop) => {
          const line = lines[stop.requestId]
          if (!line) return null
          return (
            <div key={stop.requestId} className={s.receivingLine}>
              <div className={s.receivingLineHead}>
                <span className={s.receivingLineName}>{stop.farmerName}</span>
                <span className={s.receivingLineMeta}>Est. {fmtBags(stop.estimatedBags)}</span>
              </div>
              <div className={s.receivingLineRow}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5 }}>Actual bags</div>
                  <NumberStepper value={line.actualBags} onChange={(v) => setLines((prev) => ({ ...prev, [stop.requestId]: { ...prev[stop.requestId], actualBags: v } }))} min={0} max={200} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5 }}>Packaging</div>
                  <Select
                    value={line.packaging}
                    onChange={(e) => setLines((prev) => ({ ...prev, [stop.requestId]: { ...prev[stop.requestId], packaging: e.target.value as 'open' | 'unopened' } }))}
                    style={{ width: 140 }}
                  >
                    <option value="unopened">Unopened (4–5 days)</option>
                    <option value="open">Open (2 days)</option>
                  </Select>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5 }}>Quality check</div>
                <RadioCards
                  value={line.quality}
                  onChange={(v) => setLines((prev) => ({ ...prev, [stop.requestId]: { ...prev[stop.requestId], quality: v } }))}
                  options={[
                    { value: 'pass', title: 'Pass', desc: 'Goes to good stock', icon: <Check size={13} />, tone: 'green' },
                    { value: 'fail', title: 'Fail', desc: 'Flagged, not added to stock', icon: <X size={13} />, tone: 'red' },
                  ]}
                />
              </div>
            </div>
          )
        })}
      </Sheet>
    </PageInner>
  )
}
