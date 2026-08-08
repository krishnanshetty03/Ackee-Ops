import s from './NarrationBanner.module.css'
import { useTallawahStore } from '../store/useStore'

export function NarrationBanner() {
  const spotlight = useTallawahStore((st) => st.spotlight)
  const autoplayRunning = useTallawahStore((st) => st.autoplayRunning)

  if (!autoplayRunning || !spotlight?.note) return null

  return (
    <div className={s.wrap} key={spotlight.note}>
      <span className={s.dot} />
      <span className={s.text}>{spotlight.note}</span>
    </div>
  )
}
