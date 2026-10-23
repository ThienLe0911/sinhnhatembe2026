import { motion, useMotionValue } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { content } from '../content/content'
import { getAudioManager } from '../lib/audio'
import { canDrop, getProgress } from '../state/game'
import { useGameState, useGameStore } from '../state/GameProvider'
import { Capsule } from '../ui/Capsule'
import { GachaMachine } from '../ui/GachaMachine'
import { Mascot, type MascotState } from '../ui/Mascot'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import styles from './Play.module.css'
import { useKnobGesture } from './useKnobGesture'

const KNOB_LABEL = 'Núm quay. Xoay một vòng, hoặc giữ núm, hoặc nhấn Enter để quay.'

export function Play() {
  const store = useGameStore()
  const state = useGameState()
  const audio = getAudioManager()
  const angle = useMotionValue(0)
  const [opening, setOpening] = useState(false)
  const openTimer = useRef<number | undefined>(undefined)

  const progress = getProgress(content, state)
  const tray = state.trayId ? (content.capsules.find((c) => c.id === state.trayId) ?? null) : null
  const allowDrop = canDrop(content, state)

  const onSpinEnd = useCallback(() => {
    store.dispatch({ type: 'DROP_CAPSULE' })
    audio.sfx.play('drop')
  }, [store, audio])
  const onTick = useCallback(() => audio.sfx.play('knob'), [audio])

  const { spinning, knobProps } = useKnobGesture({
    enabled: allowDrop,
    angle,
    onSpinEnd,
    onTick,
    label: KNOB_LABEL,
  })

  // Tạm thời mở thẳng capsule; T15 thay bằng màn lật thẻ trước khi ghi nhận đã mở
  const openCapsule = useCallback(() => {
    if (!tray || opening) return
    setOpening(true)
    audio.sfx.play('pop')
    window.clearTimeout(openTimer.current)
    openTimer.current = window.setTimeout(() => {
      store.dispatch({ type: 'OPEN_CAPSULE' })
      setOpening(false)
    }, 700)
  }, [tray, opening, audio, store])

  const mood: MascotState = spinning ? 'surprised' : tray ? 'happy' : 'idle'
  const hint = spinning
    ? 'Đang quay…'
    : tray
      ? 'Chạm vào capsule để mở'
      : 'Xoay núm một vòng để quay, hoặc giữ núm'

  return (
    <Stage>
      <div className={styles.screen} onPointerUpCapture={() => void audio.unlock()}>
        <header className={styles.header}>
          <p className={styles.count}>
            Đã sưu tập <strong>{progress.opened}</strong>/{progress.total}
          </p>
        </header>

        <GachaMachine
          className={styles.machine}
          mascot={<Mascot state={mood} sparkle={tray?.tier === 'silver'} />}
          knobAngle={angle}
          spinning={spinning}
          knobProps={knobProps}
          tray={
            tray ? (
              <motion.div
                key={tray.id}
                className={styles.trayCapsule}
                role="button"
                tabIndex={0}
                aria-label="Mở capsule"
                initial={{ y: -170, opacity: 0, rotate: -50 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={springs.bouncy}
                whileTap={{ scale: 0.92 }}
                onTap={openCapsule}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openCapsule()
                  }
                }}
              >
                <Capsule tier={tray.tier} open={opening} size="3.6rem" />
              </motion.div>
            ) : null
          }
        />

        <p className={styles.hint} aria-live="polite">
          {hint}
        </p>
      </div>
    </Stage>
  )
}
