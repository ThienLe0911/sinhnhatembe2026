import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { content } from '../content/content'
import { MemoryCard } from '../screens/MemoryCard'
import { Button } from '../ui/Button'
import { Stage } from '../ui/Stage'
import styles from './MachineSheet.module.css'

// Xem từng thẻ kỷ niệm trong nội dung hiện có (không đụng tới tiến trình chơi)
export default function CardSheet() {
  const [openId, setOpenId] = useState<string | null>(null)
  const capsule = content.capsules.find((c) => c.id === openId)
  return (
    <Stage>
      <div className={styles.sheet}>
        <h1>Thẻ kỷ niệm</h1>
        <div className={styles.group}>
          {content.capsules
            .filter((c) => c.card.kind !== 'finale')
            .map((c) => (
              <Button key={c.id} variant="secondary" onClick={() => setOpenId(c.id)}>
                {c.title}
              </Button>
            ))}
        </div>
        <AnimatePresence>
          {capsule ? (
            <MemoryCard key={capsule.id} capsule={capsule} onClose={() => setOpenId(null)} />
          ) : null}
        </AnimatePresence>
      </div>
    </Stage>
  )
}
