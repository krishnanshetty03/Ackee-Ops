import { useEffect } from 'react'
import s from './App.module.css'
import { useTheme } from './lib/useTheme'
import { startSimulation, startSync, useTallawahStore } from './store/useStore'
import { startAutoplay, stopAutoplay } from './lib/autoplay'
import { STAFF_CREDENTIAL, DRIVER_CREDENTIAL, MD_CREDENTIAL } from './lib/auth'
import { ToastProvider } from './components/ui/Toast'
import { HomeView } from './components/HomeView'
import { PresentView } from './components/PresentView'
import { NarrationBanner } from './components/NarrationBanner'
import { HomeFab } from './components/HomeFab'
import { PresentControls } from './components/PresentControls'
import { LoginGate } from './components/LoginGate'
import { FarmerView } from './roles/farmer/FarmerView'
import { StaffApp } from './roles/staff/StaffApp'
import { DriverView } from './roles/driver/DriverView'
import { MDApp } from './roles/md/MDApp'

export default function App() {
  const { theme, toggle } = useTheme()
  const view = useTallawahStore((st) => st.view)
  const setView = useTallawahStore((st) => st.setView)
  const autoplayRunning = useTallawahStore((st) => st.autoplayRunning)
  const resetDemo = useTallawahStore((st) => st.resetDemo)
  const staffAuthed = useTallawahStore((st) => st.staffAuthed)
  const driverAuthed = useTallawahStore((st) => st.driverAuthed)
  const mdAuthed = useTallawahStore((st) => st.mdAuthed)
  const loginStaff = useTallawahStore((st) => st.loginStaff)
  const loginDriver = useTallawahStore((st) => st.loginDriver)
  const loginMD = useTallawahStore((st) => st.loginMD)
  const logoutStaff = useTallawahStore((st) => st.logoutStaff)
  const logoutDriver = useTallawahStore((st) => st.logoutDriver)
  const logoutMD = useTallawahStore((st) => st.logoutMD)

  useEffect(() => {
    startSimulation()
    startSync()
  }, [])

  const playDemo = () => {
    setView('present')
    startAutoplay()
  }

  return (
    <ToastProvider position="topRight">
      <div className={s.root}>
        <div className={s.viewport}>
          {view === 'home' && <HomeView onNavigate={setView} theme={theme} onToggleTheme={toggle} onReset={resetDemo} />}

          {view === 'farmer' && <FarmerView theme={theme} onToggleTheme={toggle} />}

          {view === 'staff' &&
            (staffAuthed ? (
              <StaffApp theme={theme} onToggleTheme={toggle} onSignOut={logoutStaff} />
            ) : (
              <LoginGate role="staff" credential={STAFF_CREDENTIAL} onSuccess={loginStaff} onBack={() => setView('home')} />
            ))}

          {view === 'driver' &&
            (driverAuthed ? (
              <DriverView theme={theme} onToggleTheme={toggle} onSignOut={logoutDriver} />
            ) : (
              <LoginGate role="driver" credential={DRIVER_CREDENTIAL} onSuccess={loginDriver} onBack={() => setView('home')} />
            ))}

          {view === 'md' &&
            (mdAuthed ? (
              <MDApp theme={theme} onToggleTheme={toggle} onSignOut={logoutMD} />
            ) : (
              <LoginGate role="md" credential={MD_CREDENTIAL} onSuccess={loginMD} onBack={() => setView('home')} />
            ))}

          {view === 'present' && <PresentView theme={theme} onToggleTheme={toggle} />}
        </div>

        {view !== 'home' && <HomeFab onClick={() => setView('home')} />}
        {view === 'present' && <PresentControls autoplayRunning={autoplayRunning} onPlay={playDemo} onStop={stopAutoplay} theme={theme} onToggleTheme={toggle} />}
        <NarrationBanner />
      </div>
    </ToastProvider>
  )
}
