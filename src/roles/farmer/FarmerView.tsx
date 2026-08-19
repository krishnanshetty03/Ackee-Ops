import ps from '../PhoneRolePage.module.css'
import { PhoneFrame } from '../../components/ui/DeviceFrame'
import { FarmerApp } from './FarmerApp'
import { FarmerOnboarding } from './FarmerOnboarding'
import { PersonaSwitcher } from '../../components/PersonaSwitcher'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTallawahStore } from '../../store/useStore'
import type { Theme } from '../../lib/useTheme'
import { Leaf } from '../../components/icons'

/** Sentinel ID: render the onboarding flow instead of a live farmer chat */
const ONBOARDING_ID = '__onboarding__'

export function FarmerView({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const farmers = useTallawahStore((st) => st.farmers)
  const invites = useTallawahStore((st) => st.invites)
  const activeFarmerId = useTallawahStore((st) => st.activeFarmerId)
  const setActiveFarmerId = useTallawahStore((st) => st.setActiveFarmerId)

  const hasPendingInvite = invites.some((i) => i.status === 'pending')

  // PersonaSwitcher options: existing farmers + onboarding sentinel (if a pending invite exists)
  const switcherOptions = [
    ...farmers.map((f) => ({ id: f.id, name: f.name, meta: `${f.community} · ${f.phone}`, initials: f.initials, hue: f.avatarHue })),
    ...(hasPendingInvite
      ? [{ id: ONBOARDING_ID, name: 'New farmer (from invite)', meta: 'Complete onboarding flow', initials: '+', hue: 120 }]
      : []),
  ]

  return (
    <div className={ps.page}>
      <div className={ps.topBar}>
        <div className={ps.topBarLeft}>
          <span className={ps.roleTag}>
            <span className={ps.roleTagIcon}>
              <Leaf size={16} />
            </span>
            Farmer channel
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <PersonaSwitcher
            label={activeFarmerId === ONBOARDING_ID ? 'Joining as' : 'Texting as'}
            activeId={activeFarmerId}
            onSelect={setActiveFarmerId}
            options={switcherOptions}
          />
        </div>
      </div>
      <div className={ps.stageArea}>
        <div className={ps.phoneShadowFloor} style={{ width: 'min(392px, 88vw)' }}>
          <PhoneFrame dark={theme === 'dark'}>
            {activeFarmerId === ONBOARDING_ID ? (
              <FarmerOnboarding
                theme={theme}
                onComplete={(farmerId) => setActiveFarmerId(farmerId)}
              />
            ) : (
              <FarmerApp farmerId={activeFarmerId} theme={theme} />
            )}
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
