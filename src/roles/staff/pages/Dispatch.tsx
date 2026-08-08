import { useMemo, useState } from 'react'
import s from '../staff.module.css'
import { PageHead, PageInner } from '../StaffShell'
import { useTallawahStore } from '../../../store/useStore'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Checkbox, FieldGroup, Select } from '../../../components/ui/Field'
import { CapacityMeter } from '../../../components/ui/CapacityMeter'
import { StatusBadge } from '../../../components/ui/Badge'
import { Avatar } from '../../../components/ui/Avatar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import { AlertTriangle, CheckCircle, MapPin, Route as RouteIcon, Send, X } from '../../../components/icons'
import { fmtBags, fmtDayLabel, isoDaysFromNow, todayIso } from '../../../lib/format'
import { VEHICLE_CAPACITY } from '../../../lib/types'

export function Dispatch() {
  const requests = useTallawahStore((st) => st.requests)
  const drivers = useTallawahStore((st) => st.drivers)
  const vehicles = useTallawahStore((st) => st.vehicles)
  const routes = useTallawahStore((st) => st.routes)
  const now = useTallawahStore((st) => st.now)
  const selectedIds = useTallawahStore((st) => st.selectedRequestIds)
  const toggleSelected = useTallawahStore((st) => st.toggleSelectedRequest)
  const clearSelected = useTallawahStore((st) => st.clearSelectedRequests)
  const createRoute = useTallawahStore((st) => st.createRoute)
  const dispatchRoute = useTallawahStore((st) => st.dispatchRoute)
  const { push } = useToast()

  const today = todayIso(now)
  const [driverId, setDriverId] = useState('')
  const [date, setDate] = useState(today)

  const unassigned = requests.filter((r) => r.status === 'unassigned').sort((a, b) => a.createdAt - b.createdAt)
  const selectedRequests = requests.filter((r) => selectedIds.includes(r.id))
  const totalBags = selectedRequests.reduce((sum, r) => sum + r.estimatedBags, 0)
  const availableDrivers = drivers.filter((d) => d.status === 'available')

  const chosenDriver = drivers.find((d) => d.id === driverId)
  const chosenVehicle = vehicles.find((v) => v.id === chosenDriver?.vehicleId)
  const overCapacity = totalBags > VEHICLE_CAPACITY
  const canCreate = selectedRequests.length > 0 && !!driverId && !overCapacity

  const sortedRoutes = useMemo(() => [...routes].sort((a, b) => b.createdAt - a.createdAt), [routes])

  function handleCreate() {
    if (!canCreate || !chosenDriver) return
    const id = createRoute({ requestIds: selectedIds, vehicleId: chosenDriver.vehicleId, driverId: chosenDriver.id, scheduledDate: date })
    clearSelected()
    setDriverId('')
    push({ title: 'Route created', body: `${id} · ${fmtBags(totalBags)} · ${chosenDriver.name}`, kind: 'route' })
  }

  function handleDispatch(routeId: string, driverName: string) {
    dispatchRoute(routeId)
    push({ title: 'Route dispatched', body: `${driverName} was notified on their dashboard`, kind: 'route' })
  }

  return (
    <PageInner>
      <PageHead
        title="Dispatch & Shipment Planning"
        desc="Group pending requests into a route that fits real fleet capacity, then assign a vehicle and driver."
      />

      <div className={s.twoCol} style={{ gridTemplateColumns: '1fr 380px' }}>
        <Card>
          <CardHeader title="Unassigned requests" subtitle={`${unassigned.length} waiting · tap to add to the route you're building`} />
          {unassigned.length === 0 ? (
            <EmptyState icon={<CheckCircle size={20} />} title="Queue is clear" desc="Every request has already been routed." />
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ width: 34 }}></th>
                    <th>Farmer</th>
                    <th>Location</th>
                    <th>Bags</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {unassigned.map((r) => (
                    <tr key={r.id} className={selectedIds.includes(r.id) ? s.selected : ''}>
                      <td>
                        <Checkbox checked={selectedIds.includes(r.id)} onChange={() => toggleSelected(r.id)} />
                      </td>
                      <td>
                        <div className={s.cellPrimary}>{r.farmerName}</div>
                        <div className={s.cellMeta}>{r.id}</div>
                      </td>
                      <td>
                        <div className={s.locCell}>
                          <MapPin size={13} />
                          {r.location.community}
                        </div>
                      </td>
                      <td className={s.cellMono}>{fmtBags(r.estimatedBags)}</td>
                      <td>{r.requestType === 'staff_pickup' ? 'Team pickup' : 'Self-drop'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card padded>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5, marginBottom: 14 }}>Build route</div>

          {selectedRequests.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '10px 0 16px' }}>Select requests from the left to start a route.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
              {selectedRequests.map((r) => (
                <div
                  key={r.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '7px 9px' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{r.farmerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtBags(r.estimatedBags)} · {r.location.community}</div>
                  </div>
                  <button className={s.miniIconBtn} onClick={() => toggleSelected(r.id)} aria-label="Remove">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <CapacityMeter
              value={totalBags}
              ceiling={VEHICLE_CAPACITY}
              label="This route"
              caption={overCapacity ? `${totalBags - VEHICLE_CAPACITY} bags over one vehicle's 120-bag capacity — split into two routes.` : undefined}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FieldGroup label="Vehicle & driver" hint={`${availableDrivers.length} available`}>
              <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">Choose a driver…</option>
                {availableDrivers.map((d) => {
                  const v = vehicles.find((veh) => veh.id === d.vehicleId)
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} — {v?.plate}
                    </option>
                  )
                })}
              </Select>
            </FieldGroup>
            {chosenDriver && chosenVehicle && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Avatar initials={chosenDriver.initials} hue={chosenDriver.avatarHue} size="sm" />
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {chosenVehicle.model} · {chosenVehicle.plate} · {VEHICLE_CAPACITY}-bag capacity
                </div>
              </div>
            )}
            <FieldGroup label="Scheduled date">
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { label: 'Today', v: today },
                  { label: 'Tomorrow', v: isoDaysFromNow(now, 1) },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setDate(opt.v)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      border: `1.5px solid ${date === opt.v ? 'var(--gold)' : 'var(--border-strong)'}`,
                      background: date === opt.v ? 'var(--gold-soft)' : 'var(--surface)',
                      color: 'var(--text)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ flex: 1, border: '1.5px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '0 8px', fontSize: 12, color: 'var(--text)', background: 'var(--surface)' }}
                />
              </div>
            </FieldGroup>
          </div>

          <Button variant="primary" block style={{ marginTop: 18 }} disabled={!canCreate} icon={<RouteIcon size={15} />} onClick={handleCreate}>
            Create route{selectedRequests.length > 0 ? ` · ${fmtBags(totalBags)}` : ''}
          </Button>
        </Card>
      </div>

      <Card>
        <CardHeader title="Routes" subtitle={`${sortedRoutes.length} total`} />
        {sortedRoutes.length === 0 ? (
          <EmptyState icon={<RouteIcon size={20} />} title="No routes yet" desc="Routes you create will appear here, ready to dispatch." />
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Stops</th>
                  <th>Bags</th>
                  <th>Driver</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedRoutes.map((route) => {
                  const driver = drivers.find((d) => d.id === route.driverId)
                  const vehicle = vehicles.find((v) => v.id === route.vehicleId)
                  const overFleetForRoute = route.totalEstimatedBags > VEHICLE_CAPACITY
                  return (
                    <tr key={route.id}>
                      <td className={s.cellPrimary}>{route.id}</td>
                      <td className={s.cellMono}>{route.requestIds.length}</td>
                      <td className={s.cellMono}>
                        {route.totalEstimatedBags}
                        {overFleetForRoute && <AlertTriangle size={12} style={{ marginLeft: 5, color: 'var(--red)', display: 'inline', verticalAlign: -1 }} />}
                      </td>
                      <td>
                        <div className={s.cellPrimary}>{driver?.name}</div>
                        <div className={s.cellMeta}>{vehicle?.plate}</div>
                      </td>
                      <td>{fmtDayLabel(route.scheduledDate, today)}</td>
                      <td>
                        <StatusBadge status={route.status} />
                      </td>
                      <td>
                        {route.status === 'planned' && driver && (
                          <Button size="sm" variant="primary" icon={<Send size={13} />} onClick={() => handleDispatch(route.id, driver.name)}>
                            Dispatch
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageInner>
  )
}
