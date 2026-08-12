import { FACTORY, FARM_COMMUNITIES, jitter } from './geo'
import { todayIso } from './format'
import type {
  Branch,
  Driver,
  ExceptionItem,
  ExportClearance,
  Farmer,
  FarmerNote,
  FarmerRequest,
  FollowUpTask,
  OnlineStoreSnapshot,
  Route,
  Shipment,
  StaffMember,
  StockEntry,
  Vehicle,
  WarehouseSite,
} from './types'

export const STAFF_USER: StaffMember = {
  id: 'staff-1',
  name: 'Adjoa Sarpong',
  role: 'Dispatch Lead',
  initials: 'AS',
}

export const FARMERS: Farmer[] = [
  { id: 'FM-01', name: 'Kwame Owusu', phone: '+233 24 118 2290', community: 'Ejisu', initials: 'KO', avatarHue: 28, memberSince: '2023-03-11', tags: ['Preferred Supplier'], nearestBranchId: 'BR-01' },
  { id: 'FM-02', name: 'Ama Boateng', phone: '+233 20 774 5581', community: 'Bekwai', initials: 'AB', avatarHue: 152, memberSince: '2022-11-02', tags: [], nearestBranchId: 'BR-03' },
  { id: 'FM-03', name: 'Kofi Asante', phone: '+233 27 902 3317', community: 'Mampong', initials: 'KA', avatarHue: 205, memberSince: '2024-01-19', tags: [], nearestBranchId: 'BR-02' },
  { id: 'FM-04', name: 'Akosua Mensah', phone: '+233 55 331 0087', community: 'Konongo', initials: 'AM', avatarHue: 340, memberSince: '2023-07-06', tags: ['High Volume', 'Reliable'], nearestBranchId: 'BR-01' },
  { id: 'FM-05', name: 'Yaw Darko', phone: '+233 24 660 4412', community: 'Juaben', initials: 'YD', avatarHue: 42, memberSince: '2021-09-23', tags: ['Reliable'], nearestBranchId: 'BR-01' },
  { id: 'FM-06', name: 'Abena Osei', phone: '+233 26 118 9954', community: 'Offinso', initials: 'AO', avatarHue: 190, memberSince: '2024-04-02', tags: ['Needs Follow-up'], nearestBranchId: 'BR-02' },
]

// Tallawah Foods' 3 collection branches, spread across Ashanti Region so
// "which is nearest to you" is a real question for farmers, not a formality.
export const BRANCHES: Branch[] = [
  { id: 'BR-01', name: 'Kumasi (Main Depot)', community: 'Kumasi', lat: FACTORY.lat, lng: FACTORY.lng },
  { id: 'BR-02', name: 'Mampong Branch', community: 'Mampong', lat: 7.0631, lng: -1.4003 },
  { id: 'BR-03', name: 'Bekwai Branch', community: 'Bekwai', lat: 6.4514, lng: -1.5786 },
]

export const VEHICLES: Vehicle[] = [
  { id: 'VH-1', plate: 'AS 2451-23', model: 'Canter Flatbed', capacityBags: 120 },
  { id: 'VH-2', plate: 'AS 7788-22', model: 'Canter Flatbed', capacityBags: 120 },
  { id: 'VH-3', plate: 'AS 3390-24', model: 'Hyundai Mighty', capacityBags: 120 },
  { id: 'VH-4', plate: 'AS 5512-21', model: 'Canter Flatbed', capacityBags: 120 },
  { id: 'VH-5', plate: 'AS 9021-24', model: 'Hyundai Mighty', capacityBags: 120 },
]

export const DRIVERS: Driver[] = [
  { id: 'DR-1', name: 'Kojo Mensah', phone: '+233 24 552 8871', vehicleId: 'VH-1', status: 'on_route', avatarHue: 18, initials: 'KM', homeLocation: { lat: FACTORY.lat + 0.01, lng: FACTORY.lng - 0.01 } },
  { id: 'DR-2', name: 'Yaw Boakye', phone: '+233 27 340 9012', vehicleId: 'VH-2', status: 'on_route', avatarHue: 265, initials: 'YB', homeLocation: { lat: FACTORY.lat - 0.008, lng: FACTORY.lng + 0.012 } },
  { id: 'DR-3', name: 'Nana Adusei', phone: '+233 20 118 7742', vehicleId: 'VH-3', status: 'on_route', avatarHue: 95, initials: 'NA', homeLocation: { lat: FACTORY.lat + 0.006, lng: FACTORY.lng + 0.009 } },
  { id: 'DR-4', name: 'Comfort Appiah', phone: '+233 55 887 2201', vehicleId: 'VH-4', status: 'available', avatarHue: 322, initials: 'CA', homeLocation: { lat: FACTORY.lat - 0.012, lng: FACTORY.lng - 0.006 } },
  { id: 'DR-5', name: 'Isaac Frimpong', phone: '+233 24 003 6612', vehicleId: 'VH-5', status: 'off_duty', avatarHue: 48, initials: 'IF', homeLocation: { lat: FACTORY.lat + 0.014, lng: FACTORY.lng + 0.002 } },
]

