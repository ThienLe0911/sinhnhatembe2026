import type { ReactNode } from 'react'
import styles from './SkipLink.module.css'

// Liên kết chữ nhỏ để bỏ qua các trang dẫn (FR-I18); là nút thật để dùng được bằng bàn phím
export function SkipLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={styles.skip} onClick={onClick}>
      {children}
    </button>
  )
}
