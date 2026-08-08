import { create } from 'zustand'
import type {
  AppNotification,
  AppView,
  ChatMessage,
  ChatStage,
  Driver,
  ExceptionItem,
  ExceptionType,
  Farmer,
  FarmerRequest,
  GeoPoint,
  QualityResult,
  Route,
  Shipment,
  ShipmentStop,
  Spotlight,
  StaffMember,
  StockEntry,
  DriverTab,
  StaffTab,
  RequestType,
  Vehicle,
} from '../lib/types'
import { DRIVERS, FARMERS, STAFF_USER, VEHICLES, buildSeed, locationFor } from '../lib/seed'
import {
  nextExceptionId,
  nextNotifId,
  nextRequestId,
  nextRouteId,
  nextShipmentId,
  nextStockId,
} from '../lib/format'
import { FACTORY } from '../lib/geo'
import { loadPersisted, persistAndBroadcast, resetPersisted, subscribeRemote } from '../lib/sync'
import { bagQuickReplyOptions, copy, dropoffTimingOptions, pickupTypeOptions, statusEmoji, statusLabel } from '../lib/chatCopy'

const PERSIST_VERSION = 3

interface DataSlice {
  version: number
  farmers: Farmer[]
  drivers: Driver[]
  vehicles: Vehicle[]
  staff: StaffMember
  requests: FarmerRequest[]
  routes: Route[]
  shipments: Shipment[]
  stock: StockEntry[]
  exceptions: ExceptionItem[]
  notifications: AppNotification[]
  chat: Record<string, ChatMessage[]>
  chatStage: Record<string, ChatStage>
  now: number
}

interface UISlice {
  view: AppView
  activeFarmerId: string
  activeDriverId: string
  staffTab: StaffTab
  driverTab: DriverTab
  spotlight: Spotlight | null
  autoplayRunning: boolean
  selectedRequestIds: string[]
  focusShipmentId: string | null
  staffAuthed: boolean
  driverAuthed: boolean
}

function msg(farmerId: string, partial: Omit<ChatMessage, 'id' | 'farmerId' | 'createdAt'>): ChatMessage {
  return { id: `msg-${Math.random().toString(36).slice(2, 9)}`, farmerId, createdAt: Date.now(), ...partial }
}

function pushChat(chat: Record<string, ChatMessage[]>, farmerId: string, ...items: ChatMessage[]) {
  return { ...chat, [farmerId]: [...(chat[farmerId] ?? []), ...items] }
}

function notify(partial: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
  return { id: nextNotifId(), createdAt: Date.now(), read: false, ...partial }
}

function waypointsFor(shipment: Pick<Shipment, 'stops'>): GeoPoint[] {
  return [FACTORY, ...shipment.stops.map((s) => s.location), FACTORY]
}

function randomLegDuration(isReturn = false) {
  return isReturn ? 15000 + Math.random() * 8000 : 12000 + Math.random() * 9000
}

type Actions = {
  // ---- farmer chat ----
  startNewRequest: (farmerId: string) => void
  chooseBags: (farmerId: string, bags: number) => void
  choosePickupType: (farmerId: string, type: RequestType) => void
  chooseDropoffTiming: (farmerId: string, timing: string) => void
  shareLocation: (farmerId: string) => void
  sendFreeText: (farmerId: string, text: string) => void
  showMyRequests: (farmerId: string) => void

  // ---- staff: dispatch ----
  createRoute: (input: { requestIds: string[]; vehicleId: string; driverId: string; scheduledDate: string }) => string
  dispatchRoute: (routeId: string) => void

  // ---- driver ----
  driverStartRoute: (routeId: string) => void
  driverMarkStopArrived: (shipmentId: string, requestId: string) => void
  driverConfirmPickup: (shipmentId: string, requestId: string, actualBags: number) => void
  driverArriveFactory: (shipmentId: string) => void

  // ---- staff: receiving ----
  staffReceiveShipment: (
    shipmentId: string,
    lines: { requestId: string; actualBags: number; quality: QualityResult; packaging: 'open' | 'unopened' }[],
  ) => void

  // ---- exceptions ----
  flagException: (input: { relatedType: 'request' | 'route' | 'shipment'; relatedId: string; type: ExceptionType; note: string }) => void
  resolveException: (exceptionId: string, rescheduledDate?: string) => void

  // ---- notifications ----
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (audience: 'staff' | 'driver', driverId?: string) => void

  // ---- driver self-service ----
  toggleDriverAvailability: (driverId: string) => void

  // ---- ui ----
  setView: (v: AppView) => void
  setStaffTab: (t: StaffTab) => void
  setDriverTab: (t: DriverTab) => void
  setActiveFarmerId: (id: string) => void
  setActiveDriverId: (id: string) => void
  setSpotlight: (s: Spotlight | null) => void
  setAutoplayRunning: (b: boolean) => void
  toggleSelectedRequest: (id: string) => void
  clearSelectedRequests: () => void
  setFocusShipment: (id: string | null) => void

  // ---- demo auth (local-only; no backend) ----
  loginStaff: () => void
  loginDriver: () => void
  logoutStaff: () => void
  logoutDriver: () => void

  // ---- lifecycle ----
  tick: () => void
  resetDemo: () => void
  _applyRemote: (state: DataSlice) => void
  /** internal: shared tail of the chat flow once bags+type(+location/timing) are known */
  _finalizeRequest: (farmerId: string, bags: number, type: RequestType, location?: FarmerRequest['location'], dropoffTiming?: string) => void
}

