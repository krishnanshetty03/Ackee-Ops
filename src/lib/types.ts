// ============================================================
// Domain model — mirrors "PRDs — Operations: Farmer Orders & Shipments"
// Stage 1 Order Intake · Stage 2 Dispatch/Shipment Planning ·
// Stage 3 In-Transit Tracking · Stage 4 Arrival & Receiving · Stage 5 Exceptions
// ============================================================

export type RequestType = 'staff_pickup' | 'self_drop'
export type RequestStatus = 'unassigned' | 'assigned' | 'fulfilled' | 'flagged'

export interface GeoPoint {
  lat: number
  lng: number
}

export interface Location extends GeoPoint {
  label: string
  community: string
}

export interface Farmer {
  id: string
  name: string
  phone: string
  community: string
  initials: string
  avatarHue: number // deterministic color for avatar chip
  memberSince: string // ISO date
}

export interface FarmerRequest {
  id: string
  farmerId: string
  farmerName: string
  farmerPhone: string
  location: Location
  estimatedBags: number
  requestType: RequestType
  status: RequestStatus
  createdAt: number // epoch ms
  routeId?: string
  exceptionId?: string
}

export interface Vehicle {
  id: string
  plate: string
  model: string
  capacityBags: number
}

export type DriverStatus = 'available' | 'on_route' | 'off_duty'

export interface Driver {
  id: string
  name: string
  phone: string
  vehicleId: string
  status: DriverStatus
  avatarHue: number
  initials: string
  homeLocation: GeoPoint
}

export type RouteStatus = 'planned' | 'dispatched' | 'completed'

export interface Route {
  id: string
  requestIds: string[]
  vehicleId: string
  driverId: string
  scheduledDate: string // ISO date (yyyy-mm-dd)
  totalEstimatedBags: number
  status: RouteStatus
  createdAt: number
  dispatchedAt?: number
}

export type StopStatus = 'pending' | 'arrived' | 'completed'

export interface ShipmentStop {
  requestId: string
  farmerId: string
  farmerName: string
  location: Location
  estimatedBags: number
  actualBags?: number
  status: StopStatus
  completedAt?: number
}

/** 'active' covers both outbound collection and the return leg to the factory
 *  (distinguished by legIndex >= stops.length); 'received' is the terminal/closed state. */
export type ShipmentStatus = 'active' | 'arrived_factory' | 'received'

export interface Shipment {
  id: string
  routeId: string
  driverId: string
  vehicleId: string
  stops: ShipmentStop[]
  status: ShipmentStatus
  startedAt: number
  arrivedFactoryAt?: number
  closedAt?: number
  /** current simulated GPS position */
  position: GeoPoint
  /** index of stop currently being driven toward; === stops.length once heading back to the factory */
  legIndex: number
  /** wall-clock timestamp the current leg started, for progress interpolation */
  legStartedAt: number
  /** how long the current leg should take, in ms */
  legDurationMs: number
  /** cached 0..1 progress along the current leg, recomputed each sim tick */
  legProgress: number
}

export type QualityResult = 'pass' | 'fail'

export interface StockEntry {
  id: string
  shipmentId: string
  farmerId: string
  farmerName: string
  bags: number
  quality: QualityResult
  packaging: 'open' | 'unopened'
  receivedAt: number
  freshnessHours: number
  receivedBy: string
}

export type ExceptionType =
  | 'farmer_not_ready'
  | 'route_over_capacity'
  | 'rescheduled'
  | 'quality_fail'
  | 'other'
export type ExceptionStatus = 'open' | 'resolved'

export interface ExceptionItem {
  id: string
  relatedType: 'request' | 'route' | 'shipment'
  relatedId: string
  type: ExceptionType
  note: string
  status: ExceptionStatus
  rescheduledDate?: string
  createdAt: number
  resolvedAt?: number
}

export type NotificationAudience = 'staff' | 'driver'

export interface AppNotification {
  id: string
  audience: NotificationAudience
  driverId?: string
  title: string
  body: string
  createdAt: number
  read: boolean
  kind: 'request' | 'route' | 'shipment' | 'exception' | 'receiving'
}

export interface StaffMember {
  id: string
  name: string
  role: string
  initials: string
}

export const FLEET_SIZE = 5
export const VEHICLE_CAPACITY = 120
export const FLEET_CAPACITY = FLEET_SIZE * VEHICLE_CAPACITY // 600 bags/round ceiling

// ---------------- Farmer WhatsApp channel ----------------

export type ChatSender = 'bot' | 'farmer'

export type ChatMessageKind =
  | 'text'
  | 'quick_replies'
  | 'location_request'
  | 'location_share'
  | 'request_card'
  | 'status_update'

export interface QuickReplyOption {
  label: string
  value: string
}

export interface ChatMessage {
  id: string
  farmerId: string
  from: ChatSender
  kind: ChatMessageKind
  text?: string
  options?: QuickReplyOption[]
  location?: Location
  requestSummary?: {
    requestId: string
    bags: number
    type: RequestType
    status: RequestStatus
    dropoffTiming?: string
  }
  statusEmoji?: string
  createdAt: number
}

export type ChatStage =
  | { step: 'idle' }
  | { step: 'awaiting_bags' }
  | { step: 'awaiting_type'; bags: number }
  | { step: 'awaiting_location'; bags: number; type: RequestType }
  | { step: 'awaiting_dropoff_timing'; bags: number; type: RequestType }

// ---------------- UI-only ephemeral state ----------------

export type AppView = 'home' | 'farmer' | 'staff' | 'driver' | 'present'
export type StaffTab = 'overview' | 'intake' | 'dispatch' | 'tracking' | 'receiving' | 'exceptions'
export type DriverTab = 'home' | 'route' | 'history' | 'profile'

export interface DemoCredential {
  username: string
  password: string
}

export interface Spotlight {
  view: AppView
  staffTab?: StaffTab
  driverTab?: DriverTab
  highlightId?: string
  note?: string
}
