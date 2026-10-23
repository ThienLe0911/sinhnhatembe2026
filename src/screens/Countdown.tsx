import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { content } from '../content/content'
import { getAudioManager } from '../lib/audio'
import { UNLOCK_AT_MS, getRemaining, type Remaining } from '../lib/time'
import { useGameStore } from '../state/GameProvider'
import { Button } from '../ui/Button'
import { Mascot } from '../ui/Mascot'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import styles from './Countdown.module.css'

const READY_TITLE = 'Đến giờ rồi, em bé ơi!'
const READY_BODY = 'Anh Thúi đợi xong rồi nè. Vào chơi thôi.'

export const pad2 = (n: number) => String(n).padStart(2, '0')

// "00:00 27/10" theo giờ Việt Nam, không phụ thuộc múi giờ của máy
export function formatUnlockTime(unlockAtMs: number): string {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(unlockAtMs)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${part('hour')}:${part('minute')} ${part('day')}/${part('month')}`
}

// Cập nhật đúng vào lúc chữ số giây đổi (getRemaining làm tròn lên) thay vì mỗi 1000ms cố định
function useRemaining(now: () => number): Remaining {
  const [remaining, setRemaining] = useState(() => getRemaining(now()))
  useEffect(() => {
    let timer: number | undefined
    const tick = () => {
      const next = getRemaining(now())
      setRemaining(next)
      if (!next.unlocked) timer = window.setTimeout(tick, (next.totalMs % 1000 || 1000) + 20)
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [now])
  return remaining
}

function Tile({ label, value }: { label: string; value: number }) {
  const text = pad2(value)
  return (
    <div className={styles.tile}>
      <div className={styles.number} aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.span
            key={text}
            className={styles.digit}
            initial={{ y: '70%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-70%', opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export function Countdown({ now }: { now: () => number }) {
  const store = useGameStore()
  const remaining = useRemaining(now)
  const ready = remaining.unlocked

  const enter = () => {
    // Cú chạm này là cú chạm đầu tiên nên mở khoá được âm thanh (FR-03, FR-07)
    void getAudioManager().unlock()
    store.dispatch({ type: 'UNLOCKED' })
  }

  const spoken = `Còn ${remaining.days} ngày ${remaining.hours} giờ ${remaining.minutes} phút ${remaining.seconds} giây`

  return (
    <Stage>
      <div className={styles.screen}>
        <div className={styles.mascot}>
          <Mascot state={ready ? 'celebrate' : 'idle'} />
        </div>

        <div className={styles.copy}>
          <h1 className={styles.title}>{ready ? READY_TITLE : content.countdownCopy.title}</h1>
          <p className={styles.body}>{ready ? READY_BODY : content.countdownCopy.body}</p>
        </div>

        <div className={styles.tiles} role="timer" aria-label={ready ? 'Đã đến giờ' : spoken}>
          <Tile label="ngày" value={remaining.days} />
          <Tile label="giờ" value={remaining.hours} />
          <Tile label="phút" value={remaining.minutes} />
          <Tile label="giây" value={remaining.seconds} />
        </div>

        {ready ? (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={springs.soft}
          >
            <Button onClick={enter}>Vào chơi</Button>
          </motion.div>
        ) : (
          <p className={styles.when}>Mở lúc {formatUnlockTime(UNLOCK_AT_MS)}</p>
        )}
      </div>
    </Stage>
  )
}
