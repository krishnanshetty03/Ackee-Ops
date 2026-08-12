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

// Same silhouette as the bespoke TruckIllustration on the Fleet card (gold box,
// kente accent band, dark cab, real wheels) — flattened for repeated small-size
// rendering (no gradients, since divIcon HTML is regenerated every sim tick and
// gradient <defs> ids would collide once more than one truck is on screen).
export function truckIcon(hue: number, bearing: number, moving: boolean, emphasized = false) {
  const w = emphasized ? 48 : 36
  const h = Math.round(w * 0.58)
  // side-view art, so we mirror left/right to face the direction of travel
  // instead of rotating a top-down glyph through arbitrary angles
  const flip = Math.sin((bearing * Math.PI) / 180) < 0 ? -1 : 1
  const dropShadow = emphasized
    ? `drop-shadow(0 2px 3px rgba(0,0,0,.4)) drop-shadow(0 0 0 2px #fff) drop-shadow(0 0 5px #F0C000)`
    : `drop-shadow(0 2px 3px rgba(0,0,0,.4))`
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${w}px;height:${h}px;">
        ${moving ? `<div style="position:absolute;inset:-7px;border-radius:50%;background:hsl(${hue} 70% 55% / .22);animation:mappulse 1.4s ease-out infinite;"></div>` : ''}
        ${
          emphasized && moving
            ? `<div style="position:absolute;top:-4px;${flip === 1 ? 'right' : 'left'}:8px;width:10px;height:10px;border-radius:50%;background:#e0303a;border:2px solid #fff;z-index:2;animation:mappulse 1.6s ease-out infinite;box-shadow:0 1px 3px rgba(0,0,0,.4);"></div>`
            : ''
        }
        <svg width="${w}" height="${h}" viewBox="0 0 100 58" style="position:relative;transform:scaleX(${flip});filter:${dropShadow};">
          <rect x="10" y="10" width="56" height="34" rx="4.5" fill="#f0c000" stroke="#8a6a00" stroke-width="1.2"/>
          <rect x="10" y="32" width="56" height="5" fill="#141414"/>
          <rect x="10" y="32" width="9" height="5" fill="#0f7a34"/>
          <rect x="25" y="32" width="8" height="5" fill="#141414"/>
          <rect x="37" y="32" width="9" height="5" fill="#d81e28"/>
          <rect x="51" y="32" width="8" height="5" fill="#141414"/>
          <rect x="60" y="32" width="6" height="5" fill="#0f7a34"/>
          <path d="M66 18h13.5l7.5 9.5V40a2.3 2.3 0 0 1-2.3 2.3H66Z" fill="#181818" stroke="#000" stroke-width="0.6"/>
          <path d="M68.5 21.5h7l5.3 6.3H68.5Z" fill="#a9cfdd"/>
          <circle cx="85.5" cy="27" r="1.6" fill="#ffe27a"/>
          <circle cx="27" cy="47" r="7.2" fill="#161616"/>
          <circle cx="27" cy="47" r="3.3" fill="#565656"/>
          <circle cx="72" cy="47" r="7.2" fill="#161616"/>
          <circle cx="72" cy="47" r="3.3" fill="#565656"/>
        </svg>
      </div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
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
