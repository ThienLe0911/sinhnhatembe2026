import confetti from 'canvas-confetti'
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAge, getCandleDigits } from '../content/content'
import { getAudioManager } from '../lib/audio'
import { startBlowDetection, type BlowDetection } from '../lib/blow'
import { useReducedMotionPref } from '../lib/reduced-motion'
import { Button } from '../ui/Button'
import { Cake } from '../ui/Cake'
import { Mascot, type MascotState } from '../ui/Mascot'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import styles from './Finale.module.css'
import { Letter } from './Letter'

type FinaleStage = 'ready' | 'preparing' | 'listening' | 'denied' | 'celebrate' | 'letter'

const CONFETTI_COLORS = ['#f2a193', '#b4a5ee', '#8fba7a', '#fbeab4', '#e9bb52', '#c9d1dc']
// Sau khi bấm nút cần một khoảng ngắn để hiệu chuẩn tiếng ồn nền, đừng thổi ngay (xem T08)
const WARMUP_MS = 700
// Chờ pháo giấy bay một lúc rồi mới mời đọc thư
const READ_BUTTON_DELAY_MS = 1800

function fireConfetti() {
  const shoot = (x: number, angle: number) =>
    confetti({
      particleCount: 70,
      spread: 70,
      startVelocity: 48,
      angle,
      origin: { x, y: 0.75 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    })
  shoot(0.08, 60)
  shoot(0.92, 120)
  window.setTimeout(
    () =>
      confetti({
        particleCount: 110,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        colors: CONFETTI_COLORS,
        disableForReducedMotion: true,
      }),
    320,
  )
}

const TEXT: Record<Exclude<FinaleStage, 'letter'>, { title: string; body: string }> = {
  ready: {
    title: 'Thổi nến nào, em bé!',
    body: 'Bấm nút rồi thổi thật vào micro nhé.',
  },
  preparing: {
    title: 'Đang bật micro…',
    body: 'Nếu iPhone hỏi, em bé chọn Cho phép nhé.',
  },
  listening: { title: 'Chuẩn bị nhé…', body: 'Hít một hơi thật sâu.' },
  denied: {
    title: 'Chưa dùng được micro',
    body: 'Không sao, chạm nút bên dưới để thổi nến nhé.',
  },
  celebrate: {
    title: 'Chúc mừng sinh nhật em bé!',
    body: `Tuổi ${getAge()} thật nhiều niềm vui.`,
  },
}

const MOOD: Record<Exclude<FinaleStage, 'letter'>, MascotState> = {
  ready: 'idle',
  preparing: 'surprised',
  listening: 'happy',
  denied: 'idle',
  celebrate: 'celebrate',
}

export function Finale() {
  const audio = getAudioManager()
  const level = useMotionValue(0)
  const reduced = useReducedMotionPref()
  const [stage, setStage] = useState<FinaleStage>('ready')
  const [canBlow, setCanBlow] = useState(false)
  const [showRead, setShowRead] = useState(false)
  const detection = useRef<BlowDetection | null>(null)
  const ducked = useRef(false)
  const finished = useRef(false)
  const tapping = useRef(false)
  const timers = useRef<number[]>([])

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  // Luôn tắt micro và trả nhạc nền lại, dù thổi xong, từ chối hay rời màn hình (BR-06)
  const stopMic = useCallback(() => {
    detection.current?.stop()
    detection.current = null
    if (ducked.current) {
      audio.unduck()
      ducked.current = false
    }
  }, [audio])

  useEffect(
    () => () => {
      stopMic()
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    [stopMic],
  )

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    stopMic()
    level.set(0)
    audio.sfx.play('sparkle')
    later(() => audio.sfx.play('confetti'), 250)
    fireConfetti()
    setStage('celebrate')
    later(() => setShowRead(true), READ_BUTTON_DELAY_MS)
  }, [audio, level, later, stopMic])

  const startMic = useCallback(() => {
    if (detection.current || finished.current || tapping.current) return
    void audio.unlock()
    audio.duck(0)
    ducked.current = true
    setCanBlow(false)
    setStage('preparing')
    detection.current = startBlowDetection({
      onLevel: (value) => level.set(value),
      onStateChange: (state) => {
        if (state === 'listening') {
          setStage('listening')
          later(() => setCanBlow(true), WARMUP_MS)
        } else if (state === 'denied' || state === 'unavailable') {
          stopMic()
          level.set(0)
          setStage('denied')
        }
      },
      onBlow: finish,
    })
  }, [audio, level, later, stopMic, finish])

  // Phương án thay thế bắt buộc: chạm để thổi (FR-18), kết quả giống thổi thật
  const blowByTap = useCallback(async () => {
    if (finished.current || tapping.current) return
    tapping.current = true
    void audio.unlock()
    stopMic()
    if (reduced) {
      // Giảm chuyển động: không có đoạn lửa nghiêng dần, chỉ chờ chút rồi tắt
      level.set(1)
      await new Promise<void>((resolve) => window.setTimeout(resolve, 250))
    } else {
      await animate(level, 1, { duration: 0.7, ease: 'easeIn' })
    }
    finish()
  }, [audio, level, stopMic, finish, reduced])

  if (stage === 'letter') {
    return (
      <Stage>
        <Letter />
      </Stage>
    )
  }

  const text = TEXT[stage]
  const lit = stage !== 'celebrate'
  const hint =
    stage === 'listening' && canBlow
      ? { title: 'Thổi đi nào!', body: 'Thổi thật mạnh vào micro.' }
      : text

  return (
    <Stage>
      <div className={styles.screen}>
        <div className={styles.mascot}>
          <Mascot state={MOOD[stage]} />
        </div>

        <Cake
          className={styles.cake}
          digits={getCandleDigits()}
          level={level}
          lit={lit}
          decorated={!lit}
        />

        <div className={styles.copy} aria-live="polite">
          <h1 className={styles.title}>{hint.title}</h1>
          <p className={styles.body}>{hint.body}</p>
        </div>

        <div className={styles.actions}>
          <AnimatePresence mode="wait">
            {stage === 'celebrate' ? (
              showRead ? (
                <motion.div
                  key="read"
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={springs.soft}
                >
                  <Button onClick={() => setStage('letter')}>Mở thư</Button>
                </motion.div>
              ) : null
            ) : (
              <motion.div
                key="blow"
                className={styles.buttons}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {stage === 'ready' ? <Button onClick={startMic}>Thổi nến</Button> : null}
                <Button
                  variant={stage === 'denied' ? 'primary' : 'ghost'}
                  onClick={() => void blowByTap()}
                >
                  Chạm để thổi
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Stage>
  )
}
