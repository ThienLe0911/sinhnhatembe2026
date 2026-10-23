import { motion } from 'motion/react'
import { useMemo } from 'react'
import type { Tier } from '../content/types'
import styles from './Burst.module.css'

const COUNT = 14

// Tia sáng và hạt lấp lánh bung ra từ giữa màn hình khi capsule bật nắp
export function Burst({ tier }: { tier: Tier }) {
  const particles = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = (i / COUNT) * Math.PI * 2 + (i % 2) * 0.22
        const distance = 120 + (i % 3) * 46
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 7 + (i % 4) * 3,
          delay: (i % 5) * 0.025,
        }
      }),
    [],
  )

  return (
    <div className={`${styles.burst} ${styles[tier]}`} aria-hidden="true">
      <motion.div
        className={styles.glow}
        initial={{ scale: 0.2, opacity: 0.95 }}
        animate={{ scale: 3.4, opacity: 0 }}
        transition={{ duration: 0.95, ease: 'easeOut' }}
      />
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className={styles.spark}
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: [0, 1.2, 0.5], opacity: [1, 1, 0] }}
          transition={{ duration: 0.95, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
