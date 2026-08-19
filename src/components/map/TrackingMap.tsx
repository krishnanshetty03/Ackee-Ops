import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { Driver, Shipment } from '../../lib/types'
import { FACTORY } from '../../lib/geo'
import { bearingDeg } from '../../lib/geo'
import { tileUrl } from './tiles'
import { factoryIcon, farmIcon, truckIcon } from './markerIcons'
import type { Theme } from '../../lib/useTheme'

function waypointsFor(shipment: Pick<Shipment, 'stops'>) {
  return [FACTORY, ...shipment.stops.map((s) => s.location), FACTORY]
}

export function TrackingMap({
  shipments,
  drivers,
  theme,
  focusShipmentId,
  onSelectShipment,
  scrollWheelZoom = true,
  follow = false,
}: {
  shipments: Shipment[]
  drivers: Driver[]
  theme: Theme
  focusShipmentId: string | null
  onSelectShipment: (id: string) => void
  /** disable when the map is embedded inline in a scrollable page (e.g. a dashboard
   *  hero card) so the mouse wheel scrolls the page instead of hijacking to zoom */
  scrollWheelZoom?: boolean
  /** keep the camera centered on the focused shipment as it moves, like a live rider tracker */
  follow?: boolean
}) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const truckMarkers = useRef(new Map<string, L.Marker>())
  const stopMarkers = useRef(new Map<string, L.Marker>())
  const routeLines = useRef(new Map<string, L.Polyline>())
  const lastFocus = useRef<string | null>(null)
  const onSelectRef = useRef(onSelectShipment)
  onSelectRef.current = onSelectShipment

  // ---- mount once ----
  useEffect(() => {
    if (!el.current || mapRef.current) return
    const map = L.map(el.current, { zoomControl: true, attributionControl: true, minZoom: 8, maxZoom: 16, scrollWheelZoom }).setView([FACTORY.lat, FACTORY.lng], 10.4)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.attributionControl.setPrefix(false)
    const tiles = L.tileLayer(tileUrl(theme), { subdomains: 'abcd', maxZoom: 19 }).addTo(map)
    tileLayerRef.current = tiles

    L.marker([FACTORY.lat, FACTORY.lng], { icon: factoryIcon(), zIndexOffset: 500 })
      .addTo(map)
      .bindTooltip('Tallawah Foods — Kumasi Depot', { direction: 'top', offset: [0, -18] })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      // Every marker/line cached below belongs to the map instance we just
      // destroyed. Without clearing these too, the next mount (StrictMode's
      // dev-only double-invoke does exactly this once) finds "existing"
      // entries in the cache and just updates them in place instead of
      // re-adding — leaving them orphaned on a map that no longer exists,
      // and the new map effectively empty. Clearing forces a clean re-add.
      truckMarkers.current.clear()
      stopMarkers.current.clear()
      routeLines.current.clear()
      lastFocus.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- theme swap ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !tileLayerRef.current) return
    map.removeLayer(tileLayerRef.current)
    const tiles = L.tileLayer(tileUrl(theme), { subdomains: 'abcd', maxZoom: 19 }).addTo(map)
    tileLayerRef.current = tiles
    tiles.bringToBack()
  }, [theme])

  // ---- live shipment/marker diffing (runs on every sim tick) ----
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const liveShipmentIds = new Set(shipments.filter((s) => s.status === 'active' || s.status === 'arrived_factory').map((s) => s.id))
    const liveStopKeys = new Set<string>()

    for (const sh of shipments) {
      const isLive = sh.status === 'active' || sh.status === 'arrived_factory'
      if (!isLive) continue
      const driver = drivers.find((d) => d.id === sh.driverId)
      const hue = driver?.avatarHue ?? 40
      const waypoints = waypointsFor(sh)
      const from = waypoints[Math.min(sh.legIndex, waypoints.length - 2)]
      const to = waypoints[Math.min(sh.legIndex + 1, waypoints.length - 1)]
      const bearing = bearingDeg(from, to)
      const moving = sh.status === 'active' && sh.legProgress < 0.98

      const focused = sh.id === focusShipmentId
      let truck = truckMarkers.current.get(sh.id)
      if (!truck) {
        truck = L.marker([sh.position.lat, sh.position.lng], { icon: truckIcon(hue, bearing, moving, focused), zIndexOffset: 700 }).addTo(map)
        truck.on('click', () => onSelectRef.current(sh.id))
        truckMarkers.current.set(sh.id, truck)
      } else {
        truck.setLatLng([sh.position.lat, sh.position.lng])
        truck.setIcon(truckIcon(hue, bearing, moving, focused))
      }
      truck.setZIndexOffset(focused ? 900 : 700)
      if (focused && follow) map.panTo([sh.position.lat, sh.position.lng], { animate: true, duration: 0.22, easeLinearity: 1 })
      truck.unbindTooltip()
      truck.bindTooltip(`${driver?.name ?? sh.driverId} · ${sh.id}`, { direction: 'top', offset: [0, -16] })

      // stops
      sh.stops.forEach((stop) => {
        const key = `${sh.id}-${stop.requestId}`
        liveStopKeys.add(key)
        const state = stop.status === 'completed' ? 'completed' : stop.status === 'arrived' ? 'arrived' : 'pending'
        let m = stopMarkers.current.get(key)
        if (!m) {
          m = L.marker([stop.location.lat, stop.location.lng], { icon: farmIcon(state), zIndexOffset: 400 }).addTo(map)
          m.on('click', () => onSelectRef.current(sh.id))
          stopMarkers.current.set(key, m)
        } else {
          m.setIcon(farmIcon(state))
        }
        m.unbindTooltip()
        m.bindTooltip(`${stop.farmerName} — ${stop.estimatedBags} bags (${state})`, { direction: 'top', offset: [0, -22] })
      })

      // route polyline — the focused shipment gets a bold, animated "live" route
      // (solid brand gold + flowing dashes); everything else stays a quiet,
      // muted reference line so the eye goes straight to what's being tracked.
      let line = routeLines.current.get(sh.id)
      const latlngs = waypoints.map((w) => [w.lat, w.lng]) as [number, number][]
      const style = focused
        ? { color: '#F0C000', weight: 5, opacity: 0.95, dashArray: '12 10' }
        : { color: `hsl(${hue} 40% 55%)`, weight: 2, opacity: 0.35, dashArray: '1 8' }
      if (!line) {
        line = L.polyline(latlngs, { ...style, lineCap: 'round' }).addTo(map)
        routeLines.current.set(sh.id, line)
      } else {
        line.setLatLngs(latlngs)
        line.setStyle(style)
        if (focused) line.bringToFront()
      }
      // Leaflet's Path layers don't expose a public getElement() — the rendered
      // <path> lives on the semi-private _path property, the standard way to
      // reach it for cases (like this animation toggle) the public API doesn't cover.
      const pathEl = (line as unknown as { _path?: SVGPathElement })._path
      pathEl?.classList.toggle('tw-route-flow', focused)
    }

    // sweep markers/lines for shipments no longer live
    for (const [id, marker] of truckMarkers.current) {
      if (!liveShipmentIds.has(id)) {
        map.removeLayer(marker)
        truckMarkers.current.delete(id)
      }
    }
    for (const [id, line] of routeLines.current) {
      if (!liveShipmentIds.has(id)) {
        map.removeLayer(line)
        routeLines.current.delete(id)
      }
    }
    for (const [key, marker] of stopMarkers.current) {
      if (!liveStopKeys.has(key)) {
        map.removeLayer(marker)
        stopMarkers.current.delete(key)
      }
    }
  }, [shipments, drivers, focusShipmentId, follow])

  // ---- fly to a newly-focused shipment (not on every tick) ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusShipmentId || focusShipmentId === lastFocus.current) return
    lastFocus.current = focusShipmentId
    const sh = shipments.find((s) => s.id === focusShipmentId)
    if (!sh) return
    const pts = waypointsFor(sh).map((w) => [w.lat, w.lng]) as [number, number][]
    map.flyToBounds(L.latLngBounds(pts), { padding: [56, 56], duration: 0.9, maxZoom: 12.5 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusShipmentId])

  return <div ref={el} style={{ width: '100%', height: '100%' }} />
}
