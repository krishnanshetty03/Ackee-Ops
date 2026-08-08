// Bespoke flat-shaded truck illustration in the Tallawah palette — built as an
// original piece (gradients + a kente accent band + a leaf badge on the box)
// rather than a stock photo or generic delivery-truck icon.
export function TruckIllustration({ width = 260 }: { width?: number }) {
  const height = width * 0.56
  return (
    <svg width={width} height={height} viewBox="0 0 300 168" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tw-box" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe27a" />
          <stop offset="55%" stopColor="#f0c000" />
          <stop offset="100%" stopColor="#c99a00" />
        </linearGradient>
        <linearGradient id="tw-cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b2b2b" />
          <stop offset="100%" stopColor="#101010" />
        </linearGradient>
        <radialGradient id="tw-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tw-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bcd9e6" />
          <stop offset="100%" stopColor="#89b6c8" />
        </linearGradient>
      </defs>

      <ellipse cx="150" cy="153" rx="118" ry="11" fill="url(#tw-shadow)" />

      {/* cargo box */}
      <rect x="34" y="34" width="164" height="92" rx="9" fill="url(#tw-box)" stroke="#8a6a00" strokeWidth="1.5" />
      {/* kente accent band */}
      <rect x="34" y="88" width="164" height="9" fill="#141414" />
      <g opacity="0.95">
        <rect x="34" y="88" width="10" height="9" fill="#0f7a34" />
        <rect x="52" y="88" width="8" height="9" fill="#f0c000" />
        <rect x="68" y="88" width="6" height="9" fill="#141414" />
        <rect x="82" y="88" width="10" height="9" fill="#d81e28" />
        <rect x="100" y="88" width="8" height="9" fill="#141414" />
        <rect x="116" y="88" width="10" height="9" fill="#0f7a34" />
        <rect x="134" y="88" width="8" height="9" fill="#f0c000" />
        <rect x="150" y="88" width="6" height="9" fill="#141414" />
        <rect x="164" y="88" width="10" height="9" fill="#d81e28" />
        <rect x="182" y="88" width="16" height="9" fill="#0f7a34" />
      </g>
      {/* gloss streak */}
      <path d="M50 34 L70 34 L44 126 L28 126 Z" fill="#fff" opacity="0.16" />

      {/* leaf badge */}
      <circle cx="116" cy="62" r="19" fill="#141414" />
      <circle cx="116" cy="62" r="19" fill="none" stroke="#f0c000" strokeWidth="1.4" />
      <path d="M124.5 53.5c.5 6.6-2.5 11-7.8 12.6-4.2 1.3-6.2-1.6-5.2-5 1.2-4 5.2-6.7 13-7.6Z" fill="#0f7a34" />
      <path d="M124 54c-4.2 3-6.6 5.5-8.4 8.6" stroke="#0f7a34" strokeWidth="0.9" strokeLinecap="round" />

      {/* cab */}
      <path d="M198 58h34l18 20v33a5 5 0 0 1-5 5h-47Z" fill="url(#tw-cab)" stroke="#000" strokeWidth="1.2" />
      <path d="M204 64h20l13 15h-33Z" fill="url(#tw-glass)" />
      <rect x="203" y="98" width="30" height="10" rx="2" fill="#f0c000" opacity="0.9" />
      <circle cx="245" cy="79" r="3.4" fill="#ffe27a" stroke="#8a6a00" strokeWidth="1" />

      {/* wheels */}
      <g>
        <circle cx="88" cy="130" r="17" fill="#161616" />
        <circle cx="88" cy="130" r="9.5" fill="#3a3a3a" />
        <circle cx="88" cy="130" r="3.4" fill="#8a8a8a" />
      </g>
      <g>
        <circle cx="222" cy="130" r="17" fill="#161616" />
        <circle cx="222" cy="130" r="9.5" fill="#3a3a3a" />
        <circle cx="222" cy="130" r="3.4" fill="#8a8a8a" />
      </g>
    </svg>
  )
}
