import { useEffect, useRef, useState } from 'react'
import s from './whatsapp.module.css'
import { useTallawahStore } from '../../store/useStore'
import { ChatBubble } from './ChatBubble'
import { ArrowLeft, Globe, Leaf, Package, Phone } from '../../components/icons'
import { composerLabels, copyFor } from '../../lib/chatCopy'
import type { Theme } from '../../lib/useTheme'

export function FarmerApp({ farmerId, theme, onBack }: { farmerId: string; theme: Theme; onBack?: () => void }) {
  const chat = useTallawahStore((st) => st.chat[farmerId] ?? [])
  const farmer = useTallawahStore((st) => st.farmers.find((f) => f.id === farmerId))
  const startNewRequest = useTallawahStore((st) => st.startNewRequest)
  const chooseLanguage = useTallawahStore((st) => st.chooseLanguage)
  const chooseBags = useTallawahStore((st) => st.chooseBags)
  const chooseBranch = useTallawahStore((st) => st.chooseBranch)
  const choosePickupType = useTallawahStore((st) => st.choosePickupType)
  const chooseDropoffTiming = useTallawahStore((st) => st.chooseDropoffTiming)
  const shareLocation = useTallawahStore((st) => st.shareLocation)
  const sendFreeText = useTallawahStore((st) => st.sendFreeText)
  const showMyRequests = useTallawahStore((st) => st.showMyRequests)

  const lang = farmer?.language
  const t = copyFor(lang)
  const cl = composerLabels(lang)

  const [draft, setDraft] = useState('')
  const [visibleCount, setVisibleCount] = useState(chat.length)
  const [typing, setTyping] = useState(false)
  const prevFarmer = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const greetedRef = useRef<string | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (prevFarmer.current !== farmerId) {
      prevFarmer.current = farmerId
      setVisibleCount(chat.length)
      setTyping(false)
      return
    }
    const full = chat.length
    if (full <= visibleCount) {
      if (full < visibleCount) setVisibleCount(full)
      return
    }
    const newSlice = chat.slice(visibleCount)
    const firstBotIdx = newSlice.findIndex((m) => m.from === 'bot')
    if (firstBotIdx === -1) {
      setVisibleCount(full)
      return
    }
    if (firstBotIdx > 0) setVisibleCount(visibleCount + firstBotIdx)
    setTyping(true)
    timerRef.current = setTimeout(
      () => {
        setVisibleCount(full)
        setTyping(false)
      },
      520 + Math.random() * 260,
    )
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId, chat.length])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [visibleCount, typing])

  useEffect(() => {
    // Guarded with a ref (not just chat.length) because React StrictMode's dev-only
    // double-invoke re-runs this effect with the same stale `chat.length` closure —
    // a plain length check would fire startNewRequest twice and duplicate the greeting.
    if (chat.length === 0 && greetedRef.current !== farmerId) {
      greetedRef.current = farmerId
      startNewRequest(farmerId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId])

  const visible = chat.slice(0, visibleCount)

  function handleQuickReply(kind: string, value: string) {
    if (kind !== 'quick_replies') return
    if (value === 'en' || value === 'tw') return chooseLanguage(farmerId, value)
    if (/^\d+$/.test(value)) return chooseBags(farmerId, parseInt(value, 10))
    if (value.startsWith('BR-')) return chooseBranch(farmerId, value)
    if (value === 'staff_pickup' || value === 'self_drop') return choosePickupType(farmerId, value)
    return chooseDropoffTiming(farmerId, value)
  }

  function submitDraft() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    sendFreeText(farmerId, text)
  }

  return (
    <div className={s.screen}>
      <div className={s.header}>
        {onBack && (
          <button className={s.headerBack} onClick={onBack} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className={s.headerAvatar}>
          <img src="./logo.png" alt="" />
        </div>
        <div className={s.headerInfo}>
          <span className={s.headerName}>Tallawah Foods</span>
          <span className={s.headerStatus}>{typing ? (lang === 'tw' ? 'ɛrekyerɛw…' : 'typing…') : lang === 'tw' ? 'Ackee Adwumam · ɛda ho' : 'Ackee Pickup Desk · online'}</span>
        </div>
        <div className={s.headerActions}>
          <Phone size={17} />
        </div>
      </div>

      <div className={s.scroll} ref={scrollRef}>
        <div className={s.wallpaper} />
        <div className={s.dayChip}>{t.todayLabel()}</div>
        {visible.map((m, i) => (
          <ChatBubble
            key={m.id}
            message={m}
            isLast={i === visible.length - 1 && !typing}
            theme={theme}
            language={lang}
            onQuickReply={(value) => handleQuickReply(m.kind, value)}
            onShareLocation={() => shareLocation(farmerId)}
          />
        ))}
        {typing && (
          <div className={[s.row, s.rowIn].join(' ')}>
            <div className={[s.bubble, s.bubbleIn].join(' ')}>
              <span className={s.typing}>
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={s.composer}>
        <div className={s.quickMenu}>
          <button className={s.quickMenuBtn} onClick={() => startNewRequest(farmerId)}>
            <Leaf size={13} /> {cl.ackeeReady}
          </button>
          <button className={s.quickMenuBtn} onClick={() => showMyRequests(farmerId)}>
            <Package size={13} /> {cl.myRequests}
          </button>
          {farmer?.language && (
            <button className={s.quickMenuBtn} onClick={() => chooseLanguage(farmerId, lang === 'tw' ? 'en' : 'tw')} aria-label="Change language">
              <Globe size={13} /> {lang === 'tw' ? 'English' : 'Twi'}
            </button>
          )}
        </div>
        <div className={s.inputRow}>
          <div className={s.textInputWrap}>
            <input
              className={s.textInput}
              placeholder={cl.typeMessage}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitDraft()}
            />
          </div>
          <button className={s.sendBtn} onClick={submitDraft} disabled={!draft.trim()} aria-label="Send">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 3 3 10.5l7.2 2.7L21 3Zm-10.8 10.2 2.8 6.7L21 3Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
