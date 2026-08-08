import s from './HomeFab.module.css'

export function HomeFab({ onClick }: { onClick: () => void }) {
  return (
    <button className={s.fab} onClick={onClick} title="Back to home" aria-label="Back to home">
      <img src="./logo.png" alt="" />
    </button>
  )
}
