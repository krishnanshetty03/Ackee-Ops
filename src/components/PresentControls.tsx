import s from './PresentControls.module.css'
import { Button } from './ui/Button'
import { ThemeToggle } from './ui/ThemeToggle'
import { Play, Square } from './icons'
import type { Theme } from '../lib/useTheme'

export function PresentControls({
  autoplayRunning,
  onPlay,
  onStop,
  theme,
  onToggleTheme,
}: {
  autoplayRunning: boolean
  onPlay: () => void
  onStop: () => void
  theme: Theme
  onToggleTheme: () => void
}) {
  return (
    <div className={s.cluster}>
      {autoplayRunning ? (
        <Button variant="danger" size="sm" icon={<Square size={13} />} onClick={onStop}>
          Stop demo
        </Button>
      ) : (
        <Button variant="primary" size="sm" icon={<Play size={13} />} onClick={onPlay}>
          Play demo
        </Button>
      )}
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </div>
  )
}
