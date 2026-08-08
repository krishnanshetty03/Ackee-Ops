import { useState } from 'react'
import s from '../staff.module.css'
import f from './farmers.module.css'
import { PageHead, PageInner } from '../StaffShell'
import { useTallawahStore } from '../../../store/useStore'
import { selectFarmerStats, selectFarmerHealth, selectOpenFollowUps, selectQuietFarmers } from '../../../store/selectors'
import { Card } from '../../../components/ui/Card'
import { KpiCard } from '../../../components/ui/KpiCard'
import { Badge } from '../../../components/ui/Badge'
import { Tabs } from '../../../components/ui/Tabs'
import { Avatar } from '../../../components/ui/Avatar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Users, Search, AlertTriangle, ChevronRight, ListChecks } from '../../../components/icons'
import { fmtBags, fmtRelativeTime } from '../../../lib/format'

type FilterTab = 'all' | 'active' | 'quiet'

export function FarmersDirectory({ onSelect }: { onSelect: (farmerId: string) => void }) {
  const farmers = useTallawahStore((st) => st.farmers)
  const now = useTallawahStore((st) => st.now)
  const store = useTallawahStore()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  // Small, on-demand page (6 farmers in this demo) — recomputing per render is
  // simpler and cheaper than memoizing against a fragile hand-picked dep list.
  const rows = farmers
    .map((farmer) => ({ farmer, stats: selectFarmerStats(store, farmer.id), health: selectFarmerHealth(store, farmer.id) }))
    .sort((a, b) => (b.stats.lastActivityAt ?? 0) - (a.stats.lastActivityAt ?? 0))

  const quietCount = selectQuietFarmers(store).length
  const openFollowUps = selectOpenFollowUps(store).length

  const filtered = rows.filter(({ farmer, health }) => {
    if (filter !== 'all' && health !== filter) return false
    if (search && !`${farmer.name} ${farmer.community}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <PageInner>
      <PageHead title="Farmers" desc="Every supplier relationship — request history, quality track record, notes, and follow-ups in one place." />

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
      </div>

      <div className={s.toolbar}>
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: rows.length },
            { value: 'active', label: 'Active', count: rows.filter((r) => r.health === 'active').length },
            { value: 'quiet', label: 'Going quiet', count: quietCount },
          ]}
        />
        <div className={s.searchWrap} style={{ maxWidth: 260 }}>
          <Search size={14} />
          <input placeholder="Search farmers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

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
    </PageInner>
  )
}
