import type { ReactNode } from 'react'
import styles from './Stage.module.css'

export function Stage({ children }: { children: ReactNode }) {
  return (
    <div className={styles.stage}>
      <main className={styles.frame}>{children}</main>
    </div>
  )
}
