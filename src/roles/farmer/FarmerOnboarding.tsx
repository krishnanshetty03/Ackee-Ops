import { useState } from 'react'
import s from './FarmerOnboarding.module.css'
import { useTallawahStore } from '../../store/useStore'
import { FARM_COMMUNITIES } from '../../lib/geo'
import { Check, Leaf } from '../../components/icons'
import type { Theme } from '../../lib/useTheme'

const DEMO_TOKEN = 'a1b2c3d4' // matches the first seed invite

const STEPS = ['welcome', 'name', 'community', 'done'] as const
type Step = typeof STEPS[number]

function ProgressDots({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step)
  return (
    <div className={s.progressBar}>
      {STEPS.map((st, i) => (
        <span key={st} className={[s.dot, i <= idx ? s.active : ''].join(' ')} />
      ))}
    </div>
  )
}

export function FarmerOnboarding({
  theme,
  onComplete,
}: {
  theme: Theme
  onComplete: (farmerId: string) => void
}) {
  const acceptInvite = useTallawahStore((st) => st.acceptInvite)
  const invites = useTallawahStore((st) => st.invites)

  const invite = invites.find((i) => i.token === DEMO_TOKEN && i.status === 'pending')
    ?? invites.find((i) => i.status === 'pending')

  const [step, setStep] = useState<Step>('welcome')
  const [nameInput, setNameInput] = useState(invite?.name ?? '')
  const [community, setCommunity] = useState(invite?.community ?? FARM_COMMUNITIES[0].community)

  const communities = FARM_COMMUNITIES.map((c) => c.community)

  function handleAccept() {
    setStep('name')
  }

  function handleNameNext() {
    if (!nameInput.trim()) return
    setStep('community')
  }

  function handleCommunityNext() {
    setStep('done')
  }

  function handleEnter() {
    const token = invite?.token ?? DEMO_TOKEN
    const farmerId = acceptInvite(token)
    if (farmerId) {
      onComplete(farmerId)
    }
  }

  if (!invite) {
    return (
      <div className={s.screen}>
        <div className={s.header}>
          <div className={s.headerAvatar}>
            <img src="./logo.png" alt="" />
          </div>
          <div className={s.headerInfo}>
            <span className={s.headerName}>Tallawah Foods</span>
            <span className={s.headerSub}>Ackee Pickup Desk · online</span>
          </div>
        </div>
        <div className={s.scroll}>
          <div className={s.wallpaper} />
          <div className={s.dayChip}>Today</div>
          <div className={s.stepCard} style={{ maxWidth: '92%' }}>
            <div className={s.stepTitle}>No pending invite</div>
            <div className={s.stepDesc}>
              All demo invites have already been accepted or expired.
              Ask staff to send a new invite, then come back here.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.screen}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerAvatar}>
          <img src="./logo.png" alt="" />
        </div>
        <div className={s.headerInfo}>
          <span className={s.headerName}>Tallawah Foods</span>
          <span className={s.headerSub}>Ackee Pickup Desk · online</span>
        </div>
      </div>

      <div className={s.scroll}>
        <div className={s.wallpaper} />
        <div className={s.dayChip}>Today</div>

        {/* ── Step 1: Welcome ── */}
        {step === 'welcome' && (
          <>
            <ProgressDots step="welcome" />
            <div className={s.stepCard}>
              <div className={s.stepTitle}>👋 You're invited!</div>
              <div className={s.stepDesc}>
                Tallawah Foods Ghana has invited you to join our ackee pickup service.
                Once you're on board, just message us when your ackee is ready and
                we'll arrange collection or guide you to the nearest branch.
              </div>
              <div className={s.stepInviteDetail}>
                <span><strong>From:</strong> Tallawah Foods Ghana</span>
                <span><strong>For:</strong> {invite.name}</span>
                <span><strong>Phone:</strong> {invite.phone}</span>
              </div>
              <button className={s.actionBtn} onClick={handleAccept}>
                <Leaf size={16} /> Accept invitation
              </button>
            </div>
          </>
        )}

        {/* Out-bubble confirming acceptance */}
        {(step === 'name' || step === 'community' || step === 'done') && (
          <div className={[s.row, s.rowOut].join(' ')}>
            <div className={[s.bubble, s.bubbleOut].join(' ')}>
              Accept invitation ✓
            </div>
          </div>
        )}

        {/* ── Step 2: Name ── */}
        {(step === 'name' || step === 'community' || step === 'done') && (
          <>
            <ProgressDots step="name" />
            <div className={s.stepCard}>
              <div className={s.stepTitle}>What's your name?</div>
              <div className={s.stepDesc}>
                This is how you'll appear to the Tallawah team.
              </div>
              <input
                className={s.stepInput}
                placeholder="Your full name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
                autoFocus={step === 'name'}
                readOnly={step !== 'name'}
              />
              {step === 'name' && (
                <button className={s.actionBtn} onClick={handleNameNext} disabled={!nameInput.trim()}>
                  Continue →
                </button>
              )}
            </div>
          </>
        )}

        {/* Out-bubble with entered name */}
        {(step === 'community' || step === 'done') && (
          <div className={[s.row, s.rowOut].join(' ')}>
            <div className={[s.bubble, s.bubbleOut].join(' ')}>{nameInput}</div>
          </div>
        )}

        {/* ── Step 3: Community ── */}
        {(step === 'community' || step === 'done') && (
          <>
            <ProgressDots step="community" />
            <div className={s.stepCard}>
              <div className={s.stepTitle}>Which community are you farming in?</div>
              <div className={s.stepDesc}>
                We'll use this to match you with the nearest collection branch.
              </div>
              <div className={s.chipsWrap}>
                {communities.map((c) => (
                  <button
                    key={c}
                    className={[s.chip, c === community ? s.selected : ''].join(' ')}
                    onClick={() => {
                      if (step !== 'community') return
                      setCommunity(c)
                    }}
                    disabled={step !== 'community'}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {step === 'community' && (
                <button className={s.actionBtn} style={{ marginTop: 12 }} onClick={handleCommunityNext}>
                  Continue →
                </button>
              )}
            </div>
          </>
        )}

        {/* Out-bubble with chosen community */}
        {step === 'done' && (
          <div className={[s.row, s.rowOut].join(' ')}>
            <div className={[s.bubble, s.bubbleOut].join(' ')}>📍 {community}</div>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 'done' && (
          <>
            <ProgressDots step="done" />
            <div className={s.successCard}>
              <div className={s.successEmoji}>🎉</div>
              <div className={s.successTitle}>You're in, {nameInput.split(' ')[0]}!</div>
              <div className={s.successDesc}>
                Welcome to the Tallawah Foods supplier network. Whenever your ackee
                is ready to harvest, just message us here and we'll handle the rest.
              </div>
              <button className={s.successEnterBtn} onClick={handleEnter}>
                <Check size={16} /> Open my pickup channel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
