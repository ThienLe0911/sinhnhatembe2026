import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { content } from '../content/content'
import type { Card, Capsule as CapsuleData } from '../content/types'
import { resolveMedia } from '../lib/media'
import { cardImageNames } from '../lib/preload'
import { getAlbumSlots, getProgress, type AlbumSlot } from '../state/game'
import { useGameState, useGameStore } from '../state/GameProvider'
import { Button } from '../ui/Button'
import { Capsule } from '../ui/Capsule'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Mascot } from '../ui/Mascot'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import styles from './Album.module.css'
import { MemoryCard } from './MemoryCard'

/** Dòng chữ ngắn thay cho ảnh ở ô album của thẻ voucher và lời hứa. */
export function previewText(card: Card): string {
  if (card.kind === 'voucher') return card.text
  if (card.kind === 'promise') return card.promises[0] ?? ''
  return ''
}

function Cell({
  slot,
  index,
  onOpen,
}: {
  slot: AlbumSlot
  index: number
  onOpen: (capsule: CapsuleData) => void
}) {
  const { capsule, opened } = slot
  const isFinale = capsule.card.kind === 'finale'
  const image = resolveMedia(cardImageNames(capsule.card)[0])
  const text = previewText(capsule.card)
  const enter = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { ...springs.soft, delay: index * 0.05 },
  }

  if (!opened) {
    return (
      <motion.div className={`${styles.cell} ${styles.locked}`} aria-label="Thẻ chưa mở" {...enter}>
        <Capsule tier={capsule.tier} size="3rem" />
        <span className={styles.label}>Chưa mở</span>
      </motion.div>
    )
  }

  return (
    <motion.button
      type="button"
      className={`${styles.cell} ${styles[capsule.tier]}`}
      aria-label={isFinale ? 'Xem lại màn thổi nến' : `Xem thẻ ${capsule.title}`}
      onClick={() => onOpen(capsule)}
      whileTap={{ scale: 0.96 }}
      {...enter}
    >
      {image ? (
        <img className={styles.thumb} src={image} alt="" draggable={false} />
      ) : isFinale ? (
        <Capsule tier="gold" open size="3.2rem" />
      ) : text ? (
        <span className={styles.snippet}>{text}</span>
      ) : (
        <span className={styles.snippet}>Ảnh sẽ có sớm</span>
      )}
      <span className={styles.label}>{isFinale ? 'Xem lại màn thổi nến' : capsule.title}</span>
    </motion.button>
  )
}

export function Album() {
  const store = useGameStore()
  const state = useGameState()
  const slots = getAlbumSlots(content, state)
  const progress = getProgress(content, state)
  const [viewing, setViewing] = useState<CapsuleData | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  // Album mở giữa chừng từ màn chơi thì chỉ có nút quay lại; xem lại và chơi lại chỉ có sau finale
  const finished = state.finaleDone

  const openSlot = (capsule: CapsuleData) => {
    if (capsule.card.kind === 'finale') {
      if (finished) store.dispatch({ type: 'REPLAY_FINALE' })
      return
    }
    setViewing(capsule)
  }

  return (
    <Stage>
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.mascot}>
            <Mascot state={finished ? 'celebrate' : 'happy'} />
          </div>
          <div className={styles.heading}>
            <h1 className={styles.title}>Album kỷ niệm</h1>
            <p className={styles.count}>
              Đã sưu tập {progress.opened}/{progress.total}
            </p>
          </div>
        </header>

        <div className={styles.grid}>
          {slots.map((slot, i) => (
            <Cell key={slot.capsule.id} slot={slot} index={i} onOpen={openSlot} />
          ))}
        </div>

        <div className={styles.actions}>
          {finished ? (
            <>
              <Button onClick={() => store.dispatch({ type: 'REPLAY_FINALE' })}>
                Xem lại màn thổi nến
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingReset(true)}>
                Chơi lại từ đầu
              </Button>
            </>
          ) : (
            <Button onClick={() => store.dispatch({ type: 'CLOSE_ALBUM' })}>Quay lại chơi</Button>
          )}
        </div>

        <AnimatePresence>
          {viewing ? (
            <MemoryCard
              key={viewing.id}
              capsule={viewing}
              closeLabel="Đóng"
              celebrate={false}
              onClose={() => setViewing(null)}
            />
          ) : null}
        </AnimatePresence>

        <ConfirmDialog
          open={confirmingReset}
          title="Chơi lại từ đầu?"
          body="Các thẻ đã mở sẽ xếp lại từ đầu để em bé quay lại nhé. Ảnh và lời trong thẻ không bị mất."
          confirmLabel="Chơi lại"
          cancelLabel="Giữ nguyên"
          onCancel={() => setConfirmingReset(false)}
          onConfirm={() => {
            setConfirmingReset(false)
            store.dispatch({ type: 'RESET' })
          }}
        />
      </div>
    </Stage>
  )
}
