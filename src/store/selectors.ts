import { FARMER_QUIET_DAYS, FLEET_CAPACITY, FLEET_SIZE } from '../lib/types'
import type { FarmerHealth } from '../lib/types'
import { todayIso } from '../lib/format'
import type { Store } from './useStore'

export { todayIso }

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

/** MD Overview — top-of-funnel volume: what farmers are reporting ready, not
 *  what's booked onto a vehicle (that's selectCapacityKpis) or in stock. */
export function selectBagIntakeKpis(s: Store) {
  const today = todayIso(s.now)
  const weekMs = 7 * 24 * 3600_000
  const todayBags = s.requests.filter((r) => todayIso(r.createdAt) === today).reduce((sum, r) => sum + r.estimatedBags, 0)
  const weekBags = s.requests.filter((r) => s.now - r.createdAt <= weekMs).reduce((sum, r) => sum + r.estimatedBags, 0)
  return { todayBags, weekBags }
}

/** MD Overview — farmer base health + ops throughput. "New" is relative to the
 *  roster's own most-recent join date rather than wall-clock "today", since a
 *  fixed recency window would silently decay to zero as real time passes
 *  while the seeded join dates stay fixed. */
export function selectFarmerActivityKpis(s: Store) {
  const activeCount = s.farmers.length - selectQuietFarmers(s).length
  const joinTimes = s.farmers.map((f) => new Date(`${f.memberSince}T00:00:00`).getTime())
  const newestJoin = Math.max(...joinTimes)
  const newSignups = joinTimes.filter((t) => newestJoin - t <= 120 * 24 * 3600_000).length
  const weekMs = 7 * 24 * 3600_000
  const requestsThisWeek = s.requests.filter((r) => s.now - r.createdAt <= weekMs).length
  return { totalFarmers: s.farmers.length, activeCount, newSignups, requestsThisWeek }
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

/** Driver's own performance, for their home dashboard — scanned directly off
 *  completed stops across every shipment they've run (active, awaiting
 *  receiving, or already received), not gated to closed-out history only, so
 *  today's in-progress work counts immediately rather than after handoff. */
export function selectDriverPerformanceKpis(s: Store, driverId: string) {
  const weekMs = 7 * 24 * 3600_000
  let weekStops = 0
  let weekBags = 0
  let lifetimeStops = 0
  let lifetimeBags = 0
  let pass = 0
  let fail = 0

  for (const sh of s.shipments) {
    if (sh.driverId !== driverId) continue
    for (const stop of sh.stops) {
      if (stop.status !== 'completed' || !stop.completedAt) continue
      const bags = stop.actualBags ?? 0
      lifetimeStops += 1
      lifetimeBags += bags
      if (s.now - stop.completedAt <= weekMs) {
        weekStops += 1
        weekBags += bags
      }
      if (stop.quality === 'pass') pass += 1
      else if (stop.quality === 'fail') fail += 1
    }
  }

  const graded = pass + fail
  return {
    weekStops,
    weekBags,
    lifetimeStops,
    lifetimeBags,
    avgBagsPerStop: lifetimeStops === 0 ? 0 : Math.round(lifetimeBags / lifetimeStops),
    qualityPassRate: graded === 0 ? null : pass / graded,
  }
}

// ==================== FARMER CRM ====================

export interface FarmerTimelineEvent {
  id: string
  at: number
  kind: 'request' | 'collected' | 'received' | 'exception'
  title: string
  desc: string
  tone: 'gold' | 'green' | 'red'
}

/** A single chronological relationship history per farmer, merged from every
 * business record that mentions them (requests, pickups, receiving, exceptions).
 * Deliberately excludes raw WhatsApp chat — that's shown separately as its own
 * conversational panel so this stays scannable as "what happened," not "what was said." */
export function selectFarmerTimeline(s: Store, farmerId: string): FarmerTimelineEvent[] {
  const events: FarmerTimelineEvent[] = []

  for (const r of s.requests) {
    if (r.farmerId !== farmerId) continue
    events.push({
      id: `req-${r.id}`,
      at: r.createdAt,
      kind: 'request',
      title: `Request ${r.id} sent`,
      desc: `${r.estimatedBags} bags · ${r.requestType === 'staff_pickup' ? 'team pickup' : 'self-drop'}`,
      tone: 'gold',
    })
  }

  for (const sh of s.shipments) {
    for (const stop of sh.stops) {
      if (stop.farmerId !== farmerId || stop.status !== 'completed' || !stop.completedAt) continue
      events.push({
        id: `stop-${sh.id}-${stop.requestId}`,
        at: stop.completedAt,
        kind: 'collected',
        title: 'Collected by driver',
        desc: `${stop.actualBags ?? stop.estimatedBags} bags · ${sh.id}`,
        tone: 'green',
      })
    }
  }

  for (const e of s.stock) {
    if (e.farmerId !== farmerId) continue
    events.push({
      id: `stk-${e.id}`,
      at: e.receivedAt,
      kind: 'received',
      title: e.quality === 'pass' ? 'Received — quality passed' : 'Received — quality failed',
      desc: `${e.bags} bags · ${e.packaging}`,
      tone: e.quality === 'pass' ? 'green' : 'red',
    })
  }

  for (const exc of s.exceptions) {
    let belongs = false
    if (exc.relatedType === 'request') {
      belongs = s.requests.find((r) => r.id === exc.relatedId)?.farmerId === farmerId
    } else if (exc.relatedType === 'shipment') {
      belongs = !!s.shipments.find((sh) => sh.id === exc.relatedId)?.stops.some((st) => st.farmerId === farmerId)
    }
    if (!belongs) continue
    events.push({ id: `exc-${exc.id}`, at: exc.createdAt, kind: 'exception', title: 'Exception flagged', desc: exc.note, tone: 'red' })
  }

  return events.sort((a, b) => b.at - a.at)
}

export interface FarmerStats {
  lifetimeBags: number
  totalRequests: number
  qualityPassRate: number | null
  avgTurnaroundMs: number | null
  lastActivityAt: number | null
}

export function selectFarmerStats(s: Store, farmerId: string): FarmerStats {
  const myStock = s.stock.filter((e) => e.farmerId === farmerId)
  const pass = myStock.filter((e) => e.quality === 'pass')
  const fail = myStock.filter((e) => e.quality === 'fail').length
  const totalGraded = pass.length + fail

  const turnarounds: number[] = []
  for (const sh of s.shipments) {
    for (const stop of sh.stops) {
      if (stop.farmerId !== farmerId || stop.status !== 'completed' || !stop.completedAt) continue
      const req = s.requests.find((r) => r.id === stop.requestId)
      if (req) turnarounds.push(stop.completedAt - req.createdAt)
    }
  }

  const timeline = selectFarmerTimeline(s, farmerId)
  const lastFarmerMessage = (s.chat[farmerId] ?? []).filter((m) => m.from === 'farmer').reduce((max, m) => Math.max(max, m.createdAt), 0)
  const lastActivityAt = Math.max(timeline[0]?.at ?? 0, lastFarmerMessage) || null

  return {
    lifetimeBags: pass.reduce((sum, e) => sum + e.bags, 0),
    totalRequests: s.requests.filter((r) => r.farmerId === farmerId).length,
    qualityPassRate: totalGraded === 0 ? null : pass.length / totalGraded,
    avgTurnaroundMs: turnarounds.length === 0 ? null : turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length,
    lastActivityAt,
  }
}

export function selectFarmerHealth(s: Store, farmerId: string): FarmerHealth {
  const { lastActivityAt } = selectFarmerStats(s, farmerId)
  if (!lastActivityAt) return 'quiet'
  const daysSince = (s.now - lastActivityAt) / (24 * 3600_000)
  return daysSince > FARMER_QUIET_DAYS ? 'quiet' : 'active'
}

export function selectQuietFarmers(s: Store) {
  return s.farmers.filter((f) => selectFarmerHealth(s, f.id) === 'quiet')
}

export function selectFarmerNotes(s: Store, farmerId: string) {
  return s.farmerNotes.filter((n) => n.farmerId === farmerId).sort((a, b) => b.createdAt - a.createdAt)
}

export function selectFarmerFollowUps(s: Store, farmerId: string) {
  return s.followUpTasks.filter((t) => t.farmerId === farmerId).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function selectOpenFollowUps(s: Store) {
  return s.followUpTasks.filter((t) => !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function selectOverdueFollowUpCount(s: Store) {
  const today = todayIso(s.now)
  return s.followUpTasks.filter((t) => !t.done && t.dueDate < today).length
}
