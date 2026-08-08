import ps from '../PhoneRolePage.module.css'
import { PhoneFrame } from '../../components/ui/DeviceFrame'
import { FarmerApp } from './FarmerApp'
import { PersonaSwitcher } from '../../components/PersonaSwitcher'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTallawahStore } from '../../store/useStore'
import type { Theme } from '../../lib/useTheme'
import { Leaf } from '../../components/icons'

export function FarmerView({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const farmers = useTallawahStore((st) => st.farmers)
  const activeFarmerId = useTallawahStore((st) => st.activeFarmerId)
  const setActiveFarmerId = useTallawahStore((st) => st.setActiveFarmerId)

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
            label="Texting as"
            activeId={activeFarmerId}
            onSelect={setActiveFarmerId}
            options={farmers.map((f) => ({ id: f.id, name: f.name, meta: `${f.community} · ${f.phone}`, initials: f.initials, hue: f.avatarHue }))}
          />
        </div>
      </div>
      <div className={ps.stageArea}>
        <div className={ps.phoneShadowFloor} style={{ width: 'min(392px, 88vw)' }}>
          <PhoneFrame dark={theme === 'dark'}>
            <FarmerApp farmerId={activeFarmerId} theme={theme} />
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
