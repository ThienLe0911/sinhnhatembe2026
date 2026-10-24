import { Component, type ErrorInfo, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Lời trên màn dự phòng; bỏ trống là lời của site quà. */
  title?: string
  body?: string
}

interface ErrorBoundaryState {
  failed: boolean
}

// Lỗi bất ngờ ở một màn không được để cả trang trắng: hiện lời nhắn dễ thương và nút tải lại.
// Tiến trình chơi đã lưu ở các điểm ổn định nên tải lại không mất gì.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Một màn hình gặp lỗi', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    // Cố tình không dùng linh vật hay thành phần chung: màn dự phòng phải tự đứng được
    return (
      <main className={styles.screen} role="alert">
        <h1 className={styles.title}>{this.props.title ?? 'Có chút trục trặc nhỏ'}</h1>
        <p className={styles.body}>
          {this.props.body ?? 'Em bé bấm tải lại giúp anh nhé. Những thẻ đã mở vẫn còn nguyên.'}
        </p>
        <button type="button" className={styles.button} onClick={() => window.location.reload()}>
          Tải lại
        </button>
      </main>
    )
  }
}
