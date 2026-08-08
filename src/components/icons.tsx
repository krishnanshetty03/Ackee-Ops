// Small hand-authored line-icon set — consistent 1.75 stroke, round caps/joins,
// 24x24 viewbox, currentColor so every icon inherits theme automatically.
// Kept self-contained (no icon-font/library dependency) for an offline demo build.
import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

function base(props: IconProps) {
  const { size = 18, ...rest } = props
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  }
}

export const Bell = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 9a6 6 0 1 1 12 0c0 3.4.9 5.2 1.6 6.2.3.4 0 1-.5 1H4.9c-.5 0-.8-.6-.5-1C5.1 14.2 6 12.4 6 9Z" />
    <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
  </svg>
)

export const Sun = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" />
  </svg>
)

export const Moon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
  </svg>
)

export const Truck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 6.5h10.5v9H2.5z" />
    <path d="M13 10h3.6L20 13v2.5h-7z" />
    <circle cx="6.5" cy="17.5" r="1.7" />
    <circle cx="17" cy="17.5" r="1.7" />
  </svg>
)

export const MapPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.4" />
  </svg>
)

export const Package = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 7.5 12 3l8.5 4.5V16L12 20.5 3.5 16Z" />
    <path d="M3.8 7.6 12 12l8.2-4.4M12 12v8.4" />
  </svg>
)

export const CheckCircle = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.3 12.3l2.5 2.5 5-5.2" />
  </svg>
)

export const AlertTriangle = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4 21.5 20h-19Z" />
    <path d="M12 10v4.2" />
    <circle cx="12" cy="17.3" r="0.15" fill="currentColor" stroke="none" />
    <path d="M12 17.1v.3" strokeWidth={2.6} />
  </svg>
)

export const Clock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const ChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 5.5 15.5 12 9 18.5" />
  </svg>
)

export const ChevronDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5.5 9 12 15.5 18.5 9" />
  </svg>
)

export const ChevronLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 5.5 8.5 12l6.5 6.5" />
  </svg>
)

export const Search = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="M20 20l-4.4-4.4" />
  </svg>
)

export const Plus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const Minus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
)

export const Check = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12.5 9.5 17 19 6.5" />
  </svg>
)

export const X = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const Send = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 3 3 10.5l7.2 2.7L21 3Z" />
    <path d="M10.2 13.2 21 3l-6.9 15.8-2.8-6.7Z" />
  </svg>
)

export const User = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8" />
  </svg>
)

export const Users = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M2.8 19c.7-3 3-4.8 6.2-4.8s5.5 1.8 6.2 4.8" />
    <path d="M16 5.5a3.2 3.2 0 0 1 0 6.2M20.4 19c-.5-2.2-1.7-3.7-3.6-4.4" />
  </svg>
)

export const BarChart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </svg>
)

export const Route = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="5.5" cy="18.5" r="2" />
    <circle cx="18.5" cy="5.5" r="2" />
    <path d="M7.3 17.3C13 13 11 11 12.7 6.7" strokeDasharray="2.5 3" />
  </svg>
)

export const Home = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9.5h12V10" />
  </svg>
)

export const ListChecks = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <path d="m3 6.5 1.3 1.3L6.8 5.3M3 12l1.3 1.3 2.5-2.6M3 17.5l1.3 1.3 2.5-2.6" />
  </svg>
)

export const ArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)

export const Filter = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5.5h16L14 13.5v5l-4 2v-7Z" />
  </svg>
)

export const Phone = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3c0 1-.9 1.8-1.9 1.6-8-1.2-13-6.2-14.2-14.2-.2-1 .6-1.9 1.6-1.9Z" />
  </svg>
)

export const Menu = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </svg>
)

export const Sparkles = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5 13.5 9l5.5 1.5-5.5 1.5L12 17.5 10.5 12 5 10.5 10.5 9Z" />
    <path d="M19 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" />
  </svg>
)

export const Play = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4.8v14.4l12-7.2Z" />
  </svg>
)

export const Square = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5.5" y="5.5" width="13" height="13" rx="2" />
  </svg>
)

export const RefreshCw = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5M4 13a8 8 0 0 0 13.7 4.7L20 15.5" />
    <path d="M4 4.5v4h4M20 19.5v-4h-4" />
  </svg>
)

export const ExternalLink = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9.5 6H5.8A1.8 1.8 0 0 0 4 7.8v10.4A1.8 1.8 0 0 0 5.8 20h10.4A1.8 1.8 0 0 0 18 18.2V14.5" />
    <path d="M14 4h6v6M20 4l-9.5 9.5" />
  </svg>
)

export const Leaf = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 4.5c.6 8-3.2 13.3-9.8 15C5 21 3.6 15.8 5.6 11 8 5.2 14.6 3.8 20 4.5Z" />
    <path d="M19.3 5.2C14 9 10.5 12.6 8 18" />
  </svg>
)

export const Factory = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 20V11l5 3V11l5 3V6.5l5 3.5V20Z" />
    <path d="M3.5 20h16.5" />
    <path d="M17 6.5V4h2v1.3" />
  </svg>
)

export const Weight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 3.5h6l1.2 3.3H7.8Z" />
    <circle cx="12" cy="4" r="1.1" />
    <path d="M6.5 8h11l2.5 12h-16Z" />
  </svg>
)

export const Camera = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8h3.2L8.6 5.5h6.8L16.8 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.4" />
  </svg>
)

export const Navigation = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2.5 4.5 20l7.5-4 7.5 4Z" />
  </svg>
)

export const Star = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9Z" />
  </svg>
)

export const LogOut = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9" />
    <path d="M16 16.5 20.5 12 16 7.5M20.5 12H9" />
  </svg>
)

export const Grid = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.2" />
    <rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.2" />
    <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.2" />
    <rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.2" />
  </svg>
)

export const Key = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8" cy="15.5" r="4" />
    <path d="M11 12.5 19.5 4M16 6.5l2.5 2.5M13.5 9l2 2" />
  </svg>
)

export const Settings = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
  </svg>
)
