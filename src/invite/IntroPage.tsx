import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { Button } from '../ui/Button'
import { Mascot } from '../ui/Mascot'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import type { InviteIntro } from './content'
import { enter } from './enter'
import styles from './IntroPage.module.css'
import { SkipLink } from './SkipLink'

const TONES = ['peach', 'lavender', 'matcha', 'butter', 'lavender', 'peach'] as const

interface IntroPageProps {
  intro: InviteIntro
  onNext: () => void
  onSkip: () => void
}

// Trang 1: linh vật ở giữa, các bong bóng giới thiệu chia hai bên (FR-I15)
export function IntroPage({ intro, onNext, onSkip }: IntroPageProps) {
  const half = Math.ceil(intro.bubbles.length / 2)

  const bubbles = (side: 'left' | 'right', from: number, items: string[]) => (
    <ul className={styles.column} data-side={side}>
      {items.map((text, i) => {
        const index = from + i
        return (
          <motion.li
            key={text}
            className={styles.bubble}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.bouncy, delay: 0.35 + index * 0.14 }}
          >
            <span
              className={styles.card}
              data-tone={TONES[index % TONES.length]}
              style={{ '--float-delay': `${-index * 0.8}s` } as CSSProperties}
            >
              {text}
            </span>
          </motion.li>
        )
      })}
    </ul>
  )

  return (
    <Stage>
      <div className={styles.page}>
        <motion.h1 className={styles.heading} {...enter(0)}>
          {intro.heading}
        </motion.h1>

        <div className={styles.cluster}>
          <motion.div className={styles.mascot} {...enter(1)}>
            <Mascot state="happy" label="Em bé Minh Thư" />
          </motion.div>
          {bubbles('left', 0, intro.bubbles.slice(0, half))}
          {bubbles('right', half, intro.bubbles.slice(half))}
        </div>

        <motion.div className={styles.actions} {...enter(8)}>
          <Button onClick={onNext}>{intro.next}</Button>
          <SkipLink onClick={onSkip}>{intro.skip}</SkipLink>
        </motion.div>
      </div>
    </Stage>
  )
}
