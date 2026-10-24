import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotionPref } from '../lib/reduced-motion'
import { Mascot } from '../ui/Mascot'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import type { InviteReveal } from './content'
import { enter } from './enter'
import { SecretBalloon, SecretCake } from './icons'
import styles from './RevealPage.module.css'
import { SkipLink } from './SkipLink'

interface RevealPageProps {
  reveal: InviteReveal
  opened: boolean
  /** Chạm lần 1 thì hé lộ, chạm lần 2 thì sang trang mời (logic ở flow.ts). */
  onTap: () => void
  onSkip: () => void
}

const SPARKS = 10
const SPARK_COLORS = ['#f2a193', '#b4a5ee', '#8fba7a', '#e9bb52']

// Ngôi sao nhỏ bắn ra khi bóng bay "bụp"; bỏ hẳn khi bật giảm chuyển động
function Sparkles() {
  return (
    <span className={styles.sparks} aria-hidden="true">
      {Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * Math.PI * 2
        const distance = 78 + (i % 2) * 26
        return (
          <motion.svg
            key={i}
            className={styles.spark}
            viewBox="0 0 24 24"
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: 1,
              opacity: 0,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <path
              d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"
              fill={SPARK_COLORS[i % SPARK_COLORS.length]}
            />
          </motion.svg>
        )
      })}
    </span>
  )
}

// Trang 2: chạm icon bí mật để hé lộ, chạm lần nữa để xem lời mời (FR-I16)
export function RevealPage({ reveal, opened, onTap, onSkip }: RevealPageProps) {
  const reduced = useReducedMotionPref()

  return (
    <Stage>
      <div className={styles.page}>
        <motion.h1 className={styles.heading} {...enter(0)}>
          {reveal.lead}
        </motion.h1>

        <motion.div className={styles.center} {...enter(1)}>
          <motion.button
            type="button"
            className={styles.secret}
            aria-label={opened ? reveal.nextLabel : reveal.iconLabel}
            onClick={onTap}
            whileTap={{ scale: 0.92 }}
            transition={springs.snappy}
          >
            {opened ? null : <span className={styles.halo} aria-hidden="true" />}
            <span className={styles.icon} data-opened={opened}>
              <AnimatePresence mode="wait" initial={false}>
                {opened ? (
                  <motion.span
                    key="cake"
                    className={styles.swap}
                    initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={springs.bouncy}
                  >
                    <SecretCake />
                  </motion.span>
                ) : (
                  <motion.span
                    key="balloon"
                    className={styles.swap}
                    initial={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                  >
                    <SecretBalloon />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {opened && !reduced ? <Sparkles /> : null}
          </motion.button>
          <p className={styles.hint}>{opened ? reveal.nextHint : reveal.iconHint}</p>
        </motion.div>

        {/* Vùng luôn có sẵn trong trang để trình đọc màn hình đọc lên khi lời hé lộ xuất hiện */}
        <div className={styles.speech} role="status">
          {opened ? (
            <motion.p
              className={styles.bubble}
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ ...springs.bouncy, delay: 0.12 }}
            >
              {reveal.line}
            </motion.p>
          ) : null}
        </div>

        <motion.div
          className={styles.mascot}
          animate={opened ? { y: [0, -14, 0] } : { y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          <Mascot state={opened ? 'celebrate' : 'idle'} label="Em bé Minh Thư" />
        </motion.div>

        <motion.div className={styles.actions} {...enter(4)}>
          <SkipLink onClick={onSkip}>{reveal.skip}</SkipLink>
        </motion.div>
      </div>
    </Stage>
  )
}
