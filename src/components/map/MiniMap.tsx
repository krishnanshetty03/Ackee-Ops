import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { GeoPoint } from '../../lib/types'
import { tileUrl } from './tiles'
import { pinPulseIcon } from './markerIcons'
import type { Theme } from '../../lib/useTheme'

/** Small, non-interactive map used inside the WhatsApp location bubble — deliberately
 * static (no drag/zoom/scroll) to read like a real WhatsApp location-share preview. */
export function MiniMap({ point, height = 148, hue = 40, theme }: { point: GeoPoint; height?: number; hue?: number; theme: Theme }) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!el.current || mapRef.current) return
    const map = L.map(el.current, {
      center: [point.lat, point.lng],
      zoom: 14,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: false,
    })
    L.tileLayer(tileUrl(theme), { subdomains: 'abcd', maxZoom: 19 }).addTo(map)
    markerRef.current = L.marker([point.lat, point.lng], { icon: pinPulseIcon(hue) }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Follow the point when it changes. The driver's home screen swaps this
   *  between stops as the route progresses; without this the map would sit on
   *  wherever it was first mounted and quietly show the wrong place. */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setView([point.lat, point.lng], map.getZoom())
    markerRef.current?.setLatLng([point.lat, point.lng])
    markerRef.current?.setIcon(pinPulseIcon(hue))
  }, [point.lat, point.lng, hue])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer)
    })
    L.tileLayer(tileUrl(theme), { subdomains: 'abcd', maxZoom: 19 }).addTo(map)
  }, [theme])

  return (
    <div
      ref={el}
      style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', background: 'var(--surface-inset)' }}
      aria-label="Shared location preview"
    />
  )
}
