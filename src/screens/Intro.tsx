import { animate, motion, useMotionValue } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { content } from '../content/content'
import { getAudioManager } from '../lib/audio'
import { useGameStore } from '../state/GameProvider'
import { GachaMachine } from '../ui/GachaMachine'
import { Mascot, type MascotState } from '../ui/Mascot'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import { DropRateSheet } from './DropRateSheet'
import styles from './Intro.module.css'

// Thả trong vùng khe xu mở rộng thêm từng này pixel thì tính là trúng khe
const SNAP_PADDING = 28

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

function HeartCoin() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="var(--color-gold-2)" />
      <circle cx="32" cy="32" r="24" fill="var(--color-gold-1)" />
      <path
        fill="var(--color-peach-strong)"
        d="M32 47 C 14 34 14 20 24 18 C 28 17.4 31 19.4 32 22 C 33 19.4 36 17.4 40 18 C 50 20 50 34 32 47 Z"
      />
      <ellipse
        cx="22"
        cy="14"
        rx="8"
        ry="3"
        fill="#fff"
        opacity="0.55"
        transform="rotate(-24 22 14)"
      />
    </svg>
  )
}

export function Intro() {
  const store = useGameStore()
  const audio = getAudioManager()
  const slotRef = useRef<HTMLDivElement>(null)
  const coinRef = useRef<HTMLButtonElement>(null)
  const busy = useRef(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const opacity = useMotionValue(1)
  const [mood, setMood] = useState<MascotState>('idle')
  const [sheetOpen, setSheetOpen] = useState(false)

  const insert = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    void audio.unlock()

    const slot = slotRef.current?.getBoundingClientRect()
    const coin = coinRef.current?.getBoundingClientRect()
    if (slot && coin) {
      // Tâm nghỉ của xu = tâm hiện tại trừ phần đã dịch chuyển
      const restX = coin.left + coin.width / 2 - x.get()
      const restY = coin.top + coin.height / 2 - y.get()
      await Promise.all([
        animate(x, slot.left + slot.width / 2 - restX, springs.soft),
        animate(y, slot.top + slot.height / 2 - restY, springs.soft),
        animate(scale, 0.4, { duration: 0.35 }),
      ])
    }
    audio.sfx.play('coin')
    animate(opacity, 0, { duration: 0.12 })
    setMood('happy')
    await sleep(500)
    store.dispatch({ type: 'INSERT_COIN' })
  }, [audio, store, x, y, scale, opacity])

  const onDragEnd = useCallback(() => {
    const slot = slotRef.current?.getBoundingClientRect()
    const coin = coinRef.current?.getBoundingClientRect()
    if (!slot || !coin) return
    const cx = coin.left + coin.width / 2
    const cy = coin.top + coin.height / 2
    const hit =
      cx > slot.left - SNAP_PADDING &&
      cx < slot.right + SNAP_PADDING &&
      cy > slot.top - SNAP_PADDING &&
      cy < slot.bottom + SNAP_PADDING
    if (hit) {
      void insert()
    } else {
      animate(x, 0, springs.bouncy)
      animate(y, 0, springs.bouncy)
    }
  }, [insert, x, y])

  return (
    <Stage>
      {/* Cú chạm đầu tiên ở bất kỳ đâu mở khoá âm thanh trên iOS */}
      <div className={styles.screen} onPointerUpCapture={() => void audio.unlock()}>
        <header className={styles.header}>
          <p className={styles.name}>{content.machineName}</p>
          <button
            type="button"
            className={styles.info}
            aria-label="Xem tỉ lệ rơi"
            aria-haspopup="dialog"
            onClick={() => setSheetOpen(true)}
          >
            i
          </button>
        </header>

        <GachaMachine
          className={styles.machine}
          mascot={<Mascot state={mood} />}
          coinSlotGlow
          coinSlotRef={slotRef}
        />

        <div className={styles.coinZone}>
          <motion.button
            ref={coinRef}
            type="button"
            className={styles.coin}
            style={{ x, y, scale, opacity }}
            drag
            dragMomentum={false}
            dragElastic={0.25}
            onDragEnd={onDragEnd}
            onTap={() => void insert()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                void insert()
              }
            }}
            aria-label="Xu hình trái tim. Chạm hoặc kéo vào khe xu của máy."
          >
            <HeartCoin />
          </motion.button>
          <p className={styles.label}>Xu duy nhất hôm nay: 1 cái ôm</p>
          <p className={styles.hint}>Kéo xu vào khe, hoặc chạm vào xu.</p>
        </div>

        <DropRateSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </div>
    </Stage>
  )
}
