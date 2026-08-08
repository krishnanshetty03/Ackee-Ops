export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>'

export function tileUrl(theme: 'light' | 'dark') {
  const variant = theme === 'dark' ? 'dark_all' : 'light_all'
  return `https://{s}.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}{r}.png`
}
