import { useState, type ReactNode } from 'react'
import { shallow } from 'zustand/shallow'
import s from './staff.module.css'
import { useTallawahStore } from '../../store/useStore'
import { selectExceptionKpis, selectIntakeKpis, selectQuietFarmers, selectReceivingKpis, selectUnreadStaffNotifications } from '../../store/selectors'
import { Avatar } from '../../components/ui/Avatar'
import { Bell, BarChart, ListChecks, Route, Truck, Package, AlertTriangle, Search, LogOut, Users } from '../../components/icons'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { fmtRelativeTime } from '../../lib/format'
import type { StaffTab } from '../../lib/types'
import type { Theme } from '../../lib/useTheme'

const NAV: { tab: StaffTab; label: string; icon: (p: { size?: number }) => JSX.Element }[] = [
  { tab: 'overview', label: 'Overview', icon: BarChart },
  { tab: 'farmers', label: 'Farmers', icon: Users },
  { tab: 'intake', label: 'Order Intake', icon: ListChecks },
  { tab: 'dispatch', label: 'Dispatch Planning', icon: Route },
  { tab: 'tracking', label: 'In-Transit Tracking', icon: Truck },
  { tab: 'receiving', label: 'Arrival & Receiving', icon: Package },
  { tab: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
]

export function StaffShell({
  theme,
  onToggleTheme,
  onSignOut,
  children,
}: {
  theme: Theme
  onToggleTheme: () => void
  onSignOut?: () => void
  children: ReactNode
}) {
  const staffTab = useTallawahStore((st) => st.staffTab)
  const setStaffTab = useTallawahStore((st) => st.setStaffTab)
  const staff = useTallawahStore((st) => st.staff)
  const [notifOpen, setNotifOpen] = useState(false)
  const [search, setSearch] = useState('')

  const intakeKpi = useTallawahStore(selectIntakeKpis, shallow)
  const excKpi = useTallawahStore(selectExceptionKpis, shallow)
  const recvKpi = useTallawahStore(selectReceivingKpis, shallow)
  const unread = useTallawahStore(selectUnreadStaffNotifications)
  const quietCount = useTallawahStore((st) => selectQuietFarmers(st).length)

  const countFor: Partial<Record<StaffTab, number>> = {
    farmers: quietCount,
    intake: intakeKpi.pendingCount,
    exceptions: excKpi.openCount,
    receiving: recvKpi.awaitingCount,
  }
  const alertTabs = new Set<StaffTab>(['exceptions'])

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.brand}>
          <img src="./logo.png" alt="" width={30} height={30} style={{ objectFit: 'contain' }} />
          <div className={s.brandText}>
            <span className={s.brandTitle}>Tallawah Ops</span>
            <span className={s.brandSub}>Farmer Orders &amp; Shipments</span>
          </div>
        </div>
        <nav className={s.nav}>
          <div className={s.navLabel}>Operations</div>
          {NAV.map(({ tab, label, icon: Icon }) => {
            const count = countFor[tab]
            return (
              <button key={tab} className={[s.navItem, tab === staffTab ? s.active : ''].join(' ')} onClick={() => setStaffTab(tab)}>
                <span className={s.navIcon}>
                  <Icon size={16} />
                </span>
                {label}
                {typeof count === 'number' && count > 0 && <span className={[s.navCount, alertTabs.has(tab) ? s.alert : ''].join(' ')}>{count}</span>}
              </button>
            )
          })}
        </nav>
        <div className={s.sidebarFooter}>
          <div className={s.staffCard}>
            <Avatar initials={staff.initials} hue={44} size="sm" status="online" />
            <div className={s.staffCardText}>
              <div className={s.staffCardName}>{staff.name}</div>
              <div className={s.staffCardRole}>{staff.role}</div>
            </div>
            {onSignOut && (
              <button className={s.signOutBtn} onClick={onSignOut} title="Sign out" aria-label="Sign out">
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className={s.main}>
        <div className={s.topbar}>
          <div className={s.searchWrap}>
            <Search size={14} />
            <input placeholder="Search farmers, requests, shipments…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className={s.topbarRight}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button className={s.iconBtn} onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications">
              <Bell size={17} />
              {unread > 0 && <span className={s.iconBtnDot} />}
            </button>
          </div>
        </div>
        {notifOpen && (
          <>
            <div className={s.overlayClick} onClick={() => setNotifOpen(false)} />
            <NotificationPanel onClose={() => setNotifOpen(false)} />
          </>
        )}
        <div className={s.pageScroll}>{children}</div>
      </div>
    </div>
  )
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const notifications = useTallawahStore((st) => st.notifications.filter((n) => n.audience === 'staff'))
  const now = useTallawahStore((st) => st.now)
  const markRead = useTallawahStore((st) => st.markNotificationRead)
  const markAll = useTallawahStore((st) => st.markAllNotificationsRead)

  return (
    <div className={s.notifPanel}>
      <div className={s.notifHead}>
        <span className={s.notifTitle}>Notifications</span>
        <button
          className={s.notifMarkAll}
          onClick={() => {
            markAll('staff')
          }}
        >
          Mark all read
        </button>
      </div>
      {notifications.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12.5 }}>You're all caught up.</div>}
      {notifications.slice(0, 20).map((n) => (
        <button
          key={n.id}
          className={[s.notifItem, !n.read ? s.unread : ''].join(' ')}
          onClick={() => {
            markRead(n.id)
            onClose()
          }}
        >
          <span className={s.notifIconWrap}>
            <Bell size={13} />
          </span>
          <span className={s.notifBody}>
            <span className={s.notifItemTitle}>{n.title}</span>
            <div className={s.notifItemDesc}>{n.body}</div>
            <div className={s.notifItemTime}>{fmtRelativeTime(n.createdAt, now)}</div>
          </span>
        </button>
      ))}
    </div>
  )
}

export function PageHead({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className={s.pageHead}>
      <div>
        <div className={s.pageTitle}>{title}</div>
        {desc && <div className={s.pageDesc}>{desc}</div>}
      </div>
      {action}
    </div>
  )
}

export function PageInner({ children }: { children: ReactNode }) {
  return <div className={s.pageInner}>{children}</div>
}
