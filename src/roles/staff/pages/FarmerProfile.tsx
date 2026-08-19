import { useState } from 'react'
import s from '../staff.module.css'
import f from './farmers.module.css'
import { PageInner } from '../StaffShell'
import { useTallawahStore } from '../../../store/useStore'
import { selectFarmerFollowUps, selectFarmerNotes, selectFarmerStats, selectFarmerHealth, selectFarmerTimeline, todayIso } from '../../../store/selectors'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Avatar } from '../../../components/ui/Avatar'
import { Textarea } from '../../../components/ui/Field'
import { EmptyState } from '../../../components/ui/EmptyState'
import { MiniMap } from '../../../components/map/MiniMap'
import { FACTORY, FARM_COMMUNITIES } from '../../../lib/geo'
import { ArrowLeft, Check, Clock, MapPin, Phone, Plus, Send, X } from '../../../components/icons'
import { fmtBags, fmtClock, fmtRelativeTime } from '../../../lib/format'
import { FARMER_TAG_OPTIONS } from '../../../lib/types'
import type { Theme } from '../../../lib/useTheme'

function fmtDuration(ms: number | null) {
  if (ms === null) return '—'
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min}m`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function stripWaMarkup(text?: string) {
  return (text ?? '').replace(/\*([^*]+)\*/g, '$1')
}

export function FarmerProfile({ farmerId, theme, onBack }: { farmerId: string; theme: Theme; onBack: () => void }) {
  const farmer = useTallawahStore((st) => st.farmers.find((x) => x.id === farmerId))
  const now = useTallawahStore((st) => st.now)
  const chatThread = useTallawahStore((st) => st.chat[farmerId] ?? [])
  const store = useTallawahStore()
  const addFarmerNote = useTallawahStore((st) => st.addFarmerNote)
  const toggleFarmerTag = useTallawahStore((st) => st.toggleFarmerTag)
  const addFollowUpTask = useTallawahStore((st) => st.addFollowUpTask)
  const toggleFollowUpTask = useTallawahStore((st) => st.toggleFollowUpTask)
  const setView = useTallawahStore((st) => st.setView)
  const setActiveFarmerId = useTallawahStore((st) => st.setActiveFarmerId)

  const [noteDraft, setNoteDraft] = useState('')
  const [taskNoteDraft, setTaskNoteDraft] = useState('')
  const [taskDueDraft, setTaskDueDraft] = useState(todayIso(now))
  const [tagMenuOpen, setTagMenuOpen] = useState(false)

  if (!farmer) {
    return (
      <PageInner>
        <EmptyState icon={<X size={20} />} title="Farmer not found" />
      </PageInner>
    )
  }

  const stats = selectFarmerStats(store, farmerId)
  const health = selectFarmerHealth(store, farmerId)
  const timeline = selectFarmerTimeline(store, farmerId)
  const notes = selectFarmerNotes(store, farmerId)
  const followUps = selectFarmerFollowUps(store, farmerId)
  const today = todayIso(now)
  const recentChat = chatThread.slice(-5)

  // Farm location isn't stored on the farmer directly — a request carries the
  // actual jittered point from when it was made. Use the most recent one, or
  // fall back to the community's base coordinate if they haven't sent one yet.
  const latestRequest = [...store.requests].filter((r) => r.farmerId === farmerId).sort((a, b) => b.createdAt - a.createdAt)[0]
  const communityPoint = FARM_COMMUNITIES.find((c) => c.community === farmer.community)
  const farmPoint = latestRequest?.location ?? communityPoint ?? FACTORY

  function openConversation() {
    setActiveFarmerId(farmerId)
    setView('farmer')
  }

  return (
    <PageInner>
      <button className={f.profileBack} onClick={onBack}>
        <ArrowLeft size={13} /> All farmers
      </button>

      <div className={f.profileHead}>
        <Avatar initials={farmer.initials} hue={farmer.avatarHue} size="xl" />
        <div className={f.profileIdentity}>
          <div className={f.profileNameRow}>
            <span className={f.profileName}>{farmer.name}</span>
            <Badge tone={health === 'active' ? 'green' : 'gold'} dot>
              {health === 'active' ? 'Active' : 'Going quiet'}
            </Badge>
          </div>
          <div className={f.profileMeta}>
            <MapPin size={12} /> {farmer.community} <span>·</span> <b>{farmer.phone}</b> <span>·</span> Farmer since{' '}
            {new Date(farmer.memberSince).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            {farmer.nearestBranchId && (
              <>
                <span>·</span> Nearest branch: <b>{store.branches.find((b) => b.id === farmer.nearestBranchId)?.name}</b>
              </>
            )}
            {farmer.language && (
              <>
                <span>·</span> Prefers: <b>{farmer.language === 'tw' ? 'Twi' : 'English'}</b>
              </>
            )}
          </div>
          <div className={f.tagRow} style={{ marginTop: 2 }}>
            {farmer.tags.map((t) => (
              <span key={t} className={f.tagChip}>
                {t}
              </span>
            ))}
            <div className={f.tagEditorWrap}>
              <button className={f.addTagBtn} onClick={() => setTagMenuOpen((v) => !v)}>
                <Plus size={11} /> Tag
              </button>
              {tagMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={() => setTagMenuOpen(false)} />
                  <div className={f.tagMenu}>
                    {FARMER_TAG_OPTIONS.map((tag) => {
                      const on = farmer.tags.includes(tag)
                      return (
                        <button key={tag} className={f.tagMenuItem} onClick={() => toggleFarmerTag(farmerId, tag)}>
                          <span className={[f.tagMenuCheck, on ? f.on : ''].join(' ')}>{on && <Check size={10} />}</span>
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className={f.profileActions}>
          <Button variant="secondary" icon={<Phone size={14} />} title={farmer.phone}>
            Call
          </Button>
          <Button variant="primary" icon={<Send size={14} />} onClick={openConversation}>
            Open chat
          </Button>
        </div>
      </div>

      <div className={f.statTiles}>
        <div className={f.statTile}>
          <div className={f.statTileValue}>{fmtBags(stats.lifetimeBags)}</div>
          <div className={f.statTileLabel}>Lifetime supplied</div>
        </div>
        <div className={f.statTile}>
          <div className={f.statTileValue}>{stats.totalRequests}</div>
          <div className={f.statTileLabel}>Total requests</div>
        </div>
        <div className={f.statTile}>
          <div className={f.statTileValue}>{stats.qualityPassRate === null ? '—' : `${Math.round(stats.qualityPassRate * 100)}%`}</div>
          <div className={f.statTileLabel}>Quality pass rate</div>
        </div>
        <div className={f.statTile}>
          <div className={f.statTileValue}>{fmtDuration(stats.avgTurnaroundMs)}</div>
          <div className={f.statTileLabel}>Avg. turnaround</div>
        </div>
      </div>

      <div className={f.profileBody}>
        <div className={f.col}>
          <Card>
            <CardHeader title="Relationship timeline" subtitle={stats.lastActivityAt ? `Last activity ${fmtRelativeTime(stats.lastActivityAt, now)}` : 'No activity yet'} />
            {timeline.length === 0 ? (
              <EmptyState icon={<Clock size={20} />} title="Nothing recorded yet" desc="Requests, pickups, and receiving events will show up here." />
            ) : (
              <div className={s.activityList}>
                {timeline.map((ev) => (
                  <div key={ev.id} className={s.activityItem}>
                    <span className={[s.activityIcon, ev.tone === 'red' ? s.red : ev.tone === 'green' ? s.green : ''].join(' ')}>
                      {ev.kind === 'request' && <Send size={13} />}
                      {ev.kind === 'collected' && <Check size={13} />}
                      {ev.kind === 'received' && <Check size={13} />}
                      {ev.kind === 'exception' && <X size={13} />}
                    </span>
                    <div className={s.activityBody}>
                      <div className={s.activityTitle}>{ev.title}</div>
                      <div className={s.activityDesc}>{ev.desc}</div>
                      <div className={s.activityTime}>{fmtRelativeTime(ev.at, now)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className={f.col}>
          <Card padded>
            <CardHeader title="Follow-ups" />
            <div style={{ marginTop: 10 }}>
              {followUps.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No follow-ups yet.</div>}
              {followUps.map((task) => {
                const overdue = !task.done && task.dueDate < today
                return (
                  <div key={task.id} className={f.taskItem}>
                    <button className={[f.taskCheck, task.done ? f.done : ''].join(' ')} onClick={() => toggleFollowUpTask(task.id)} aria-label="Toggle done">
                      {task.done && <Check size={11} />}
                    </button>
                    <div>
                      <div className={[f.taskText, task.done ? f.done : ''].join(' ')}>{task.note}</div>
                      <div className={[f.taskDue, overdue ? f.overdue : ''].join(' ')}>
                        {overdue ? 'Overdue — ' : 'Due '}
                        {task.dueDate === today ? 'today' : task.dueDate}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={f.taskForm}>
              <Textarea placeholder="e.g. Call about next week's harvest" value={taskNoteDraft} onChange={(e) => setTaskNoteDraft(e.target.value)} style={{ minHeight: 44 }} />
              <div className={f.taskFormRow}>
                <input type="date" value={taskDueDraft} min={today} onChange={(e) => setTaskDueDraft(e.target.value)} />
                <Button
                  variant="primary"
                  size="sm"
                  block
                  disabled={!taskNoteDraft.trim()}
                  onClick={() => {
                    addFollowUpTask(farmerId, taskNoteDraft, taskDueDraft)
                    setTaskNoteDraft('')
                  }}
                >
                  Add follow-up
                </Button>
              </div>
            </div>
          </Card>

          <Card padded>
            <CardHeader title="Notes" />
            <div style={{ marginTop: 6 }}>
              {notes.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No notes yet — jot down anything worth remembering.</div>}
              {notes.map((note) => (
                <div key={note.id} className={f.noteItem}>
                  <div className={f.noteText}>{note.text}</div>
                  <div className={f.noteMeta}>
                    {note.authorName} · {fmtRelativeTime(note.createdAt, now)}
                  </div>
                </div>
              ))}
            </div>
            <div className={f.noteForm}>
              <Textarea placeholder="Add a note about this farmer…" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} style={{ minHeight: 44 }} />
              <Button
                variant="secondary"
                size="sm"
                disabled={!noteDraft.trim()}
                onClick={() => {
                  addFarmerNote(farmerId, noteDraft)
                  setNoteDraft('')
                }}
              >
                Save
              </Button>
            </div>
          </Card>

          <Card padded>
            <CardHeader title="Recent WhatsApp" action={<button onClick={openConversation} style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold-ink)' }}>Open full chat →</button>} />
            <div className={f.waPreview} style={{ marginTop: 10 }}>
              {recentChat.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No conversation yet.</div>
              ) : (
                recentChat.map((m) => (
                  <div key={m.id} className={[f.waRow, m.from === 'farmer' ? f.waRowOut : ''].join(' ')}>
                    <span className={f.waBubble}>{m.kind === 'location_share' ? '📍 Shared farm location' : stripWaMarkup(m.text) || '…'}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Farm location" subtitle={farmer.community} />
            <div className={f.mapCard} style={{ margin: '0 14px 14px' }}>
              <MiniMap point={farmPoint} theme={theme} height={150} hue={farmer.avatarHue} />
            </div>
          </Card>
        </div>
      </div>
    </PageInner>
  )
}
