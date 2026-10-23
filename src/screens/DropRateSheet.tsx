import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId } from 'react'
import { content } from '../content/content'
import { springs } from '../ui/motion'
import styles from './DropRateSheet.module.css'

const NOTE = 'Tỉ lệ chỉ để cười thôi. Capsule nào rơi ra cũng là của em bé.'

export function DropRateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={styles.sheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springs.soft}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className={styles.title}>
              Tỉ lệ rơi
            </h2>
            <ul className={styles.list}>
              {content.dropRates.map((rate) => (
                <li key={rate.label} className={styles.row}>
                  <span className={styles.label}>{rate.label}</span>
                  <span className={styles.track} aria-hidden="true">
                    <motion.span
                      className={styles.bar}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: rate.percent / 100 }}
                      transition={{ ...springs.soft, delay: 0.1 }}
                    />
                  </span>
                  <span className={styles.percent}>{rate.percent}%</span>
                </li>
              ))}
            </ul>
            <p className={styles.note}>{NOTE}</p>
            <button type="button" className={styles.close} onClick={onClose} autoFocus>
              Đóng
            </button>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
