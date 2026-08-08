import { FLEET_CAPACITY, FLEET_SIZE } from '../lib/types'
import type { Store } from './useStore'

export function todayIso(now: number) {
  return new Date(now).toISOString().slice(0, 10)
}

/** Stage 1 — Order Intake: queue health */
export function selectIntakeKpis(s: Store) {
  const unassigned = s.requests.filter((r) => r.status === 'unassigned')
  const flagged = s.requests.filter((r) => r.status === 'flagged')
  return {
    pendingCount: unassigned.length,
    pendingBags: unassigned.reduce((sum, r) => sum + r.estimatedBags, 0),
    flaggedCount: flagged.length,
  }
}

/** Stage 2 — Dispatch: today's total requested bags vs the 5x120 fleet ceiling */
export function selectCapacityKpis(s: Store) {
  const today = todayIso(s.now)
  // "a day's total requested bags" — everything logged today, still on the books
  // (fulfilled bags already left the ceiling and freed capacity back up).
  const demand = s.requests
    .filter((r) => todayIso(r.createdAt) === today && r.status !== 'fulfilled')
    .reduce((sum, r) => sum + r.estimatedBags, 0)
  return {
    demand,
    ceiling: FLEET_CAPACITY,
    fleetSize: FLEET_SIZE,
    pct: Math.min(1, demand / FLEET_CAPACITY),
    overCapacity: demand > FLEET_CAPACITY,
  }
}

/** Stage 3 — In-transit: what's out right now */
export function selectTrackingKpis(s: Store) {
  const active = s.shipments.filter((sh) => sh.status === 'active')
  const bagsCollectedToday = active.reduce(
    (sum, sh) => sum + sh.stops.filter((st) => st.status === 'completed').reduce((a, st) => a + (st.actualBags ?? 0), 0),
    0,
  )
  const bagsRemaining = active.reduce(
    (sum, sh) => sum + sh.stops.filter((st) => st.status !== 'completed').reduce((a, st) => a + st.estimatedBags, 0),
    0,
  )
  return {
    vehiclesOut: active.length,
    fleetSize: FLEET_SIZE,
    bagsCollectedToday,
    bagsRemaining,
  }
}

/** Stage 4 — Arrival & Receiving: what's waiting, what's fresh */
export function selectReceivingKpis(s: Store) {
  const awaiting = s.shipments.filter((sh) => sh.status === 'arrived_factory')
  const pass = s.stock.filter((e) => e.quality === 'pass').length
  const fail = s.stock.filter((e) => e.quality === 'fail').length
  const total = pass + fail
  return {
    awaitingCount: awaiting.length,
    awaitingBags: awaiting.reduce((sum, sh) => sum + sh.stops.reduce((a, st) => a + (st.actualBags ?? st.estimatedBags), 0), 0),
    qualityPassRate: total === 0 ? 1 : pass / total,
    stockOnHandBags: s.stock.reduce((sum, e) => sum + e.bags, 0),
  }
}

/** Stage 5 — Exceptions: nothing unresolved */
export function selectExceptionKpis(s: Store) {
  const open = s.exceptions.filter((e) => e.status === 'open')
  return { openCount: open.length }
}

/** Average time from request created to collected (fulfilled), for today's fulfilled requests */
export function selectAvgTurnaroundMs(s: Store): number | null {
  const today = todayIso(s.now)
  const samples: number[] = []
  for (const sh of s.shipments) {
    for (const st of sh.stops) {
      if (st.status !== 'completed' || !st.completedAt) continue
      const req = s.requests.find((r) => r.id === st.requestId)
      if (!req || todayIso(req.createdAt) !== today) continue
      samples.push(st.completedAt - req.createdAt)
    }
  }
  if (samples.length === 0) return null
  return samples.reduce((a, b) => a + b, 0) / samples.length
}

export function selectFreshnessRemaining(now: number, receivedAt: number, freshnessHours: number) {
  const expiresAt = receivedAt + freshnessHours * 3600_000
  return expiresAt - now
}

export function selectUnreadStaffNotifications(s: Store) {
  return s.notifications.filter((n) => n.audience === 'staff' && !n.read).length
}

export function selectUnreadDriverNotifications(s: Store, driverId: string) {
  return s.notifications.filter((n) => n.audience === 'driver' && n.driverId === driverId && !n.read).length
}

export function selectDriverActiveShipment(s: Store, driverId: string) {
  return s.shipments.find((sh) => sh.driverId === driverId && (sh.status === 'active' || sh.status === 'arrived_factory'))
}

export function selectDriverPendingRoute(s: Store, driverId: string) {
  return s.routes.find((r) => r.driverId === driverId && r.status === 'dispatched' && !s.shipments.some((sh) => sh.routeId === r.id))
}

export function selectDriverHistory(s: Store, driverId: string) {
  return s.shipments.filter((sh) => sh.driverId === driverId && sh.status === 'received').sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))
}
