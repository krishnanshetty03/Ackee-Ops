import s from './ThemeToggle.module.css'
import { Moon, Sun } from '../icons'
import type { Theme } from '../../lib/useTheme'

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button className={s.toggle} onClick={onToggle} aria-label="Toggle theme" title="Toggle light / dark">
      <span className={s.thumb}>{theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}</span>
    </button>
  )
}
