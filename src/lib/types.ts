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

export interface Branch {
  id: string
  name: string
  community: string
  lat: number
  lng: number
}

/** chat language the farmer picked on WhatsApp — unset until their first conversation asks */
export type Language = 'en' | 'tw'

export interface Farmer {
  id: string
  name: string
  phone: string
  community: string
  initials: string
  avatarHue: number // deterministic color for avatar chip
  memberSince: string // ISO date
  /** staff-assigned relationship labels — "Preferred Supplier", "High Volume", etc. */
  tags: string[]
  /** last branch the farmer told us was nearest to them, via WhatsApp */
  nearestBranchId?: string
  language?: Language
}

export interface FarmerRequest {
  id: string
  farmerId: string
  farmerName: string
  farmerPhone: string
  location: Location
  estimatedBags: number
  requestType: RequestType
  branchId: string
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
  /** assessed by the driver on-site at pickup, not by staff at receiving — they're the ones who visit the farm */
  quality?: QualityResult
  packaging?: 'open' | 'unopened'
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
    branchName?: string
    status: RequestStatus
    dropoffTiming?: string
  }
  statusEmoji?: string
  createdAt: number
}

export type ChatStage =
  | { step: 'idle' }
  | { step: 'awaiting_language' }
  | { step: 'awaiting_bags' }
  | { step: 'awaiting_branch'; bags: number }
  | { step: 'awaiting_type'; bags: number; branchId: string }
  | { step: 'awaiting_location'; bags: number; type: RequestType; branchId: string }
  | { step: 'awaiting_dropoff_timing'; bags: number; type: RequestType; branchId: string }

// ---------------- Farmer CRM ----------------

export interface FarmerNote {
  id: string
  farmerId: string
  authorName: string
  text: string
  createdAt: number
}

export interface FollowUpTask {
  id: string
  farmerId: string
  note: string
  dueDate: string // ISO date
  done: boolean
  createdAt: number
  completedAt?: number
}

export type FarmerHealth = 'active' | 'quiet'

export const FARMER_TAG_OPTIONS = ['Preferred Supplier', 'High Volume', 'Reliable', 'Needs Follow-up', 'At Risk'] as const

/** no activity (request, receiving, or an outbound WhatsApp message) in this many
 *  days marks a farmer as "going quiet" on the CRM and the Overview dashboard */
export const FARMER_QUIET_DAYS = 3

// ---------------- MD / Management Overview ----------------
// Static reference data (no interactive editing in this demo) for the parts of
// the business the operational app doesn't model: export compliance and the
// separate online store. Kept out of the Zustand store since nothing here
// changes at runtime — plain imported constants, same as FARM_COMMUNITIES.

export type ClearanceStatus = 'approved' | 'in_review' | 'pending'

export interface ExportClearance {
  id: string
  market: string
  authority: string
  status: ClearanceStatus
  updatedAt: string // ISO date
  note: string
}

export type WarehouseStatus = 'ready' | 'in_setup' | 'not_started'

export interface WarehouseSite {
  id: string
  country: string
  city: string
  status: WarehouseStatus
  capacityTons: number
  targetDate?: string // ISO date — only set while not yet ready
}

export interface OnlineStoreSnapshot {
  revenueMtdUsd: number
  revenueLastMonthUsd: number
  ordersMtd: number
  ordersLastMonth: number
  avgOrderValueUsd: number
  topMarket: string
}

// B2B sales pipeline — retail & distribution partners abroad, separate from the
// online store's consumer orders above. A different motion (relationship-managed
// deals with a named rep) than the transactional ONLINE_STORE snapshot.
export type DealStage = 'prospecting' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'

export interface SalesRep {
  id: string
  name: string
  region: string
  quotaUsd: number
}

export interface SalesDeal {
  id: string
  account: string
  market: string
  stage: DealStage
  valueUsd: number
  repId: string
  /** actual close date once won/lost, expected close date while still open */
  closeDate: string // ISO date
}

// ---------------- UI-only ephemeral state ----------------

export type AppView = 'home' | 'farmer' | 'staff' | 'driver' | 'md' | 'present'
export type StaffTab = 'overview' | 'intake' | 'dispatch' | 'tracking' | 'receiving' | 'exceptions' | 'farmers'
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
