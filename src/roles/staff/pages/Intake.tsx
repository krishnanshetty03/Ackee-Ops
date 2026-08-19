import { useState } from 'react'
import s from '../staff.module.css'
import { PageHead, PageInner } from '../StaffShell'
import { useTallawahStore } from '../../../store/useStore'
import { Card } from '../../../components/ui/Card'
import { Tabs } from '../../../components/ui/Tabs'
import { StatusBadge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Checkbox } from '../../../components/ui/Field'
import { EmptyState } from '../../../components/ui/EmptyState'
import { FlagDialog } from '../../../components/FlagDialog'
import { AlertTriangle, ListChecks, MapPin, Route } from '../../../components/icons'
import { fmtBags, fmtRelativeTime } from '../../../lib/format'
import type { RequestStatus } from '../../../lib/types'

type FilterTab = 'all' | RequestStatus

export function Intake() {
  const requests = useTallawahStore((st) => st.requests)
  const branches = useTallawahStore((st) => st.branches)
  const now = useTallawahStore((st) => st.now)
  const selectedIds = useTallawahStore((st) => st.selectedRequestIds)
  const toggleSelected = useTallawahStore((st) => st.toggleSelectedRequest)
  const clearSelected = useTallawahStore((st) => st.clearSelectedRequests)
  const setStaffTab = useTallawahStore((st) => st.setStaffTab)
  const flagException = useTallawahStore((st) => st.flagException)

  const [filter, setFilter] = useState<FilterTab>('unassigned')
  const [flagTarget, setFlagTarget] = useState<string | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)

  const counts = {
    all: requests.length,
    unassigned: requests.filter((r) => r.status === 'unassigned').length,
    assigned: requests.filter((r) => r.status === 'assigned').length,
    fulfilled: requests.filter((r) => r.status === 'fulfilled').length,
    flagged: requests.filter((r) => r.status === 'flagged').length,
  }

  const filtered = requests.filter((r) => filter === 'all' || r.status === filter).sort((a, b) => b.createdAt - a.createdAt)
  const selectableIds = filtered.filter((r) => r.status === 'unassigned').map((r) => r.id)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id))

  function toggleAll() {
    if (allSelected) {
      selectableIds.forEach((id) => selectedIds.includes(id) && toggleSelected(id))
    } else {
      selectableIds.forEach((id) => !selectedIds.includes(id) && toggleSelected(id))
    }
  }

  const flagRequest = requests.find((r) => r.id === flagTarget)

  return (
    <PageInner>
      <PageHead
        title="Order Intake"
        desc="Every ackee-ready signal & produce photo verification from WhatsApp lands here the instant it's submitted."
        action={
          selectedIds.length > 0 && (
            <Button variant="primary" icon={<Route size={15} />} onClick={() => setStaffTab('dispatch')}>
              Plan route · {selectedIds.length} selected
            </Button>
          )
        }
      />

      <div className={s.toolbar}>
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'unassigned', label: 'Unassigned', count: counts.unassigned },
            { value: 'assigned', label: 'Assigned', count: counts.assigned },
            { value: 'fulfilled', label: 'Fulfilled', count: counts.fulfilled },
            { value: 'flagged', label: 'Flagged', count: counts.flagged },
          ]}
        />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<ListChecks size={20} />} title="No requests here" desc="Requests farmers send in from WhatsApp will show up in this view." />
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th style={{ width: 34 }}>
                    {selectableIds.length > 0 && <Checkbox checked={allSelected} onChange={toggleAll} />}
                  </th>
                  <th>Farmer</th>
                  <th>Produce Photo</th>
                  <th>Location</th>
                  <th>Branch</th>
                  <th>Bags</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={selectedIds.includes(r.id) ? s.selected : ''}>
                    <td>
                      {r.status === 'unassigned' && <Checkbox checked={selectedIds.includes(r.id)} onChange={() => toggleSelected(r.id)} />}
                    </td>
                    <td>
                      <div className={s.cellPrimary}>{r.farmerName}</div>
                      <div className={s.cellMeta}>{r.farmerPhone}</div>
                      {r.bonusApplied && <span style={{ fontSize: 10, fontWeight: 700, color: '#128c7e', background: 'rgba(18,140,126,0.1)', padding: '1px 5px', borderRadius: 4 }}>🎁 {r.bonusApplied}</span>}
                    </td>
                    <td>
                      {r.producePhotoUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(r.producePhotoUrl!)}
                          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          title="Click to view verified produce photo"
                        >
                          <img src={r.producePhotoUrl} alt="Produce Photo" style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-ink)' }}>Verified ✓</span>
                        </button>
                      ) : (
                        <span className={s.cellMeta}>No photo</span>
                      )}
                    </td>
                    <td>
                      <div className={s.locCell}>
                        <MapPin size={13} />
                        {r.location.community}
                      </div>
                    </td>
                    <td className={s.cellMeta}>{branches.find((b) => b.id === r.branchId)?.name ?? '—'}</td>
                    <td className={s.cellMono}>{fmtBags(r.estimatedBags)}</td>
                    <td>{r.requestType === 'staff_pickup' ? 'Team pickup' : 'Self-drop'}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={s.cellMeta}>{fmtRelativeTime(r.createdAt, now)}</td>
                    <td>
                      <div className={s.rowActions}>
                        {(r.status === 'unassigned' || r.status === 'assigned') && (
                          <button className={[s.miniIconBtn, s.danger].join(' ')} title="Flag an exception" onClick={() => setFlagTarget(r.id)}>
                            <AlertTriangle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {previewPhotoUrl && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16, maxWidth: 500, width: '100%', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>📷 Verified Farmer Produce Photo</span>
              <button style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--muted)' }} onClick={() => setPreviewPhotoUrl(null)}>✕</button>
            </div>
            <img src={previewPhotoUrl} alt="Verified Produce" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
              Freshness Verification Passed • Quality Grade A
            </div>
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className={s.stickyBar}>
          <div className={s.stickyBarLeft}>
            <span className={s.stickyBarCount}>{selectedIds.length}</span>
            request{selectedIds.length === 1 ? '' : 's'} selected · {fmtBags(requests.filter((r) => selectedIds.includes(r.id)).reduce((sum, r) => sum + r.estimatedBags, 0))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={clearSelected} style={{ color: '#cabfa9' }}>
              Clear
            </Button>
            <Button variant="primary" icon={<Route size={15} />} onClick={() => setStaffTab('dispatch')}>
              Plan route
            </Button>
          </div>
        </div>
      )}

      <FlagDialog
        open={!!flagTarget}
        onClose={() => setFlagTarget(null)}
        subjectLabel={flagRequest ? `${flagRequest.id} — ${flagRequest.farmerName}` : ''}
        onSubmit={(input) => {
          if (flagTarget) flagException({ relatedType: 'request', relatedId: flagTarget, ...input })
          setFlagTarget(null)
        }}
      />
    </PageInner>
  )
}
