import type { ChatMessage } from '../../lib/types'
import s from './whatsapp.module.css'
import { MapPin } from '../../components/icons'
import { MiniMap } from '../../components/map/MiniMap'
import type { Theme } from '../../lib/useTheme'
import { statusLabel } from '../../lib/chatCopy'

function renderWaText(text: string) {
  // WhatsApp's *bold* convention — split on *…* pairs and bold the interior
  const parts = text.split(/(\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <b key={i}>{part.slice(1, -1)}</b>
    }
    return <span key={i}>{part}</span>
  })
}

function Ticks() {
  return (
    <svg width="15" height="10" viewBox="0 0 15 10" className={s.tick}>
      <path d="M0.5 5.5 3.5 8.5 9 2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 5.5 7.5 8.5 14 1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function statusTone(emoji?: string): string {
  if (emoji === '✅') return 'var(--green)'
  if (emoji === '🚚') return 'var(--gold)'
  if (emoji === '⚠️') return 'var(--red)'
  if (emoji === '🏭') return 'var(--earth)'
  return 'transparent'
}

export function ChatBubble({
  message,
  isLast,
  theme,
  onQuickReply,
  onShareLocation,
}: {
  message: ChatMessage
  isLast: boolean
  theme: Theme
  onQuickReply: (value: string) => void
  onShareLocation: () => void
}) {
  const outgoing = message.from === 'farmer'
  const interactive = isLast

  return (
    <div className={[s.row, outgoing ? s.rowOut : s.rowIn].join(' ')}>
      <div className={s.bubbleWrap}>
        {message.kind === 'location_share' && message.location ? (
          <div className={s.locationBubble}>
            <MiniMap point={message.location} theme={theme} hue={132} height={128} />
            <div className={s.locationCaption}>
              <MapPin size={13} />
              {message.location.label}
            </div>
          </div>
        ) : message.kind === 'request_card' && message.requestSummary ? (
          <>
            {message.text && (
              <div className={[s.bubble, s.bubbleIn].join(' ')}>
                {renderWaText(message.text)}
                <BubbleMeta ts={message.createdAt} outgoing={false} />
              </div>
            )}
            <div className={s.card}>
              <div className={s.cardHead}>
                <span className={s.id}>{message.requestSummary.requestId}</span>
              </div>
              <div className={s.cardBody}>
                <div className={s.cardRow}>
                  <span className={s.k}>Bags</span>
                  <span className={s.v}>{message.requestSummary.bags}</span>
                </div>
                {message.requestSummary.branchName && (
                  <div className={s.cardRow}>
                    <span className={s.k}>Branch</span>
                    <span className={s.v}>{message.requestSummary.branchName}</span>
                  </div>
                )}
                <div className={s.cardRow}>
                  <span className={s.k}>Method</span>
                  <span className={s.v}>{message.requestSummary.type === 'staff_pickup' ? 'Team pickup' : 'Self-drop'}</span>
                </div>
                {message.requestSummary.dropoffTiming && (
                  <div className={s.cardRow}>
                    <span className={s.k}>When</span>
                    <span className={s.v}>{message.requestSummary.dropoffTiming}</span>
                  </div>
                )}
                <div className={s.cardRow}>
                  <span className={s.k}>Status</span>
                  <span className={s.v} style={{ color: 'var(--wa-accent)' }}>
                    {statusLabel(message.requestSummary.status)}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div
            className={[s.bubble, outgoing ? s.bubbleOut : s.bubbleIn].join(' ')}
            style={message.kind === 'status_update' ? { borderLeft: `3px solid ${statusTone(message.statusEmoji)}`, paddingLeft: 8 } : undefined}
          >
            {message.text && renderWaText(message.text)}
            <BubbleMeta ts={message.createdAt} outgoing={outgoing} />
          </div>
        )}

        {message.kind === 'quick_replies' && message.options && (
          message.options.length > 3 ? (
            <div className={s.chipRow}>
              {message.options.map((opt) => (
                <button key={opt.value} className={s.chip} disabled={!interactive} onClick={() => onQuickReply(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className={s.buttonList}>
              {message.options.map((opt) => (
                <button key={opt.value} className={s.replyBtn} disabled={!interactive} onClick={() => onQuickReply(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          )
        )}

        {message.kind === 'location_request' && (
          <button className={s.locationBtn} disabled={!interactive} onClick={onShareLocation}>
            <MapPin size={15} /> Share Farm Location
          </button>
        )}
      </div>
    </div>
  )
}

function BubbleMeta({ ts, outgoing }: { ts: number; outgoing: boolean }) {
  return (
    <span className={s.meta}>
      {timeLabel(ts)}
      {outgoing && <Ticks />}
    </span>
  )
}