export type Store = DataSlice & UISlice & Actions

function freshState(): DataSlice {
  const seed = buildSeed()
  return {
    version: PERSIST_VERSION,
    farmers: FARMERS,
    drivers: DRIVERS,
    vehicles: VEHICLES,
    staff: STAFF_USER,
    requests: seed.requests,
    routes: seed.routes,
    shipments: seed.shipments,
    stock: seed.stock,
    exceptions: seed.exceptions,
    notifications: [
      notify({ audience: 'staff', kind: 'exception', title: 'Exception flagged', body: 'Abena Osei — farmer not ready (EXC-004)' }),
      notify({ audience: 'staff', kind: 'shipment', title: 'Shipment dispatched', body: 'SHP-041 heading out with Yaw Boakye' }),
    ],
    chat: {},
    chatStage: {},
    now: Date.now(),
  }
}

function initialUI(): UISlice {
  return {
    view: 'home',
    activeFarmerId: FARMERS[0].id,
    activeDriverId: DRIVERS[1].id, // DR-2 already has the seeded active shipment
    staffTab: 'overview',
    driverTab: 'home',
    spotlight: null,
    autoplayRunning: false,
    selectedRequestIds: [],
    focusShipmentId: 'SHP-041',
    staffAuthed: false,
    driverAuthed: false,
  }
}

function hydrate(): DataSlice {
  const persisted = loadPersisted<DataSlice>()
  if (persisted && persisted.version === PERSIST_VERSION) return persisted
  return freshState()
}

