import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { syncReducedMotionAttribute } from '../lib/reduced-motion'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { MotionProvider } from '../ui/MotionProvider'
import '../ui/tokens.css'
import '../ui/base.css'
import { InviteFlow } from './InviteFlow'

syncReducedMotionAttribute()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <ErrorBoundary
        title="Trang mời chưa mở được"
        body="Bạn tải lại trang giúp mình nhé. Nếu vẫn lỗi, hãy mở link trong Safari hoặc Chrome."
      >
        <InviteFlow />
      </ErrorBoundary>
    </MotionProvider>
  </StrictMode>,
)
