import { Mascot, type MascotState } from '../ui/Mascot'
import { Stage } from '../ui/Stage'
import styles from './MascotSheet.module.css'

const states: Array<[MascotState, string]> = [
  ['idle', 'Chờ (chống cằm, chớp mắt)'],
  ['happy', 'Vui'],
  ['surprised', 'Ngạc nhiên'],
  ['sleepy', 'Ngủ gật (cú đêm)'],
  ['celebrate', 'Ăn mừng (finale)'],
]

export default function MascotSheet() {
  return (
    <Stage>
      <div className={styles.sheet}>
        <header>
          <p className={styles.eyebrow}>Linh vật · T10</p>
          <h1 className={styles.title}>Em bé chibi</h1>
        </header>
        <div className={styles.grid}>
          {states.map(([state, label]) => (
            <figure key={state} className={styles.cell}>
              <Mascot state={state} sparkle={state === 'idle'} label={label} />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Stage>
  )
}