export const useTallawahStore = create<Store>((set, get) => ({
  ...hydrate(),
  ...initialUI(),

  // ================= FARMER CHAT =================
  startNewRequest: (farmerId) =>
    set((s) => {
      const farmer = s.farmers.find((f) => f.id === farmerId)!
      const already = s.chat[farmerId]?.length ?? 0
      const welcome = already === 0 ? [msg(farmerId, { from: 'bot', kind: 'text', text: copy.welcome(farmer.name) })] : []
      const ask = msg(farmerId, { from: 'bot', kind: 'quick_replies', text: copy.askBags(farmer.name), options: bagQuickReplyOptions() })
      return {
        chat: pushChat(s.chat, farmerId, ...welcome, ask),
        chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_bags' } },
      }
    }),

  chooseBags: (farmerId, bags) =>
    set((s) => {
      const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text: String(bags) })
      const botMsg = msg(farmerId, {
        from: 'bot',
        kind: 'quick_replies',
        text: copy.bagsNoted(bags),
        options: pickupTypeOptions(),
      })
      return {
        chat: pushChat(s.chat, farmerId, farmerMsg, botMsg),
        chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_type', bags } },
      }
    }),

  choosePickupType: (farmerId, type) =>
    set((s) => {
      const stage = s.chatStage[farmerId]
      if (!stage || stage.step !== 'awaiting_type') return {}
      const label = type === 'staff_pickup' ? '🚚 Team Pickup' : '🏭 I’ll Self-Drop'
      const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text: label })
      if (type === 'staff_pickup') {
        const botMsg = msg(farmerId, { from: 'bot', kind: 'location_request', text: copy.askLocation() })
        return {
          chat: pushChat(s.chat, farmerId, farmerMsg, botMsg),
          chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_location', bags: stage.bags, type } },
        }
      }
      const botMsg = msg(farmerId, {
        from: 'bot',
        kind: 'quick_replies',
        text: copy.askDropoffTiming(),
        options: dropoffTimingOptions(),
      })
      return {
        chat: pushChat(s.chat, farmerId, farmerMsg, botMsg),
        chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_dropoff_timing', bags: stage.bags, type } },
      }
    }),

  shareLocation: (farmerId) => {
    const s0 = get()
    const stage = s0.chatStage[farmerId]
    if (!stage || stage.step !== 'awaiting_location') return
    const farmer = s0.farmers.find((f) => f.id === farmerId)!
    const location = locationFor(farmer, '')
    const locMsg = msg(farmerId, { from: 'farmer', kind: 'location_share', location })
    const ackMsg = msg(farmerId, { from: 'bot', kind: 'text', text: copy.locationReceived() })
    set((s) => ({ chat: pushChat(s.chat, farmerId, locMsg, ackMsg) }))
    setTimeout(() => get()._finalizeRequest(farmerId, stage.bags, stage.type, location), 700)
  },

  chooseDropoffTiming: (farmerId, timing) => {
    const s0 = get()
    const stage = s0.chatStage[farmerId]
    if (!stage || stage.step !== 'awaiting_dropoff_timing') return
    const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text: timing })
    set((s) => ({ chat: pushChat(s.chat, farmerId, farmerMsg) }))
    get()._finalizeRequest(farmerId, stage.bags, stage.type, undefined, timing)
  },

  sendFreeText: (farmerId, rawText) => {
    const text = rawText.trim()
    if (!text) return
    const s0 = get()
    const stage = s0.chatStage[farmerId] ?? { step: 'idle' }
    const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text })
    set((s) => ({ chat: pushChat(s.chat, farmerId, farmerMsg) }))

    if (stage.step === 'awaiting_bags') {
      const n = parseInt(text.replace(/[^\d]/g, ''), 10)
      if (Number.isFinite(n) && n > 0) {
        get().chooseBags(farmerId, n)
      } else {
        set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: copy.clarifyBags() })) }))
      }
      return
    }
    if (stage.step === 'awaiting_type') {
      const lower = text.toLowerCase()
      if (/(team|staff|pick ?up|come|collect)/.test(lower)) return get().choosePickupType(farmerId, 'staff_pickup')
      if (/(self|drop|bring|myself)/.test(lower)) return get().choosePickupType(farmerId, 'self_drop')
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: copy.clarifyType() })) }))
      return
    }
    if (stage.step === 'awaiting_location') {
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: copy.nudgeLocationButton() })) }))
      return
    }
    if (stage.step === 'awaiting_dropoff_timing') {
      const lower = text.toLowerCase()
      if (/today/.test(lower)) return get().chooseDropoffTiming(farmerId, 'Today')
      if (/tomorrow/.test(lower)) return get().chooseDropoffTiming(farmerId, 'Tomorrow')
      if (/week/.test(lower)) return get().chooseDropoffTiming(farmerId, 'This week')
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: copy.clarifyTiming() })) }))
      return
    }
    // idle
    if (/(ackee|ready|bags?|pickup|pick ?up)/i.test(text)) {
      get().startNewRequest(farmerId)
    } else if (/(my request|status|order)/i.test(text)) {
      get().showMyRequests(farmerId)
    } else {
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: copy.fallback() })) }))
    }
  },

  _finalizeRequest: (farmerId, bags, type, location, dropoffTiming) => {
    const s = get()
    const farmer = s.farmers.find((f) => f.id === farmerId)!
    const id = nextRequestId()
    const loc = location ?? { ...FACTORY, label: `${farmer.name.split(' ')[0]} — self-drop`, community: farmer.community }
    const request: FarmerRequest = {
      id,
      farmerId,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      location: loc,
      estimatedBags: bags,
      requestType: type,
      status: 'unassigned',
      createdAt: Date.now(),
    }
    const cardMsg = msg(farmerId, {
      from: 'bot',
      kind: 'request_card',
      text: copy.requestConfirmed(id),
      requestSummary: { requestId: id, bags, type, status: 'unassigned', dropoffTiming },
    })
    const n = notify({
      audience: 'staff',
      kind: 'request',
      title: 'New pickup request',
      body: `${farmer.name} — ${bags} bags (${type === 'staff_pickup' ? 'team pickup' : 'self-drop'})`,
    })
    set((st) => ({
      requests: [request, ...st.requests],
      chat: pushChat(st.chat, farmerId, cardMsg),
      chatStage: { ...st.chatStage, [farmerId]: { step: 'idle' } },
      notifications: [n, ...st.notifications],
    }))
  },

  showMyRequests: (farmerId) =>
    set((s) => {
      const mine = s.requests.filter((r) => r.farmerId === farmerId).slice(0, 4)
      const text =
        mine.length === 0
          ? copy.myRequestsEmpty()
          : [copy.myRequestsHeader(), ...mine.map((r) => `${statusEmoji(r.status)} *${r.id}* — ${r.estimatedBags} bags — ${statusLabel(r.status)}`)].join(
              '\n',
            )
      return { chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text })) }
    }),

  // ================= STAFF: DISPATCH =================
  createRoute: ({ requestIds, vehicleId, driverId, scheduledDate }) => {
    const s = get()
    const bags = s.requests.filter((r) => requestIds.includes(r.id)).reduce((sum, r) => sum + r.estimatedBags, 0)
    const id = nextRouteId()
    const route: Route = { id, requestIds, vehicleId, driverId, scheduledDate, totalEstimatedBags: bags, status: 'planned', createdAt: Date.now() }
    set((st) => ({
      routes: [route, ...st.routes],
      requests: st.requests.map((r) => (requestIds.includes(r.id) ? { ...r, status: 'assigned', routeId: id } : r)),
      selectedRequestIds: [],
    }))
    return id
  },

  dispatchRoute: (routeId) => {
    const s = get()
    const route = s.routes.find((r) => r.id === routeId)
    if (!route) return
    const driver = s.drivers.find((d) => d.id === route.driverId)!
    const vehicle = s.vehicles.find((v) => v.id === route.vehicleId)!
    const dateLabel = route.scheduledDate === new Date().toISOString().slice(0, 10) ? 'today' : route.scheduledDate

    let chat = s.chat
    const relatedRequests = s.requests.filter((r) => route.requestIds.includes(r.id))
    for (const r of relatedRequests) {
      chat = pushChat(
        chat,
        r.farmerId,
        msg(r.farmerId, { from: 'bot', kind: 'status_update', text: copy.routeScheduled(r.id, driver.name, dateLabel, r.estimatedBags), statusEmoji: '🚚' }),
      )
    }

    const n = notify({
      audience: 'driver',
      driverId: driver.id,
      kind: 'route',
      title: 'New route assigned',
      body: `${route.requestIds.length} stop${route.requestIds.length === 1 ? '' : 's'} · ${route.totalEstimatedBags} bags · ${vehicle.plate}`,
    })

    set((st) => ({
      routes: st.routes.map((r) => (r.id === routeId ? { ...r, status: 'dispatched', dispatchedAt: Date.now() } : r)),
      drivers: st.drivers.map((d) => (d.id === driver.id ? { ...d, status: 'on_route' } : d)),
      chat,
      notifications: [n, ...st.notifications],
    }))
  },

  // ================= DRIVER =================
  driverStartRoute: (routeId) => {
    const s = get()
    const route = s.routes.find((r) => r.id === routeId)
    if (!route) return
    const requests = s.requests.filter((r) => route.requestIds.includes(r.id))
    const stops: ShipmentStop[] = requests.map((r) => ({
      requestId: r.id,
      farmerId: r.farmerId,
      farmerName: r.farmerName,
      location: r.location,
      estimatedBags: r.estimatedBags,
      status: 'pending',
    }))
    const id = nextShipmentId()
    const shipment: Shipment = {
      id,
      routeId,
      driverId: route.driverId,
      vehicleId: route.vehicleId,
      stops,
      status: 'active',
      startedAt: Date.now(),
      position: { ...FACTORY },
      legIndex: 0,
      legStartedAt: Date.now(),
      legDurationMs: randomLegDuration(),
      legProgress: 0,
    }
    set((st) => ({ shipments: [shipment, ...st.shipments], focusShipmentId: id }))
  },

  driverMarkStopArrived: (shipmentId, requestId) =>
    set((s) => ({
      shipments: s.shipments.map((sh) =>
        sh.id === shipmentId ? { ...sh, stops: sh.stops.map((st) => (st.requestId === requestId ? { ...st, status: 'arrived' } : st)) } : sh,
      ),
    })),

  driverConfirmPickup: (shipmentId, requestId, actualBags) => {
    const s = get()
    const shipment = s.shipments.find((sh) => sh.id === shipmentId)
    if (!shipment) return
    const stop = shipment.stops.find((st) => st.requestId === requestId)
    if (!stop) return
    const isLast = shipment.legIndex === shipment.stops.length - 1

    const statusMsg = msg(stop.farmerId, {
      from: 'bot',
      kind: 'status_update',
      text: copy.collected(requestId, actualBags, stop.estimatedBags, stop.farmerName),
      statusEmoji: '✅',
    })

    set((st) => ({
      shipments: st.shipments.map((sh) =>
        sh.id === shipmentId
          ? {
              ...sh,
              stops: sh.stops.map((s2) => (s2.requestId === requestId ? { ...s2, status: 'completed', actualBags, completedAt: Date.now() } : s2)),
              legIndex: sh.legIndex + 1,
              legStartedAt: Date.now(),
              legDurationMs: randomLegDuration(isLast),
              legProgress: 0,
            }
          : sh,
      ),
      requests: st.requests.map((r) => (r.id === requestId ? { ...r, status: 'fulfilled' } : r)),
      chat: pushChat(st.chat, stop.farmerId, statusMsg),
    }))
  },

  driverArriveFactory: (shipmentId) => {
    const s = get()
    const shipment = s.shipments.find((sh) => sh.id === shipmentId)
    if (!shipment) return
    const n = notify({
      audience: 'staff',
      kind: 'shipment',
      title: 'Shipment arrived',
      body: `${shipmentId} is back at the depot — ready for receiving`,
    })
    set((st) => ({
      shipments: st.shipments.map((sh) => (sh.id === shipmentId ? { ...sh, status: 'arrived_factory', arrivedFactoryAt: Date.now() } : sh)),
      routes: st.routes.map((r) => (r.id === shipment.routeId ? { ...r, status: 'completed' } : r)),
      drivers: st.drivers.map((d) => (d.id === shipment.driverId ? { ...d, status: 'available' } : d)),
      notifications: [n, ...st.notifications],
    }))
  },

  // ================= STAFF: RECEIVING =================
  staffReceiveShipment: (shipmentId, lines) => {
    const s = get()
    const shipment = s.shipments.find((sh) => sh.id === shipmentId)
    if (!shipment) return
    const newStock: StockEntry[] = []
    const newExceptions: ExceptionItem[] = []
    let chat = s.chat

    for (const line of lines) {
      const stop = shipment.stops.find((st) => st.requestId === line.requestId)
      if (!stop) continue
      if (line.quality === 'pass') {
        newStock.push({
          id: nextStockId(stop.farmerId),
          shipmentId,
          farmerId: stop.farmerId,
          farmerName: stop.farmerName,
          bags: line.actualBags,
          quality: 'pass',
          packaging: line.packaging,
          receivedAt: Date.now(),
          freshnessHours: line.packaging === 'unopened' ? 108 : 48,
          receivedBy: s.staff.name,
        })
        chat = pushChat(
          chat,
          stop.farmerId,
          msg(stop.farmerId, { from: 'bot', kind: 'status_update', text: copy.receivedPass(line.actualBags, stop.farmerName), statusEmoji: '🏭' }),
        )
      } else {
        const excId = nextExceptionId()
        newExceptions.push({
          id: excId,
          relatedType: 'shipment',
          relatedId: shipmentId,
          type: 'quality_fail',
          note: `${stop.farmerName} — ${line.actualBags} bags failed quality check on receiving (${shipmentId}).`,
          status: 'open',
          createdAt: Date.now(),
        })
        chat = pushChat(chat, stop.farmerId, msg(stop.farmerId, { from: 'bot', kind: 'status_update', text: copy.receivedFail(stop.farmerName), statusEmoji: '⚠️' }))
      }
    }

    set((st) => ({
      stock: [...newStock, ...st.stock],
      exceptions: [...newExceptions, ...st.exceptions],
      shipments: st.shipments.map((sh) => (sh.id === shipmentId ? { ...sh, status: 'received', closedAt: Date.now() } : sh)),
      chat,
    }))
  },

  // ================= EXCEPTIONS =================
  flagException: ({ relatedType, relatedId, type, note }) => {
    const id = nextExceptionId()
    const item: ExceptionItem = { id, relatedType, relatedId, type, note, status: 'open', createdAt: Date.now() }
    set((s) => ({
      exceptions: [item, ...s.exceptions],
      requests: relatedType === 'request' ? s.requests.map((r) => (r.id === relatedId ? { ...r, status: 'flagged', exceptionId: id } : r)) : s.requests,
    }))
  },

  resolveException: (exceptionId, rescheduledDate) =>
    set((s) => {
      const exc = s.exceptions.find((e) => e.id === exceptionId)
      if (!exc) return {}
      return {
        exceptions: s.exceptions.map((e) => (e.id === exceptionId ? { ...e, status: 'resolved', resolvedAt: Date.now(), rescheduledDate } : e)),
        requests:
          exc.relatedType === 'request'
            ? s.requests.map((r) => (r.id === exc.relatedId ? { ...r, status: 'unassigned', exceptionId: undefined } : r))
            : s.requests,
      }
    }),

  // ================= NOTIFICATIONS =================
  markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllNotificationsRead: (audience, driverId) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.audience === audience && (!driverId || n.driverId === driverId) ? { ...n, read: true } : n)),
    })),

  // ================= DRIVER SELF-SERVICE =================
  toggleDriverAvailability: (driverId) =>
    set((s) => ({
      drivers: s.drivers.map((d) => {
        if (d.id !== driverId || d.status === 'on_route') return d
        return { ...d, status: d.status === 'available' ? 'off_duty' : 'available' }
      }),
    })),

  // ================= UI =================
  setView: (view) => set({ view, spotlight: null }),
  setStaffTab: (staffTab) => set({ staffTab }),
  setDriverTab: (driverTab) => set({ driverTab }),
  setActiveFarmerId: (activeFarmerId) => set({ activeFarmerId }),
  setActiveDriverId: (activeDriverId) => set({ activeDriverId }),
  setSpotlight: (spotlight) => set({ spotlight }),
  setAutoplayRunning: (autoplayRunning) => set({ autoplayRunning }),
  toggleSelectedRequest: (id) =>
    set((s) => ({ selectedRequestIds: s.selectedRequestIds.includes(id) ? s.selectedRequestIds.filter((x) => x !== id) : [...s.selectedRequestIds, id] })),
  clearSelectedRequests: () => set({ selectedRequestIds: [] }),
  setFocusShipment: (focusShipmentId) => set({ focusShipmentId }),

  // ================= DEMO AUTH =================
  loginStaff: () => set({ staffAuthed: true }),
  loginDriver: () => set({ driverAuthed: true }),
  logoutStaff: () => set({ staffAuthed: false }),
  logoutDriver: () => set({ driverAuthed: false }),

  // ================= LIFECYCLE =================
  tick: () =>
    set((s) => {
      const now = Date.now()
      const shipments = s.shipments.map((sh) => {
        if (sh.status !== 'active') return sh
        const waypoints = waypointsFor(sh)
        const from = waypoints[sh.legIndex]
        const to = waypoints[sh.legIndex + 1]
        if (!to) return sh
        const raw = (now - sh.legStartedAt) / sh.legDurationMs
        const progress = Math.max(0, Math.min(1, raw))
        const position = { lat: from.lat + (to.lat - from.lat) * progress, lng: from.lng + (to.lng - from.lng) * progress }
        return { ...sh, position, legProgress: progress }
      })
      return { now, shipments }
    }),

  resetDemo: () => {
    resetPersisted()
    set({ ...freshState(), ...initialUI() })
  },

  _applyRemote: (remote) => set({ ...remote }),
}))

// ---------------- simulation + persistence wiring ----------------

let simStarted = false
export function startSimulation() {
  if (simStarted) return
  simStarted = true
  setInterval(() => useTallawahStore.getState().tick(), 220)
}

let applyingRemote = false
let syncStarted = false
export function startSync() {
  if (syncStarted) return
  syncStarted = true
  useTallawahStore.subscribe((state) => {
    if (applyingRemote) return
    const { version, farmers, drivers, vehicles, staff, requests, routes, shipments, stock, exceptions, notifications, chat, chatStage, now } = state
    persistAndBroadcast({ version, farmers, drivers, vehicles, staff, requests, routes, shipments, stock, exceptions, notifications, chat, chatStage, now })
  })
  subscribeRemote<any>((remote) => {
    if (!remote || remote.version !== PERSIST_VERSION) return
    applyingRemote = true
    useTallawahStore.getState()._applyRemote(remote)
    applyingRemote = false
  })
}
