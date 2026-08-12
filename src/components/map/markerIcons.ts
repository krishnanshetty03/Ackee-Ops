import L from 'leaflet'

// Raw-HTML Leaflet divIcons with inline SVG, styled via CSS custom properties so
// they stay on-brand and theme-aware without any extra image assets.

export function factoryIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:var(--brand-black);box-shadow:0 3px 10px rgba(0,0,0,.45),0 0 0 3px var(--gold-fill);display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0C000" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3.5 20V11l5 3V11l5 3V6.5l5 3.5V20Z"/><path d="M3.5 20h16.5"/><path d="M17 6.5V4h2v1.3"/>
          </svg>
        </div>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

export function farmIcon(state: 'pending' | 'arrived' | 'completed') {
  const bg = state === 'completed' ? 'var(--green)' : state === 'arrived' ? 'var(--gold-fill)' : 'var(--surface)'
  const stroke = state === 'pending' ? 'var(--border-strong)' : 'transparent'
  const glyphColor = state === 'pending' ? 'var(--text-2)' : state === 'arrived' ? '#241a02' : '#fff'
  const pulse = state === 'arrived' ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:var(--gold-fill);opacity:.35;animation:mappulse 1.6s ease-out infinite;"></div>` : ''
  const glyph =
    state === 'completed'
      ? `<path d="M6 12.5l3.5 3.5L18 7.5"/>`
      : `<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2"/>`
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:30px;height:30px;">
        ${pulse}
        <div style="position:absolute;inset:0;border-radius:50% 50% 50% 4px;transform:rotate(45deg);background:${bg};border:1.5px solid ${stroke};box-shadow:0 2px 6px rgba(20,14,4,.3);"></div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${glyphColor}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"
          style="position:absolute;top:6px;left:7.5px;">
          ${glyph}
        </svg>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 27],
  })
}

export function truckIcon(hue: number, bearing: number, moving: boolean, emphasized = false) {
  const outer = emphasized ? 50 : 38
  const core = emphasized ? 38 : 30
  const glyph = emphasized ? 21 : 17
  const ring = emphasized ? `0 0 0 3px #fff, 0 0 0 5.5px #F0C000, 0 5px 14px rgba(0,0,0,.4)` : `0 3px 8px rgba(0,0,0,.35)`
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${outer}px;height:${outer}px;display:flex;align-items:center;justify-content:center;">
        ${moving ? `<div style="position:absolute;inset:0;border-radius:50%;background:hsl(${hue} 70% 55% / .28);animation:mappulse 1.4s ease-out infinite;"></div>` : ''}
        ${
          emphasized && moving
            ? `<div style="position:absolute;top:-3px;right:-1px;width:11px;height:11px;border-radius:50%;background:#e0303a;border:2px solid #fff;z-index:2;animation:mappulse 1.6s ease-out infinite;box-shadow:0 1px 3px rgba(0,0,0,.4);"></div>`
            : ''
        }
        <div style="width:${core}px;height:${core}px;border-radius:50%;background:linear-gradient(155deg,hsl(${hue} 62% 60%),hsl(${hue} 58% 42%));border:2px solid var(--surface);box-shadow:${ring};display:flex;align-items:center;justify-content:center;">
          <svg width="${glyph}" height="${glyph}" viewBox="0 0 24 24" style="transform:rotate(${bearing}deg);transition:transform .5s ease;">
            <rect x="5.8" y="3" width="12.4" height="17.5" rx="5" fill="#fff"/>
            <rect x="7.5" y="5.2" width="9" height="4.6" rx="2" fill="#000" fill-opacity=".28"/>
            <circle cx="6.4" cy="8.6" r="1.15" fill="#fff"/>
            <circle cx="17.6" cy="8.6" r="1.15" fill="#fff"/>
          </svg>
        </div>
      </div>`,
    iconSize: [outer, outer],
    iconAnchor: [outer / 2, outer / 2],
  })
}

export function pinPulseIcon(hue = 40) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:26px;height:26px;">
        <div style="position:absolute;inset:-4px;border-radius:50%;background:hsl(${hue} 70% 50% / .3);animation:mappulse 1.6s ease-out infinite;"></div>
        <div style="position:absolute;inset:0;border-radius:50% 50% 50% 4px;transform:rotate(45deg);background:hsl(${hue} 68% 48%);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>
      </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
  })
}
