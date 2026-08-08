import { StaffShell } from './StaffShell'
import { useTallawahStore } from '../../store/useStore'
import { Overview } from './pages/Overview'
import { Intake } from './pages/Intake'
import { Dispatch } from './pages/Dispatch'
import { Tracking } from './pages/Tracking'
import { Receiving } from './pages/Receiving'
import { Exceptions } from './pages/Exceptions'
import type { Theme } from '../../lib/useTheme'

export function StaffApp({ theme, onToggleTheme, onSignOut }: { theme: Theme; onToggleTheme: () => void; onSignOut?: () => void }) {
  const staffTab = useTallawahStore((st) => st.staffTab)

  return (
    <StaffShell theme={theme} onToggleTheme={onToggleTheme} onSignOut={onSignOut}>
      {staffTab === 'overview' && <Overview theme={theme} />}
      {staffTab === 'intake' && <Intake />}
      {staffTab === 'dispatch' && <Dispatch />}
      {staffTab === 'tracking' && <Tracking theme={theme} />}
      {staffTab === 'receiving' && <Receiving />}
      {staffTab === 'exceptions' && <Exceptions />}
    </StaffShell>
  )
}
