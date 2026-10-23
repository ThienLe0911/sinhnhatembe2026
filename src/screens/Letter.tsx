import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { content } from '../content/content'
import { getAudioManager } from '../lib/audio'
import { allVisible, splitGraphemes, visibleCounts, type TypewriterFrame } from '../lib/typewriter'
import { useGameStore } from '../state/GameProvider'
import { Button } from '../ui/Button'
import { Mascot } from '../ui/Mascot'
import { springs } from '../ui/motion'
import styles from './Letter.module.css'

// Sau khi thư gõ xong: chờ rồi linh vật mới thì thầm, rồi mới hiện nút sang album (FR-21)
const WHISPER_DELAY_MS = 1100
const ALBUM_DELAY_MS = 1400
const SCROLL_EVERY_CHARS = 48

const sameFrame = (a: TypewriterFrame, b: TypewriterFrame) =>
  a.done === b.done &&
  a.activeIndex === b.activeIndex &&
  a.counts[a.activeIndex] === b.counts[b.activeIndex]

export function Letter() {
  const store = useGameStore()
  const lines = useMemo(() => [...content.letter.paragraphs, content.letter.signature], [])
  const graphemes = useMemo(() => lines.map(splitGraphemes), [lines])
  const lengths = useMemo(() => graphemes.map((g) => g.length), [graphemes])

  const [frame, setFrame] = useState<TypewriterFrame>(() => visibleCounts(lengths, 0))
  const [skipped, setSkipped] = useState(false)
  const [whisper, setWhisper] = useState(false)
  const [albumReady, setAlbumReady] = useState(false)
  const startedAt = useRef(0)
  const activeRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (skipped) return
    startedAt.current = performance.now()
    let raf = 0
    const tick = () => {
      const next = visibleCounts(lengths, performance.now() - startedAt.current)
      setFrame((prev) => (sameFrame(prev, next) ? prev : next))
      if (!next.done) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [lengths, skipped])

  // Cuộn theo đoạn đang gõ để người đọc luôn thấy chữ mới
  const activeCount = frame.counts[frame.activeIndex] ?? 0
  const scrollStep = Math.floor(activeCount / SCROLL_EVERY_CHARS)
  useEffect(() => {
    if (frame.done) return
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [frame.activeIndex, scrollStep, frame.done])

  useEffect(() => {
    if (!frame.done) return
    const t1 = window.setTimeout(() => setWhisper(true), WHISPER_DELAY_MS)
    const t2 = window.setTimeout(() => setAlbumReady(true), WHISPER_DELAY_MS + ALBUM_DELAY_MS)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [frame.done])

  const skip = () => {
    if (frame.done) return
    setSkipped(true)
    setFrame(allVisible(lengths))
  }

  const finish = () => {
    void getAudioManager().unlock()
    store.dispatch({ type: 'FINALE_COMPLETE' })
  }

  return (
    <div className={styles.screen}>
      <div className={styles.top}>
        <div className={styles.mascot}>
          <Mascot state={whisper ? 'idle' : 'happy'} />
        </div>
        {whisper ? (
          <motion.p
            className={styles.whisper}
            initial={{ opacity: 0, x: -12, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={springs.soft}
          >
            {content.whisperLine}
          </motion.p>
        ) : null}
      </div>

      <div className={styles.paper} onClick={skip} role="presentation">
        {/* Bản đầy đủ cho trình đọc màn hình; bản gõ chữ chỉ để nhìn */}
        <div className={styles.srOnly}>
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        {lines.map((_, i) => {
          const g = graphemes[i]
          const n = frame.counts[i]
          const first = i === 0
          const last = i === lines.length - 1
          const closing = i === lines.length - 2
          return (
            <p
              key={i}
              ref={i === frame.activeIndex ? activeRef : null}
              aria-hidden="true"
              className={[
                styles.line,
                first ? styles.greeting : '',
                closing ? styles.closing : '',
                last ? styles.signature : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span>{g.slice(0, n).join('')}</span>
              <span className={styles.ghost}>{g.slice(n).join('')}</span>
            </p>
          )
        })}
      </div>

      <div className={styles.footer}>
        {frame.done ? (
          albumReady ? (
            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={springs.soft}
            >
              <Button onClick={finish}>Xem album</Button>
            </motion.div>
          ) : null
        ) : (
          <p className={styles.hint}>Chạm vào thư để đọc nhanh</p>
        )}
      </div>
    </div>
  )
}
