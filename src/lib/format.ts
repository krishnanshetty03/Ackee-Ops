let reqSeq = 200
let routeSeq = 40
let shipSeq = 40
let excSeq = 10
let notifSeq = 0
let noteSeq = 2
let taskSeq = 2

function maxSuffix(ids: string[], prefix: string): number {
  let max = 0
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue
    const n = parseInt(id.slice(prefix.length), 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max
}

/** These id counters live in memory only, so a page reload resets them to their seed
 *  defaults while the persisted entities they numbered stay put — the next id minted
 *  would then collide with one already on disk. Call this once right after hydrating
 *  persisted state so each counter resumes past whatever was actually saved. */
export function syncIdCounters(state: {
  requests: { id: string }[]
  routes: { id: string }[]
  shipments: { id: string }[]
  exceptions: { id: string }[]
  farmerNotes: { id: string }[]
  followUpTasks: { id: string }[]
}) {
  reqSeq = Math.max(reqSeq, maxSuffix(state.requests.map((r) => r.id), 'REQ-'))
  routeSeq = Math.max(routeSeq, maxSuffix(state.routes.map((r) => r.id), 'RT-'))
  shipSeq = Math.max(shipSeq, maxSuffix(state.shipments.map((s) => s.id), 'SHP-'))
  excSeq = Math.max(excSeq, maxSuffix(state.exceptions.map((e) => e.id), 'EXC-'))
  noteSeq = Math.max(noteSeq, maxSuffix(state.farmerNotes.map((n) => n.id), 'NOTE-'))
  taskSeq = Math.max(taskSeq, maxSuffix(state.followUpTasks.map((t) => t.id), 'TASK-'))
}

export function nextRequestId() {
  reqSeq += 1
  return `REQ-${reqSeq}`
}
export function nextRouteId() {
  routeSeq += 1
  return `RT-${String(routeSeq).padStart(3, '0')}`
}
export function nextShipmentId() {
  shipSeq += 1
  return `SHP-${String(shipSeq).padStart(3, '0')}`
}
export function nextExceptionId() {
  excSeq += 1
  return `EXC-${String(excSeq).padStart(3, '0')}`
}
export function nextStockId(farmerId: string) {
  return `STK-${farmerId}-${Math.random().toString(36).slice(2, 6)}`
}
export function nextNotifId() {
  notifSeq += 1
  return `ntf-${notifSeq}-${Date.now()}`
}
export function nextNoteId() {
  noteSeq += 1
  return `NOTE-${String(noteSeq).padStart(3, '0')}`
}
export function nextTaskId() {
  taskSeq += 1
  return `TASK-${String(taskSeq).padStart(3, '0')}`
}

export function fmtBags(n: number) {
  return `${n} ${n === 1 ? 'bag' : 'bags'}`
}

export function fmtRelativeTime(epochMs: number, now: number): string {
  const diff = Math.max(0, now - epochMs)
  const s = Math.floor(diff / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function fmtClock(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtDayLabel(dateIso: string, todayIsoStr: string): string {
  if (dateIso === todayIsoStr) return 'Today'
  if (dateIso === isoDaysFromNow(new Date(`${todayIsoStr}T12:00:00`).getTime(), 1)) return 'Tomorrow'
  return new Date(`${dateIso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Local calendar date, not UTC — toISOString() is UTC and silently shows the
// wrong day near midnight for any timezone ahead of UTC. "Today" for a
// dispatch/follow-up date should always mean the staff member's own local day.
export function todayIso(now: number): string {
  const d = new Date(now)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isoDaysFromNow(now: number, days: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() + days)
  return todayIso(d.getTime())
}

export function fmtCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'expired'
  const totalMin = Math.floor(msRemaining / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h >= 24) {
    const d = Math.floor(h / 24)
    const rh = h % 24
    return `${d}d ${rh}h left`
  }
  return `${h}h ${m}m left`
}
