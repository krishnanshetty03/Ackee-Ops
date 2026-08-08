let reqSeq = 200
let routeSeq = 40
let shipSeq = 40
let excSeq = 10
let notifSeq = 0

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

export function fmtDayLabel(dateIso: string, todayIso: string): string {
  if (dateIso === todayIso) return 'Today'
  const tomorrow = new Date(todayIso)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateIso === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow'
  return new Date(dateIso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function todayIso(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

export function isoDaysFromNow(now: number, days: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
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