// Export compliance + the separate online store — not modeled anywhere else in
// the app, so this is the MD dashboard's own reference data (dates are relative
// to seed load time below, same convention as the rest of this file).
export const EXPORT_CLEARANCES: ExportClearance[] = [
  { id: 'CLR-US', market: 'United States', authority: 'FDA (equivalent)', status: 'approved', updatedAt: '2026-06-02', note: 'Facility registration renewed; canned and frozen SKUs cleared.' },
  { id: 'CLR-UK', market: 'United Kingdom', authority: 'FSA (equivalent)', status: 'in_review', updatedAt: '2026-07-18', note: 'Awaiting a final audit date from the inspecting authority.' },
  { id: 'CLR-CA', market: 'Canada', authority: 'CFIA (equivalent)', status: 'pending', updatedAt: '2026-05-20', note: 'Application submitted; documentation review in progress.' },
]

export const WAREHOUSES: WarehouseSite[] = [
  { id: 'WH-UK', country: 'United Kingdom', city: 'London (Tilbury)', status: 'ready', capacityTons: 40 },
  { id: 'WH-US', country: 'United States', city: 'Newark, NJ', status: 'in_setup', capacityTons: 60, targetDate: '2026-10-01' },
  { id: 'WH-CA', country: 'Canada', city: 'Toronto', status: 'not_started', capacityTons: 25, targetDate: '2027-01-15' },
]

export const ONLINE_STORE: OnlineStoreSnapshot = {
  revenueMtdUsd: 18450,
  revenueLastMonthUsd: 15200,
  ordersMtd: 612,
  ordersLastMonth: 498,
  avgOrderValueUsd: 30.15,
  topMarket: 'United Kingdom',
}

function communityFor(name: string) {
  return FARM_COMMUNITIES.find((c) => c.community === name) ?? FARM_COMMUNITIES[0]
}

function locationFor(farmer: Farmer, labelSuffix: string) {
  const base = communityFor(farmer.community)
  const p = jitter(base, 2.4)
  return {
    label: `${farmer.name.split(' ')[0]}'s farm${labelSuffix}`,
    community: farmer.community,
    lat: p.lat,
    lng: p.lng,
  }
}

