import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId } from 'react'
import { Button } from './Button'
import styles from './ConfirmDialog.module.css'
import { springs } from './motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

// Hộp xác nhận cho thao tác khó hoàn tác. Nút an toàn (huỷ) được focus sẵn, Esc hoặc chạm ra ngoài là huỷ.
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            className={styles.dialog}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={springs.soft}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <p id={bodyId} className={styles.body}>
              {body}
            </p>
            <div className={styles.actions}>
              <Button variant="primary" onClick={onCancel} autoFocus>
                {cancelLabel}
              </Button>
              <Button variant="ghost" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
