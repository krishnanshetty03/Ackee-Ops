import { useEffect, useState, type ReactNode } from 'react'
import s from './DeviceFrame.module.css'

function useClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 15000)
    return () => clearInterval(id)
  }, [])
  return time
}

export function PhoneFrame({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  const time = useClock()
  const label = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={s.phoneOuter}>
      <div className={s.phoneScreen}>
        <div className={s.notch} />
        <div className={s.statusBar} style={{ color: dark ? '#f4eee0' : '#1c1810' }}>
          <span>{label}</span>
          <span className={s.statusIcons}>
            <SignalGlyph />
            <WifiGlyph />
            <BatteryGlyph />
          </span>
        </div>
        <div className={s.screenBody}>{children}</div>
        <div className={[s.homeIndicator, dark ? '' : s.dark].join(' ')} />
      </div>
    </div>
  )
}

export function BrowserFrame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className={s.browserOuter}>
      <div className={s.browserChrome}>
        <span className={s.trafficLights}>
          <span style={{ background: '#ef6a5f' }} />
          <span style={{ background: '#f4bf4f' }} />
          <span style={{ background: '#62c554' }} />
        </span>
        <span className={s.addressBar}>
          <LockGlyph />
          <span>{url}</span>
        </span>
      </div>
      <div className={s.browserBody}>{children}</div>
    </div>
  )
}

function SignalGlyph() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="0.8" />
      <rect x="4.5" y="5" width="3" height="6" rx="0.8" />
      <rect x="9" y="3" width="3" height="8" rx="0.8" />
      <rect x="13.5" y="0" width="3" height="11" rx="0.8" />
    </svg>
  )
}
function WifiGlyph() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M1 4a10 10 0 0 1 13 0" />
      <path d="M3.4 6.6a6.4 6.4 0 0 1 8.2 0" />
      <path d="M6 9.1a2.8 2.8 0 0 1 3 0" />
    </svg>
  )
}
function BatteryGlyph() {
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
      <rect x="0.75" y="0.75" width="19.5" height="10.5" rx="2.6" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2.4" y="2.4" width="15" height="7.2" rx="1.4" fill="currentColor" />
      <rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  )
}
function LockGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  )
}
