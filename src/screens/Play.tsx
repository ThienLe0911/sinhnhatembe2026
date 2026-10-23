import { AnimatePresence, motion, useMotionValue } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { content } from '../content/content'
import { getAudioManager } from '../lib/audio'
import { preloadCardMedia } from '../lib/preload'
import { useReducedMotionPref } from '../lib/reduced-motion'
import { canDrop, getProgress, getSpinsUntilGold, isGoldAvailable } from '../state/game'
import { useGameState, useGameStore } from '../state/GameProvider'
import { Capsule } from '../ui/Capsule'
import { GachaMachine } from '../ui/GachaMachine'
import { Mascot, type MascotState } from '../ui/Mascot'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import { MemoryCard } from './MemoryCard'
import { pityText } from './pity'
import styles from './Play.module.css'
import { useKnobGesture } from './useKnobGesture'

const KNOB_LABEL = 'Núm quay. Xoay một vòng, hoặc giữ núm, hoặc nhấn Enter để quay.'
// Thời gian nắp bật ra trước khi hiện thẻ
const OPEN_MS = 650

type Phase = 'idle' | 'opening' | 'card'

export function Play() {
  const store = useGameStore()
  const state = useGameState()
  const audio = getAudioManager()
  const angle = useMotionValue(0)
  const reduced = useReducedMotionPref()
  const [phase, setPhase] = useState<Phase>('idle')
  const openTimer = useRef<number | undefined>(undefined)

  const progress = getProgress(content, state)
  const tray = state.trayId ? (content.capsules.find((c) => c.id === state.trayId) ?? null) : null
  const allowDrop = canDrop(content, state)
  const goldReady = isGoldAvailable(content, state)
  const pity = pityText(getSpinsUntilGold(content, state))

  useEffect(() => () => window.clearTimeout(openTimer.current), [])

  // Tải trước ảnh của thẻ ngay khi capsule rơi vào khay
  useEffect(() => {
    if (tray) preloadCardMedia(tray.card)
  }, [tray])

  const onSpinEnd = useCallback(() => {
    store.dispatch({ type: 'DROP_CAPSULE' })
    audio.sfx.play('drop')
  }, [store, audio])
  const onTick = useCallback(() => audio.sfx.play('knob'), [audio])

  const { spinning, knobProps } = useKnobGesture({
    enabled: allowDrop && phase === 'idle',
    angle,
    onSpinEnd,
    onTick,
    label: KNOB_LABEL,
    reduced,
  })

  const openCapsule = useCallback(() => {
    if (!tray || phase !== 'idle') return
    setPhase('opening')
    audio.sfx.play('pop')
    window.clearTimeout(openTimer.current)
    openTimer.current = window.setTimeout(() => {
      if (tray.tier === 'gold') {
        // Capsule vàng không có thẻ: ghi nhận đã mở và sang màn thổi nến
        store.dispatch({ type: 'OPEN_CAPSULE' })
        return
      }
      setPhase('card')
    }, OPEN_MS)
  }, [tray, phase, audio, store])

  // Thẻ chỉ được ghi nhận vào album khi người xem đã đóng nó
  const closeCard = useCallback(() => {
    audio.sfx.play('sparkle')
    store.dispatch({ type: 'OPEN_CAPSULE' })
    setPhase('idle')
  }, [audio, store])

  const mood: MascotState = spinning ? 'surprised' : tray ? 'happy' : 'idle'
  const hint = spinning
    ? 'Đang quay…'
    : tray
      ? phase === 'idle'
        ? 'Chạm vào capsule để mở'
        : ''
      : 'Xoay núm một vòng để quay, hoặc giữ núm'

  return (
    <Stage>
      <div className={styles.screen} onPointerUpCapture={() => void audio.unlock()}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.count}
            disabled={progress.opened === 0}
            aria-label={`Mở album, đã sưu tập ${progress.opened} trên ${progress.total} thẻ`}
            onClick={() => store.dispatch({ type: 'OPEN_ALBUM' })}
          >
            Đã sưu tập{' '}
            <motion.strong
              key={progress.opened}
              className={styles.countNumber}
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              transition={springs.bouncy}
            >
              {progress.opened}
            </motion.strong>
            /{progress.total}
            {progress.opened > 0 ? <span aria-hidden="true"> · Album ›</span> : null}
          </button>
          <span className={styles.gold} data-ready={goldReady}>
            <span className={styles.goldDot} aria-hidden="true" />
            {goldReady ? 'Capsule vàng sẵn sàng' : 'Capsule vàng đang chờ'}
          </span>
        </header>
        <p className={styles.pity}>{pity}</p>

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
                <Capsule tier={tray.tier} open={phase !== 'idle'} size="3.6rem" />
              </motion.div>
            ) : null
          }
        />

        <p className={styles.hint} aria-live="polite">
          {hint}
        </p>

        <AnimatePresence>
          {phase === 'card' && tray ? (
            <MemoryCard key={tray.id} capsule={tray} onClose={closeCard} />
          ) : null}
        </AnimatePresence>
      </div>
    </Stage>
  )
}
