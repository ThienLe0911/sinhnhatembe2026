import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import type { Tier } from '../content/types'
import styles from './Capsule.module.css'
import { springs } from './motion'

interface CapsuleProps {
  tier: Tier
  // Bật nắp: nửa trên bật lên và nghiêng ra
  open?: boolean
  // Chiều rộng bất kỳ của CSS, ví dụ '4rem'
  size?: string
  className?: string
}

export function Capsule({ tier, open = false, size = '4rem', className }: CapsuleProps) {
  return (
    <div
      className={[styles.capsule, styles[tier], className].filter(Boolean).join(' ')}
      style={{ '--capsule-size': size } as CSSProperties}
      data-open={open}
    >
      <div className={styles.bottom} />
      <motion.div
        className={styles.top}
        animate={open ? { y: '-62%', x: '-14%', rotate: -26 } : { y: 0, x: 0, rotate: 0 }}
        transition={springs.bouncy}
      />
    </div>
  )
}
