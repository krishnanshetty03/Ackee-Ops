import { useState } from 'react'
import s from '../staff.module.css'
import f from './farmers.module.css'
import iv from './invite.module.css'
import { PageHead, PageInner } from '../StaffShell'
import { useTallawahStore } from '../../../store/useStore'
import { selectFarmerStats, selectFarmerHealth, selectOpenFollowUps, selectQuietFarmers, selectPendingInvites } from '../../../store/selectors'
import { Card } from '../../../components/ui/Card'
import { KpiCard } from '../../../components/ui/KpiCard'
import { Badge } from '../../../components/ui/Badge'
import { Tabs } from '../../../components/ui/Tabs'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Users, Search, AlertTriangle, ChevronRight, ListChecks, Plus, RefreshCw, X } from '../../../components/icons'
import { fmtBags, fmtRelativeTime } from '../../../lib/format'
import { InviteSheet } from './InviteSheet'
import type { FarmerInvite } from '../../../lib/types'

type FilterTab = 'all' | 'active' | 'quiet' | 'invites'

function fmtInviteTime(invitedAt: number, now: number): string {
  const hrs = (now - invitedAt) / 3600_000
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${Math.floor(hrs)}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function InviteRowItem({
  invite,
  now,
  onResend,
  onRevoke,
}: {
  invite: FarmerInvite
  now: number
  onResend: (id: string) => void
  onRevoke: (id: string) => void
}) {
  const expired = invite.status === 'expired'
  const accepted = invite.status === 'accepted'

  const tone =
    accepted ? 'green' :
    expired ? 'neutral' :
    'gold'

  const label =
    accepted ? 'Accepted' :
    expired ? 'Expired' :
    'Pending'

  return (
    <div className={iv.inviteRow}>
      <Avatar initials={invite.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()} hue={120} size="sm" />
      <div className={iv.inviteRowText}>
        <div className={iv.inviteRowName}>{invite.name}</div>
        <div className={iv.inviteRowMeta}>{invite.phone} · {invite.community} · {fmtInviteTime(invite.invitedAt, now)}</div>
      </div>
      <Badge tone={tone}>{label}</Badge>
      {!accepted && (
        <div className={iv.inviteActions}>
          {!expired && (
            <button className={iv.inviteActionBtn} onClick={() => onResend(invite.id)}>
              Resend
            </button>
          )}
          {expired && (
            <button className={iv.inviteActionBtn} onClick={() => onResend(invite.id)}>
              Re-invite
            </button>
          )}
          <button className={`${iv.inviteActionBtn} ${iv.danger}`} onClick={() => onRevoke(invite.id)}>
            Revoke
          </button>
        </div>
      )}
    </div>
  )
}

export function FarmersDirectory({ onSelect }: { onSelect: (farmerId: string) => void }) {
  const farmers = useTallawahStore((st) => st.farmers)
  const now = useTallawahStore((st) => st.now)
  const store = useTallawahStore()
  const invites = useTallawahStore((st) => st.invites)
  const resendInvite = useTallawahStore((st) => st.resendInvite)
  const revokeInvite = useTallawahStore((st) => st.revokeInvite)
  const setView = useTallawahStore((st) => st.setView)
  const setActiveFarmerId = useTallawahStore((st) => st.setActiveFarmerId)

  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const rows = farmers
    .map((farmer) => ({ farmer, stats: selectFarmerStats(store, farmer.id), health: selectFarmerHealth(store, farmer.id) }))
    .sort((a, b) => (b.stats.lastActivityAt ?? 0) - (a.stats.lastActivityAt ?? 0))

  const quietCount = selectQuietFarmers(store).length
  const openFollowUps = selectOpenFollowUps(store).length
  const pendingInvites = selectPendingInvites(store)

  const filtered = rows.filter(({ farmer, health }) => {
    if (filter === 'invites') return false
    if (filter !== 'all' && health !== filter) return false
    if (search && !`${farmer.name} ${farmer.community}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredInvites = invites.filter((inv) => {
    if (!search) return true
    return `${inv.name} ${inv.phone} ${inv.community}`.toLowerCase().includes(search.toLowerCase())
  })

  function handleJumpToOnboarding() {
    setActiveFarmerId('__onboarding__')
    setView('farmer')
  }

  return (
    <PageInner>
      <PageHead
        title="Farmers"
        desc="Every supplier relationship — request history, quality track record, notes, and follow-ups in one place."
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setSheetOpen(true)}
          >
            Invite farmer
          </Button>
        }
      />

      <div className={f.summaryRow}>
        <KpiCard icon={<Users size={15} />} label="Total farmers" value={farmers.length} tone="neutral" />
        <KpiCard
          icon={<AlertTriangle size={15} />}
          label="Going quiet"
          value={quietCount}
          tone={quietCount > 0 ? 'gold' : 'green'}
          sub={quietCount > 0 ? 'No activity in 3+ days' : 'Everyone is engaged'}
        />
        <KpiCard icon={<ListChecks size={15} />} label="Open follow-ups" value={openFollowUps} tone={openFollowUps > 0 ? 'gold' : 'green'} />
        <KpiCard
          icon={<Plus size={15} />}
          label="Pending invites"
          value={pendingInvites.length}
          tone={pendingInvites.length > 0 ? 'gold' : 'green'}
          sub={pendingInvites.length > 0 ? 'Awaiting onboarding' : 'All invites accepted'}
        />
      </div>

      <div className={s.toolbar}>
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: rows.length },
            { value: 'active', label: 'Active', count: rows.filter((r) => r.health === 'active').length },
            { value: 'quiet', label: 'Going quiet', count: quietCount },
            { value: 'invites', label: 'Invites', count: invites.length },
          ]}
        />
        <div className={s.searchWrap} style={{ maxWidth: 260 }}>
          <Search size={14} />
          <input placeholder="Search farmers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filter === 'invites' ? (
        <Card>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {filteredInvites.length} invite{filteredInvites.length !== 1 ? 's' : ''}
              {pendingInvites.length > 0 && ` · ${pendingInvites.length} pending`}
            </span>
            <button
              onClick={handleJumpToOnboarding}
              style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-ink)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Preview onboarding →
            </button>
          </div>
          {filteredInvites.length === 0 ? (
            <EmptyState icon={<Users size={20} />} title="No invites yet" desc="Use 'Invite farmer' to bring new suppliers onto the platform." />
          ) : (
            filteredInvites.map((inv) => (
              <InviteRowItem
                key={inv.id}
                invite={inv}
                now={now}
                onResend={resendInvite}
                onRevoke={revokeInvite}
              />
            ))
          )}
        </Card>
      ) : (
        <Card>
          {filtered.length === 0 ? (
            <EmptyState icon={<Users size={20} />} title="No farmers match" desc="Try a different filter or search term." />
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Tags</th>
                    <th>Lifetime bags</th>
                    <th>Quality</th>
                    <th>Last activity</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ farmer, stats, health }) => (
                    <tr key={farmer.id} onClick={() => onSelect(farmer.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className={f.farmerCell}>
                          <Avatar initials={farmer.initials} hue={farmer.avatarHue} size="sm" />
                          <div className={f.farmerCellText}>
                            <div className={s.cellPrimary}>{farmer.name}</div>
                            <div className={s.cellMeta}>{farmer.community}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {farmer.tags.length === 0 ? (
                          <span className={s.cellMeta}>—</span>
                        ) : (
                          <div className={f.tagRow}>
                            {farmer.tags.map((t) => (
                              <span key={t} className={f.tagChip}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className={s.cellMono}>{fmtBags(stats.lifetimeBags)}</td>
                      <td className={s.cellMono}>{stats.qualityPassRate === null ? '—' : `${Math.round(stats.qualityPassRate * 100)}%`}</td>
                      <td className={s.cellMeta}>{stats.lastActivityAt ? fmtRelativeTime(stats.lastActivityAt, now) : 'No activity yet'}</td>
                      <td>
                        <Badge tone={health === 'active' ? 'green' : 'gold'} dot>
                          {health === 'active' ? 'Active' : 'Going quiet'}
                        </Badge>
                      </td>
                      <td style={{ color: 'var(--faint)' }}>
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <InviteSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </PageInner>
  )
}
