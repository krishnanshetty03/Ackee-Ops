import type { GeoPoint } from './types'

// Approximate coordinates around Ashanti Region, Ghana — plausible farm-to-factory
// geography for a produce operator based near Kumasi. Good enough for a demo map;
// not survey-grade.
export const FACTORY = {
  label: 'Tallawah Foods — Kumasi Processing Depot',
  community: 'Kaase Industrial Area, Kumasi',
  lat: 6.6684,
  lng: -1.6244,
}

export interface FarmCommunity {
  community: string
  lat: number
  lng: number
}

export const FARM_COMMUNITIES: FarmCommunity[] = [
  { community: 'Ejisu', lat: 6.7167, lng: -1.3667 },
  { community: 'Juaben', lat: 6.7333, lng: -1.3333 },
  { community: 'Bekwai', lat: 6.4514, lng: -1.5786 },
  { community: 'Konongo', lat: 6.6167, lng: -1.2167 },
  { community: 'Mampong', lat: 7.0631, lng: -1.4003 },
  { community: 'Offinso', lat: 7.1667, lng: -1.6667 },
  { community: 'Effiduase', lat: 6.9333, lng: -1.3333 },
  { community: 'Fomena', lat: 6.3167, lng: -1.4833 },
  { community: 'Kwabre', lat: 6.7833, lng: -1.6167 },
  { community: 'Asante Akyem', lat: 6.7500, lng: -1.1667 },
]

export function jitter(point: GeoPoint, seedKm = 3): GeoPoint {
  // small deterministic-ish jitter so multiple farms in the same community
  // don't stack exactly on top of each other on the map
  const dLat = (Math.random() - 0.5) * (seedKm / 111)
  const dLng = (Math.random() - 0.5) * (seedKm / 88)
  return { lat: point.lat + dLat, lng: point.lng + dLng }
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function lerp(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

/** bearing in degrees (0 = north, 90 = east) from a to b, for rotating a truck glyph */
export function bearingDeg(a: GeoPoint, b: GeoPoint): number {
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const deg = (Math.atan2(y, x) * 180) / Math.PI
  return (deg + 360) % 360
}
