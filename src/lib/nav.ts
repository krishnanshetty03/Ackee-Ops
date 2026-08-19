/** Hand a destination off to the phone's maps app for real turn-by-turn
 *  directions — the app plots where a stop *is*, but getting there is a job for
 *  whatever the driver already has installed. */
export function navigateTo(lat: number, lng: number) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener,noreferrer')
}
