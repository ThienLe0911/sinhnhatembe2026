import { useState } from 'react'
import type { Tier } from '../content/types'
import { Capsule } from '../ui/Capsule'
import { GachaMachine } from '../ui/GachaMachine'
import { Mascot, type MascotState } from '../ui/Mascot'
import { Stage } from '../ui/Stage'
import styles from './MachineSheet.module.css'

const mascotStates: MascotState[] = ['idle', 'happy', 'surprised', 'sleepy', 'celebrate']
const tiers: Tier[] = ['normal', 'silver', 'gold']

export default function MachineSheet() {
  const [mascot, setMascot] = useState<MascotState>('idle')
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [glow, setGlow] = useState(false)
  const [tier, setTier] = useState<Tier | 'none'>('normal')
  const [open, setOpen] = useState(false)

  return (
    <Stage>
      <div className={styles.sheet}>
        <GachaMachine
          mascot={<Mascot state={mascot} sparkle={tier === 'silver'} />}
          knobAngle={angle}
          spinning={spinning}
          coinSlotGlow={glow}
          tray={tier === 'none' ? null : <Capsule tier={tier} open={open} size="3.4rem" />}
        />

        <div className={styles.controls}>
          <label className={styles.field}>
            Núm xoay: {angle}°
            <input
              type="range"
              min="0"
              max="360"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={spinning}
              onChange={(e) => setSpinning(e.target.checked)}
            />
            Máy đang quay
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={glow} onChange={(e) => setGlow(e.target.checked)} />
            Khe xu sáng
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />
            Bật nắp capsule
          </label>
          <div className={styles.group}>
            {mascotStates.map((s) => (
              <button
                key={s}
                type="button"
                className={s === mascot ? styles.on : ''}
                onClick={() => setMascot(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className={styles.group}>
            {(['none', ...tiers] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={t === tier ? styles.on : ''}
                onClick={() => setTier(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Stage>
  )
}
