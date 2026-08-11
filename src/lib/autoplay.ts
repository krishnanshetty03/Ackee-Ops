// Scripts the full farmer -> staff -> driver -> receiving loop by calling the
// same store actions a real user would trigger — so everything it does is
// visibly real: KPIs move, the map truck drives, chat threads update. It
// never reaches into component-local state (e.g. the Receiving sheet), only
// the shared store, which is what actually represents the system of record.
import { useTallawahStore } from '../store/useStore'
import { todayIso } from './format'

let cancelled = false
let running = false
let timers: ReturnType<typeof setTimeout>[] = []

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    const id = setTimeout(resolve, ms)
    timers.push(id)
  })
}

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function checkAlive() {
  if (cancelled) throw new Error('autoplay-cancelled')
}

async function waitUntil(predicate: () => boolean, timeoutMs = 40000, intervalMs = 350): Promise<boolean> {
  const start = Date.now()
  while (!predicate()) {
    checkAlive()
    if (Date.now() - start > timeoutMs) return false
    await sleep(intervalMs)
  }
  return true
}

export function isAutoplayRunning() {
  return running
}

export function stopAutoplay() {
  cancelled = true
  clearTimers()
  useTallawahStore.getState().setAutoplayRunning(false)
  useTallawahStore.getState().setSpotlight(null)
}

export async function startAutoplay() {
  if (running) return
  running = true
  cancelled = false
  const get = () => useTallawahStore.getState()
  get().setAutoplayRunning(true)

  try {
    await sequence(get)
  } catch {
    // cancelled mid-flight (or a stall) — fall through to cleanup
  } finally {
    running = false
    cancelled = false
    clearTimers()
    get().setAutoplayRunning(false)
    get().setSpotlight(null)
  }
}

const BAG_CHOICES = [8, 12, 15, 18, 22, 26]

async function sequence(get: () => ReturnType<typeof useTallawahStore.getState>) {
  get().setView('present')
  await sleep(400)

  // ---- 1. a farmer texts in a request ----
  const farmer = get().farmers[Math.floor(Math.random() * get().farmers.length)]
  get().setActiveFarmerId(farmer.id)
  get().setSpotlight({ view: 'present', note: `${farmer.name} is texting Tallawah on WhatsApp…` })
  checkAlive()
  get().startNewRequest(farmer.id)
  await sleep(1500)

  checkAlive()
  const bags = BAG_CHOICES[Math.floor(Math.random() * BAG_CHOICES.length)]
  get().chooseBags(farmer.id, bags)
  get().setSpotlight({ view: 'present', note: `${bags} bags ready — picking the nearest branch` })
  await sleep(1500)

  checkAlive()
  const branch = get().branches[Math.floor(Math.random() * get().branches.length)]
  get().chooseBranch(farmer.id, branch.id)
  get().setSpotlight({ view: 'present', note: `${branch.name} it is — choosing how to get them there` })
  await sleep(1500)

  checkAlive()
  get().choosePickupType(farmer.id, 'staff_pickup')
  get().setSpotlight({ view: 'present', note: 'Sharing farm location for pickup…' })
  await sleep(1500)

  checkAlive()
  get().shareLocation(farmer.id)
  await sleep(2300)

  const req = [...get().requests].filter((r) => r.farmerId === farmer.id && r.status === 'unassigned').sort((a, b) => b.createdAt - a.createdAt)[0]
  if (!req) return

  // ---- 2. staff sees it, builds a route, dispatches ----
  checkAlive()
  get().setStaffTab('intake')
  get().setSpotlight({ view: 'present', note: `Dispatch sees ${req.id} land in the intake queue` })
  await sleep(2000)

  checkAlive()
  get().toggleSelectedRequest(req.id)
  get().setStaffTab('dispatch')
  get().setSpotlight({ view: 'present', note: 'Building a route for it…' })
  await sleep(1800)

  const driver = get().drivers.find((d) => d.status === 'available')
  if (!driver) {
    get().clearSelectedRequests()
    return
  }
  checkAlive()
  const routeId = get().createRoute({ requestIds: [req.id], vehicleId: driver.vehicleId, driverId: driver.id, scheduledDate: todayIso(get().now) })
  await sleep(1300)

  checkAlive()
  get().dispatchRoute(routeId)
  get().setActiveDriverId(driver.id)
  get().setSpotlight({ view: 'present', note: `${driver.name} gets notified on their dashboard` })
  await sleep(2000)

  // ---- 3. driver runs the route ----
  checkAlive()
  get().setDriverTab('route')
  await sleep(1400)

  checkAlive()
  get().driverStartRoute(routeId)
  get().setSpotlight({ view: 'present', note: `${driver.name} is on the road` })
  await sleep(900)

  let shipment = get().shipments.find((s) => s.routeId === routeId)
  if (!shipment) return
  const shipmentId = shipment.id

  while (true) {
    checkAlive()
    shipment = get().shipments.find((s) => s.id === shipmentId)
    if (!shipment) return
    if (shipment.legIndex >= shipment.stops.length) break

    const stop = shipment.stops[shipment.legIndex]
    const arrived = await waitUntil(() => (get().shipments.find((s) => s.id === shipmentId)?.legProgress ?? 0) >= 0.97)
    if (!arrived) return

    checkAlive()
    get().driverMarkStopArrived(shipmentId, stop.requestId)
    get().setSpotlight({ view: 'present', note: `Arrived at ${stop.farmerName}'s farm` })
    await sleep(1000)

    checkAlive()
    const actual = Math.max(1, stop.estimatedBags + Math.round((Math.random() - 0.4) * 3))
    get().driverConfirmPickup(shipmentId, stop.requestId, actual, 'pass', 'unopened')
    get().setSpotlight({ view: 'present', note: `Collected ${actual} bags from ${stop.farmerName} — quality passed` })
    await sleep(1200)
  }

  const home = await waitUntil(() => (get().shipments.find((s) => s.id === shipmentId)?.legProgress ?? 0) >= 0.97)
  if (!home) return

  checkAlive()
  get().driverArriveFactory(shipmentId)
  get().setStaffTab('receiving')
  get().setSpotlight({ view: 'present', note: 'Back at the depot — receiving the load' })
  await sleep(2200)

  // ---- 4. staff receives the already-inspected load ----
  checkAlive()
  const finalShipment = get().shipments.find((s) => s.id === shipmentId)
  if (finalShipment) {
    get().staffReceiveShipment(finalShipment.id)
    get().setSpotlight({ view: 'present', note: 'Logged to stock. Loop complete.' })
  }
  await sleep(2600)

  checkAlive()
  get().setStaffTab('overview')
  get().setSpotlight(null)
}
