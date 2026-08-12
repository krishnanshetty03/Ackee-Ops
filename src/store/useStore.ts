import { create } from 'zustand'
import type {
  AppNotification,
  AppView,
  Branch,
  ChatMessage,
  ChatStage,
  Driver,
  ExceptionItem,
  ExceptionType,
  Farmer,
  FarmerNote,
  FarmerRequest,
  FollowUpTask,
  GeoPoint,
  Language,
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
import { BRANCHES, DRIVERS, FARMERS, STAFF_USER, VEHICLES, buildSeed, locationFor } from '../lib/seed'
import {
  nextExceptionId,
  nextNoteId,
  nextNotifId,
  nextRequestId,
  nextRouteId,
  nextShipmentId,
  nextStockId,
  nextTaskId,
  syncIdCounters,
  todayIso,
} from '../lib/format'
import { FACTORY } from '../lib/geo'
import { loadPersisted, persistAndBroadcast, resetPersisted, subscribeRemote } from '../lib/sync'
import {
  bagQuickReplyOptions,
  branchOptions,
  copyFor,
  dropoffTimingLabel,
  dropoffTimingOptions,
  languageOptions,
  LANGUAGE_PROMPT,
  pickupTypeLabel,
  pickupTypeOptions,
  statusEmoji,
  statusLabel,
} from '../lib/chatCopy'

const PERSIST_VERSION = 5

interface DataSlice {
  version: number
  farmers: Farmer[]
  drivers: Driver[]
  vehicles: Vehicle[]
  branches: Branch[]
  staff: StaffMember
  requests: FarmerRequest[]
  routes: Route[]
  shipments: Shipment[]
  stock: StockEntry[]
  exceptions: ExceptionItem[]
  notifications: AppNotification[]
  chat: Record<string, ChatMessage[]>
  chatStage: Record<string, ChatStage>
  farmerNotes: FarmerNote[]
  followUpTasks: FollowUpTask[]
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
  mdAuthed: boolean
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
  /** first-contact language pick, or a later switch via the composer toggle — leaves
   *  mid-conversation progress untouched when it's a switch, not a first choice */
  chooseLanguage: (farmerId: string, language: Language) => void
  chooseBags: (farmerId: string, bags: number) => void
  chooseBranch: (farmerId: string, branchId: string) => void
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
  /** quality + packaging are assessed by the driver right here, at the farm — not later by staff */
  driverConfirmPickup: (shipmentId: string, requestId: string, actualBags: number, quality: QualityResult, packaging: 'open' | 'unopened') => void
  driverArriveFactory: (shipmentId: string) => void

  // ---- staff: receiving ----
  /** staff can only correct the bag count (e.g. a spillage found on the depot scale) — quality/packaging came from the driver */
  staffReceiveShipment: (shipmentId: string, actualBagsOverrides?: Record<string, number>) => void

  // ---- exceptions ----
  flagException: (input: { relatedType: 'request' | 'route' | 'shipment'; relatedId: string; type: ExceptionType; note: string }) => void
  resolveException: (exceptionId: string, rescheduledDate?: string) => void

  // ---- notifications ----
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (audience: 'staff' | 'driver', driverId?: string) => void

  // ---- driver self-service ----
  toggleDriverAvailability: (driverId: string) => void

  // ---- farmer CRM ----
  addFarmerNote: (farmerId: string, text: string) => void
  toggleFarmerTag: (farmerId: string, tag: string) => void
  addFollowUpTask: (farmerId: string, note: string, dueDate: string) => void
  toggleFollowUpTask: (taskId: string) => void

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
  loginMD: () => void
  logoutStaff: () => void
  logoutDriver: () => void
  logoutMD: () => void

  // ---- lifecycle ----
  tick: () => void
  resetDemo: () => void
  _applyRemote: (state: DataSlice) => void
  /** internal: shared tail of the chat flow once bags+branch+type(+location/timing) are known */
  _finalizeRequest: (farmerId: string, bags: number, branchId: string, type: RequestType, location?: FarmerRequest['location'], dropoffTiming?: string) => void
}

export type Store = DataSlice & UISlice & Actions

function freshState(): DataSlice {
  const seed = buildSeed()
  return {
    version: PERSIST_VERSION,
    farmers: FARMERS,
    drivers: DRIVERS,
    vehicles: VEHICLES,
    branches: BRANCHES,
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
    farmerNotes: seed.farmerNotes,
    followUpTasks: seed.followUpTasks,
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
    mdAuthed: false,
  }
}

function hydrate(): DataSlice {
  const persisted = loadPersisted<DataSlice>()
  if (persisted && persisted.version === PERSIST_VERSION) {
    syncIdCounters(persisted)
    return persisted
  }
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
      if (already === 0 && !farmer.language) {
        const ask = msg(farmerId, { from: 'bot', kind: 'quick_replies', text: LANGUAGE_PROMPT, options: languageOptions() })
        return {
          chat: pushChat(s.chat, farmerId, ask),
          chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_language' } },
        }
      }
      const t = copyFor(farmer.language)
      const welcome = already === 0 ? [msg(farmerId, { from: 'bot', kind: 'text', text: t.welcome(farmer.name) })] : []
      const ask = msg(farmerId, { from: 'bot', kind: 'quick_replies', text: t.askBags(farmer.name), options: bagQuickReplyOptions() })
      return {
        chat: pushChat(s.chat, farmerId, ...welcome, ask),
        chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_bags' } },
      }
    }),

  chooseLanguage: (farmerId, language) =>
    set((s) => {
      const farmer = s.farmers.find((f) => f.id === farmerId)
      if (!farmer) return {}
      const stage = s.chatStage[farmerId]
      const isFirstChoice = stage?.step === 'awaiting_language'
      const t = copyFor(language)
      const label = languageOptions().find((o) => o.value === language)?.label ?? language
      const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text: label })
      const replyMsgs = isFirstChoice
        ? [msg(farmerId, { from: 'bot', kind: 'text', text: t.welcome(farmer.name) }), msg(farmerId, { from: 'bot', kind: 'quick_replies', text: t.askBags(farmer.name), options: bagQuickReplyOptions() })]
        : [msg(farmerId, { from: 'bot', kind: 'text', text: t.languageChanged() })]
      return {
        farmers: s.farmers.map((f) => (f.id === farmerId ? { ...f, language } : f)),
        chat: pushChat(s.chat, farmerId, farmerMsg, ...replyMsgs),
        chatStage: isFirstChoice ? { ...s.chatStage, [farmerId]: { step: 'awaiting_bags' } } : s.chatStage,
      }
    }),

  chooseBags: (farmerId, bags) =>
    set((s) => {
      const farmer = s.farmers.find((f) => f.id === farmerId)
      const t = copyFor(farmer?.language)
      const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text: String(bags) })
      const botMsg = msg(farmerId, {
        from: 'bot',
        kind: 'quick_replies',
        text: t.bagsNoted(bags),
        options: branchOptions(s.branches),
      })
      return {
        chat: pushChat(s.chat, farmerId, farmerMsg, botMsg),
        chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_branch', bags } },
      }
    }),

  chooseBranch: (farmerId, branchId) =>
    set((s) => {
      const stage = s.chatStage[farmerId]
      if (!stage || stage.step !== 'awaiting_branch') return {}
      const branch = s.branches.find((b) => b.id === branchId)
      if (!branch) return {}
      const farmer = s.farmers.find((f) => f.id === farmerId)
      const lang = farmer?.language
      const t = copyFor(lang)
      const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text: `📍 ${branch.name}` })
      const botMsg = msg(farmerId, { from: 'bot', kind: 'quick_replies', text: t.branchChosen(branch.name), options: pickupTypeOptions(lang) })
      return {
        chat: pushChat(s.chat, farmerId, farmerMsg, botMsg),
        chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_type', bags: stage.bags, branchId } },
      }
    }),

  choosePickupType: (farmerId, type) =>
    set((s) => {
      const stage = s.chatStage[farmerId]
      if (!stage || stage.step !== 'awaiting_type') return {}
      const farmer = s.farmers.find((f) => f.id === farmerId)
      const lang = farmer?.language
      const t = copyFor(lang)
      const label = pickupTypeLabel(type, lang)
      const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text: label })
      if (type === 'staff_pickup') {
        const botMsg = msg(farmerId, { from: 'bot', kind: 'location_request', text: t.askLocation() })
        return {
          chat: pushChat(s.chat, farmerId, farmerMsg, botMsg),
          chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_location', bags: stage.bags, type, branchId: stage.branchId } },
        }
      }
      const branch = s.branches.find((b) => b.id === stage.branchId)
      const botMsg = msg(farmerId, {
        from: 'bot',
        kind: 'quick_replies',
        text: t.askDropoffTiming(branch?.name ?? 'the branch'),
        options: dropoffTimingOptions(lang),
      })
      return {
        chat: pushChat(s.chat, farmerId, farmerMsg, botMsg),
        chatStage: { ...s.chatStage, [farmerId]: { step: 'awaiting_dropoff_timing', bags: stage.bags, type, branchId: stage.branchId } },
      }
    }),

  shareLocation: (farmerId) => {
    const s0 = get()
    const stage = s0.chatStage[farmerId]
    if (!stage || stage.step !== 'awaiting_location') return
    const farmer = s0.farmers.find((f) => f.id === farmerId)!
    const t = copyFor(farmer.language)
    const location = locationFor(farmer, '')
    const locMsg = msg(farmerId, { from: 'farmer', kind: 'location_share', location })
    const ackMsg = msg(farmerId, { from: 'bot', kind: 'text', text: t.locationReceived() })
    set((s) => ({ chat: pushChat(s.chat, farmerId, locMsg, ackMsg) }))
    setTimeout(() => get()._finalizeRequest(farmerId, stage.bags, stage.branchId, stage.type, location), 700)
  },

  chooseDropoffTiming: (farmerId, timing) => {
    const s0 = get()
    const stage = s0.chatStage[farmerId]
    if (!stage || stage.step !== 'awaiting_dropoff_timing') return
    const farmer = s0.farmers.find((f) => f.id === farmerId)
    const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text: dropoffTimingLabel(timing, farmer?.language) })
    set((s) => ({ chat: pushChat(s.chat, farmerId, farmerMsg) }))
    get()._finalizeRequest(farmerId, stage.bags, stage.branchId, stage.type, undefined, timing)
  },

  sendFreeText: (farmerId, rawText) => {
    const text = rawText.trim()
    if (!text) return
    const s0 = get()
    const farmer = s0.farmers.find((f) => f.id === farmerId)
    const lang = farmer?.language
    const t = copyFor(lang)
    const stage = s0.chatStage[farmerId] ?? { step: 'idle' }
    const farmerMsg = msg(farmerId, { from: 'farmer', kind: 'text', text })
    set((s) => ({ chat: pushChat(s.chat, farmerId, farmerMsg) }))

    if (stage.step === 'awaiting_language') {
      const lower = text.toLowerCase()
      if (/twi/.test(lower)) return get().chooseLanguage(farmerId, 'tw')
      if (/eng/.test(lower)) return get().chooseLanguage(farmerId, 'en')
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: LANGUAGE_PROMPT })) }))
      return
    }
    if (stage.step === 'awaiting_bags') {
      const n = parseInt(text.replace(/[^\d]/g, ''), 10)
      if (Number.isFinite(n) && n > 0) {
        get().chooseBags(farmerId, n)
      } else {
        set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: t.clarifyBags() })) }))
      }
      return
    }
    if (stage.step === 'awaiting_branch') {
      const lower = text.toLowerCase()
      const match = s0.branches.find((b) => lower.includes(b.community.toLowerCase()) || lower.includes(b.name.toLowerCase()))
      if (match) return get().chooseBranch(farmerId, match.id)
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: t.clarifyBranch() })) }))
      return
    }
    if (stage.step === 'awaiting_type') {
      const lower = text.toLowerCase()
      if (/(team|staff|pick ?up|come|collect|gye)/.test(lower)) return get().choosePickupType(farmerId, 'staff_pickup')
      if (/(self|drop|bring|myself|mede)/.test(lower)) return get().choosePickupType(farmerId, 'self_drop')
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: t.clarifyType() })) }))
      return
    }
    if (stage.step === 'awaiting_location') {
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: t.nudgeLocationButton() })) }))
      return
    }
    if (stage.step === 'awaiting_dropoff_timing') {
      const lower = text.toLowerCase()
      if (/today|ɛnnɛ|ennɛ/.test(lower)) return get().chooseDropoffTiming(farmerId, 'today')
      if (/tomorrow|ɔkyena|okyena/.test(lower)) return get().chooseDropoffTiming(farmerId, 'tomorrow')
      if (/week|dapɛn|dapen/.test(lower)) return get().chooseDropoffTiming(farmerId, 'this_week')
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: t.clarifyTiming() })) }))
      return
    }
    // idle
    if (/(ackee|ready|bags?|pickup|pick ?up)/i.test(text)) {
      get().startNewRequest(farmerId)
    } else if (/(my request|status|order)/i.test(text)) {
      get().showMyRequests(farmerId)
    } else {
      set((s) => ({ chat: pushChat(s.chat, farmerId, msg(farmerId, { from: 'bot', kind: 'text', text: t.fallback() })) }))
    }
  },

  _finalizeRequest: (farmerId, bags, branchId, type, location, dropoffTiming) => {
    const s = get()
    const farmer = s.farmers.find((f) => f.id === farmerId)!
    const t = copyFor(farmer.language)
    const branch = s.branches.find((b) => b.id === branchId)
    const id = nextRequestId()
    const loc =
      location ?? { label: `${farmer.name.split(' ')[0]} — self-drop`, community: branch?.community ?? farmer.community, lat: branch?.lat ?? FACTORY.lat, lng: branch?.lng ?? FACTORY.lng }
    const request: FarmerRequest = {
      id,
      farmerId,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      location: loc,
      estimatedBags: bags,
      requestType: type,
      branchId,
      status: 'unassigned',
      createdAt: Date.now(),
    }
    const cardMsg = msg(farmerId, {
      from: 'bot',
      kind: 'request_card',
      text: t.requestConfirmed(id),
      requestSummary: { requestId: id, bags, type, branchName: branch?.name, status: 'unassigned', dropoffTiming },
    })
    const n = notify({
      audience: 'staff',
      kind: 'request',
      title: 'New pickup request',
      body: `${farmer.name} — ${bags} bags (${type === 'staff_pickup' ? 'team pickup' : 'self-drop'})`,
    })
    set((st) => ({
      requests: [request, ...st.requests],
      farmers: st.farmers.map((f) => (f.id === farmerId ? { ...f, nearestBranchId: branchId } : f)),
      chat: pushChat(st.chat, farmerId, cardMsg),
      chatStage: { ...st.chatStage, [farmerId]: { step: 'idle' } },
      notifications: [n, ...st.notifications],
    }))
  },

  showMyRequests: (farmerId) =>
    set((s) => {
      const farmer = s.farmers.find((f) => f.id === farmerId)
      const lang = farmer?.language
      const t = copyFor(lang)
      const mine = s.requests.filter((r) => r.farmerId === farmerId).slice(0, 4)
      const text =
        mine.length === 0
          ? t.myRequestsEmpty()
          : [t.myRequestsHeader(), ...mine.map((r) => `${statusEmoji(r.status)} *${r.id}* — ${r.estimatedBags} bags — ${statusLabel(r.status, lang)}`)].join(
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
    const dateLabel = route.scheduledDate === todayIso(s.now) ? 'today' : route.scheduledDate

    let chat = s.chat
    const relatedRequests = s.requests.filter((r) => route.requestIds.includes(r.id))
    for (const r of relatedRequests) {
      const t = copyFor(s.farmers.find((f) => f.id === r.farmerId)?.language)
      chat = pushChat(
        chat,
        r.farmerId,
        msg(r.farmerId, { from: 'bot', kind: 'status_update', text: t.routeScheduled(r.id, driver.name, dateLabel, r.estimatedBags), statusEmoji: '🚚' }),
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

  driverConfirmPickup: (shipmentId, requestId, actualBags, quality, packaging) => {
    const s = get()
    const shipment = s.shipments.find((sh) => sh.id === shipmentId)
    if (!shipment) return
    const stop = shipment.stops.find((st) => st.requestId === requestId)
    if (!stop) return
    const isLast = shipment.legIndex === shipment.stops.length - 1
    const driver = s.drivers.find((d) => d.id === shipment.driverId)
    const t = copyFor(s.farmers.find((f) => f.id === stop.farmerId)?.language)

    let chat = pushChat(
      s.chat,
      stop.farmerId,
      msg(stop.farmerId, { from: 'bot', kind: 'status_update', text: t.collected(requestId, actualBags, stop.estimatedBags, stop.farmerName), statusEmoji: '✅' }),
    )

    const newExceptions: ExceptionItem[] = []
    let notifications = s.notifications
    if (quality === 'fail') {
      chat = pushChat(chat, stop.farmerId, msg(stop.farmerId, { from: 'bot', kind: 'status_update', text: t.qualityFlagged(stop.farmerName), statusEmoji: '⚠️' }))
      newExceptions.push({
        id: nextExceptionId(),
        relatedType: 'shipment',
        relatedId: shipmentId,
        type: 'quality_fail',
        note: `${stop.farmerName} — ${actualBags} bags flagged by ${driver?.name ?? 'the driver'} at pickup (${shipmentId}).`,
        status: 'open',
        createdAt: Date.now(),
      })
      notifications = [notify({ audience: 'staff', kind: 'exception', title: 'Quality concern flagged', body: `${stop.farmerName} — flagged at pickup by ${driver?.name ?? 'driver'} (${shipmentId})` }), ...notifications]
    }

    set((st) => ({
      shipments: st.shipments.map((sh) =>
        sh.id === shipmentId
          ? {
              ...sh,
              stops: sh.stops.map((s2) => (s2.requestId === requestId ? { ...s2, status: 'completed', actualBags, quality, packaging, completedAt: Date.now() } : s2)),
              legIndex: sh.legIndex + 1,
              legStartedAt: Date.now(),
              legDurationMs: randomLegDuration(isLast),
              legProgress: 0,
            }
          : sh,
      ),
      requests: st.requests.map((r) => (r.id === requestId ? { ...r, status: 'fulfilled' } : r)),
      exceptions: newExceptions.length ? [...newExceptions, ...st.exceptions] : st.exceptions,
      chat,
      notifications,
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
  staffReceiveShipment: (shipmentId, actualBagsOverrides) => {
    const s = get()
    const shipment = s.shipments.find((sh) => sh.id === shipmentId)
    if (!shipment) return
    const newStock: StockEntry[] = []
    let chat = s.chat

    // quality + packaging were already assessed by the driver at pickup — receiving just
    // logs what passed into the stock ledger, staff can only correct the bag count here.
    for (const stop of shipment.stops) {
      if (stop.quality !== 'pass') continue
      const actualBags = actualBagsOverrides?.[stop.requestId] ?? stop.actualBags ?? stop.estimatedBags
      const packaging = stop.packaging ?? 'unopened'
      newStock.push({
        id: nextStockId(stop.farmerId),
        shipmentId,
        farmerId: stop.farmerId,
        farmerName: stop.farmerName,
        bags: actualBags,
        quality: 'pass',
        packaging,
        receivedAt: Date.now(),
        freshnessHours: packaging === 'unopened' ? 108 : 48,
        receivedBy: s.staff.name,
      })
      const t = copyFor(s.farmers.find((f) => f.id === stop.farmerId)?.language)
      chat = pushChat(chat, stop.farmerId, msg(stop.farmerId, { from: 'bot', kind: 'status_update', text: t.receivedPass(actualBags, stop.farmerName), statusEmoji: '🏭' }))
    }

    set((st) => ({
      stock: [...newStock, ...st.stock],
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

  // ================= FARMER CRM =================
  addFarmerNote: (farmerId, text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const s = get()
    const note: FarmerNote = { id: nextNoteId(), farmerId, authorName: s.staff.name, text: trimmed, createdAt: Date.now() }
    set((st) => ({ farmerNotes: [note, ...st.farmerNotes] }))
  },
  toggleFarmerTag: (farmerId, tag) =>
    set((s) => ({
      farmers: s.farmers.map((f) => (f.id === farmerId ? { ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] } : f)),
    })),
  addFollowUpTask: (farmerId, note, dueDate) => {
    const trimmed = note.trim()
    if (!trimmed) return
    const task: FollowUpTask = { id: nextTaskId(), farmerId, note: trimmed, dueDate, done: false, createdAt: Date.now() }
    set((st) => ({ followUpTasks: [task, ...st.followUpTasks] }))
  },
  toggleFollowUpTask: (taskId) =>
    set((s) => ({
      followUpTasks: s.followUpTasks.map((t) => (t.id === taskId ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined } : t)),
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
  loginMD: () => set({ mdAuthed: true }),
  logoutStaff: () => set({ staffAuthed: false }),
  logoutDriver: () => set({ driverAuthed: false }),
  logoutMD: () => set({ mdAuthed: false }),

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

  _applyRemote: (remote) => {
    syncIdCounters(remote)
    set({ ...remote })
  },
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
    const { version, farmers, drivers, vehicles, branches, staff, requests, routes, shipments, stock, exceptions, notifications, chat, chatStage, farmerNotes, followUpTasks, now } = state
    persistAndBroadcast({ version, farmers, drivers, vehicles, branches, staff, requests, routes, shipments, stock, exceptions, notifications, chat, chatStage, farmerNotes, followUpTasks, now })
  })
  subscribeRemote<any>((remote) => {
    if (!remote || remote.version !== PERSIST_VERSION) return
    applyingRemote = true
    useTallawahStore.getState()._applyRemote(remote)
    applyingRemote = false
  })
}