// ---- A day already partway in progress, so the dashboards read as "live ops" ----
// Timestamps are relative to seed time (module load = "now" for demo purposes).
const T0 = Date.now()
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export function buildSeed() {
  const requests: FarmerRequest[] = [
    {
      id: 'REQ-118',
      farmerId: 'FM-01',
      farmerName: 'Kwame Owusu',
      farmerPhone: FARMERS[0].phone,
      location: locationFor(FARMERS[0], ''),
      estimatedBags: 14,
      requestType: 'staff_pickup',
      branchId: 'BR-01',
      status: 'fulfilled',
      createdAt: T0 - 4.5 * DAY,
      routeId: 'RT-031',
    },
    {
      id: 'REQ-142',
      farmerId: 'FM-03',
      farmerName: 'Kofi Asante',
      farmerPhone: FARMERS[2].phone,
      location: locationFor(FARMERS[2], ''),
      estimatedBags: 22,
      requestType: 'staff_pickup',
      branchId: 'BR-02',
      status: 'assigned',
      createdAt: T0 - 3 * HOUR,
      routeId: 'RT-041',
    },
    {
      id: 'REQ-143',
      farmerId: 'FM-05',
      farmerName: 'Yaw Darko',
      farmerPhone: FARMERS[4].phone,
      location: locationFor(FARMERS[4], ''),
      estimatedBags: 18,
      requestType: 'staff_pickup',
      branchId: 'BR-01',
      status: 'assigned',
      createdAt: T0 - 2.6 * HOUR,
      routeId: 'RT-041',
    },
    {
      id: 'REQ-144',
      farmerId: 'FM-02',
      farmerName: 'Ama Boateng',
      farmerPhone: FARMERS[1].phone,
      location: locationFor(FARMERS[1], ''),
      estimatedBags: 9,
      requestType: 'self_drop',
      branchId: 'BR-03',
      status: 'unassigned',
      createdAt: T0 - 1.4 * HOUR,
    },
    {
      id: 'REQ-145',
      farmerId: 'FM-04',
      farmerName: 'Akosua Mensah',
      farmerPhone: FARMERS[3].phone,
      location: locationFor(FARMERS[3], ''),
      estimatedBags: 27,
      requestType: 'staff_pickup',
      branchId: 'BR-01',
      status: 'assigned',
      createdAt: T0 - 55 * MIN,
      routeId: 'RT-043',
    },
    {
      id: 'REQ-147',
      farmerId: 'FM-01',
      farmerName: 'Kwame Owusu',
      farmerPhone: FARMERS[0].phone,
      location: locationFor(FARMERS[0], ''),
      estimatedBags: 16,
      requestType: 'staff_pickup',
      branchId: 'BR-01',
      status: 'assigned',
      createdAt: T0 - 2 * HOUR,
      routeId: 'RT-042',
    },
    {
      id: 'REQ-146',
      farmerId: 'FM-06',
      farmerName: 'Abena Osei',
      farmerPhone: FARMERS[5].phone,
      location: locationFor(FARMERS[5], ''),
      estimatedBags: 11,
      requestType: 'staff_pickup',
      branchId: 'BR-02',
      status: 'flagged',
      createdAt: T0 - 5 * HOUR,
      exceptionId: 'EXC-004',
    },
  ]

  const routes: Route[] = [
    {
      id: 'RT-031',
      requestIds: ['REQ-118'],
      vehicleId: 'VH-5',
      driverId: 'DR-5',
      scheduledDate: todayIso(T0 - 4.5 * DAY),
      totalEstimatedBags: 14,
      status: 'completed',
      createdAt: T0 - 4.6 * DAY,
      dispatchedAt: T0 - 4.5 * DAY,
    },
    {
      id: 'RT-041',
      requestIds: ['REQ-142', 'REQ-143'],
      vehicleId: 'VH-2',
      driverId: 'DR-2',
      scheduledDate: todayIso(T0),
      totalEstimatedBags: 40,
      status: 'dispatched',
      createdAt: T0 - 3 * HOUR,
      dispatchedAt: T0 - 40 * MIN,
    },
    {
      id: 'RT-042',
      requestIds: ['REQ-147'],
      vehicleId: 'VH-3',
      driverId: 'DR-3',
      scheduledDate: todayIso(T0),
      totalEstimatedBags: 16,
      status: 'dispatched',
      createdAt: T0 - 2.1 * HOUR,
      dispatchedAt: T0 - 72 * MIN,
    },
    {
      id: 'RT-043',
      requestIds: ['REQ-145'],
      vehicleId: 'VH-1',
      driverId: 'DR-1',
      scheduledDate: todayIso(T0),
      totalEstimatedBags: 27,
      status: 'dispatched',
      createdAt: T0 - 50 * MIN,
      dispatchedAt: T0 - 20 * MIN,
    },
  ]

  const req142 = requests.find((r) => r.id === 'REQ-142')!
  const req143 = requests.find((r) => r.id === 'REQ-143')!
  const req145 = requests.find((r) => r.id === 'REQ-145')!
  const req147 = requests.find((r) => r.id === 'REQ-147')!

  const shipments: Shipment[] = [
    {
      id: 'SHP-041',
      routeId: 'RT-041',
      driverId: 'DR-2',
      vehicleId: 'VH-2',
      status: 'active',
      startedAt: T0 - 40 * MIN,
      position: jitter({ lat: (FACTORY.lat + req142.location.lat) / 2, lng: (FACTORY.lng + req142.location.lng) / 2 }, 1),
      legIndex: 0,
      legProgress: 0.55,
      legStartedAt: T0 - 0.55 * 16000,
      legDurationMs: 16000,
      stops: [
        {
          requestId: 'REQ-142',
          farmerId: 'FM-03',
          farmerName: 'Kofi Asante',
          location: req142.location,
          estimatedBags: 22,
          status: 'pending',
        },
        {
          requestId: 'REQ-143',
          farmerId: 'FM-05',
          farmerName: 'Yaw Darko',
          location: req143.location,
          estimatedBags: 18,
          status: 'pending',
        },
      ],
    },
    {
      id: 'SHP-042',
      routeId: 'RT-042',
      driverId: 'DR-3',
      vehicleId: 'VH-3',
      status: 'active',
      startedAt: T0 - 72 * MIN,
      position: jitter({ lat: (FACTORY.lat + req147.location.lat) / 2, lng: (FACTORY.lng + req147.location.lng) / 2 }, 1),
      legIndex: 0,
      legProgress: 0.35,
      legStartedAt: T0 - 0.35 * 19000,
      legDurationMs: 19000,
      stops: [
        {
          requestId: 'REQ-147',
          farmerId: 'FM-01',
          farmerName: 'Kwame Owusu',
          location: req147.location,
          estimatedBags: 16,
          status: 'pending',
        },
      ],
    },
    {
      id: 'SHP-043',
      routeId: 'RT-043',
      driverId: 'DR-1',
      vehicleId: 'VH-1',
      status: 'active',
      startedAt: T0 - 20 * MIN,
      position: jitter({ lat: (FACTORY.lat + req145.location.lat) / 2, lng: (FACTORY.lng + req145.location.lng) / 2 }, 1),
      legIndex: 0,
      legProgress: 0.7,
      legStartedAt: T0 - 0.7 * 15000,
      legDurationMs: 15000,
      stops: [
        {
          requestId: 'REQ-145',
          farmerId: 'FM-04',
          farmerName: 'Akosua Mensah',
          location: req145.location,
          estimatedBags: 27,
          status: 'pending',
        },
      ],
    },
  ]

  const stock: StockEntry[] = [
    {
      id: 'STK-FM-01-a1',
      shipmentId: 'SHP-020',
      farmerId: 'FM-01',
      farmerName: 'Kwame Owusu',
      bags: 14,
      quality: 'pass',
      packaging: 'unopened',
      receivedAt: T0 - 4.5 * DAY,
      freshnessHours: 108,
      receivedBy: STAFF_USER.name,
    },
    {
      id: 'STK-FM-04-b2',
      shipmentId: 'SHP-019',
      farmerId: 'FM-04',
      farmerName: 'Akosua Mensah',
      bags: 20,
      quality: 'pass',
      packaging: 'open',
      receivedAt: T0 - 30 * HOUR,
      freshnessHours: 48,
      receivedBy: STAFF_USER.name,
    },
    {
      id: 'STK-FM-06-c3',
      shipmentId: 'SHP-018',
      farmerId: 'FM-06',
      farmerName: 'Abena Osei',
      bags: 8,
      quality: 'fail',
      packaging: 'open',
      receivedAt: T0 - 33 * HOUR,
      freshnessHours: 48,
      receivedBy: STAFF_USER.name,
    },
    // earlier cycles, kept for lifetime-volume history on the CRM profile —
    // dated further back than any current request, so they don't affect
    // "last activity" / going-quiet status, only lifetime totals.
    {
      id: 'STK-FM-02-p1',
      shipmentId: 'SHP-011',
      farmerId: 'FM-02',
      farmerName: 'Ama Boateng',
      bags: 16,
      quality: 'pass',
      packaging: 'unopened',
      receivedAt: T0 - 12 * DAY,
      freshnessHours: 108,
      receivedBy: STAFF_USER.name,
    },
    {
      id: 'STK-FM-05-p2',
      shipmentId: 'SHP-009',
      farmerId: 'FM-05',
      farmerName: 'Yaw Darko',
      bags: 22,
      quality: 'pass',
      packaging: 'unopened',
      receivedAt: T0 - 19 * DAY,
      freshnessHours: 108,
      receivedBy: STAFF_USER.name,
    },
  ]

  const exceptions: ExceptionItem[] = [
    {
      id: 'EXC-004',
      relatedType: 'request',
      relatedId: 'REQ-146',
      type: 'farmer_not_ready',
      note: 'Abena says bags will be ready tomorrow morning instead — rain delayed drying.',
      status: 'open',
      createdAt: T0 - 4.5 * HOUR,
    },
  ]

  const farmerNotes: FarmerNote[] = [
    {
      id: 'NOTE-001',
      farmerId: 'FM-01',
      authorName: STAFF_USER.name,
      text: "Hasn't responded to our check-in message — may be selling to another buyer nearby. Worth a phone call before we lose him.",
      createdAt: T0 - 1.5 * DAY,
    },
    {
      id: 'NOTE-002',
      farmerId: 'FM-06',
      authorName: STAFF_USER.name,
      text: 'Talked through the failed batch with her — says heavy rain affected drying. Offered to send our drying guidance sheet.',
      createdAt: T0 - 4 * HOUR,
    },
  ]

  const followUpTasks: FollowUpTask[] = [
    {
      id: 'TASK-001',
      farmerId: 'FM-01',
      note: 'Call Kwame about harvest status — 4+ days quiet',
      dueDate: todayIso(T0),
      done: false,
      createdAt: T0 - 1.5 * DAY,
    },
    {
      id: 'TASK-002',
      farmerId: 'FM-06',
      note: 'Follow up on drying technique after quality fail',
      dueDate: todayIso(T0 + 2 * DAY),
      done: false,
      createdAt: T0 - 4 * HOUR,
    },
  ]

  return { requests, routes, shipments, stock, exceptions, farmerNotes, followUpTasks }
}

export { locationFor }
