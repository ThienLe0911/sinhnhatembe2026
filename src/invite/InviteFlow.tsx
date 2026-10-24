import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { useEffect, useReducer, useRef, type ReactNode } from 'react'
import { inviteContent, type InviteContent } from './content'
import { flowReducer, initialFlowFor, type FlowState } from './flow'
import { IntroPage } from './IntroPage'
import { InvitePage } from './InvitePage'
import { RevealPage } from './RevealPage'

// Mỗi bước vào/ra bằng mờ dần và trượt nhẹ; MotionProvider bỏ phần trượt khi bật giảm chuyển động.
// Từ bước thứ hai, focus về tiêu đề của bước mới để bàn phím và trình đọc màn hình biết đã đổi trang (FR-I19).
function StepFrame({ children, moveFocus }: { children: ReactNode; moveFocus: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  // Trang đang mờ đi để nhường chỗ không nhận thêm cú chạm (chạm đúp không nhảy qua hai bước)
  const present = useIsPresent()

  useEffect(() => {
    if (!moveFocus) return
    window.scrollTo(0, 0)
    const heading = ref.current?.querySelector('h1')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus({ preventScroll: true })
  }, [moveFocus])

  return (
    <motion.div
      ref={ref}
      style={present ? undefined : { pointerEvents: 'none' }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

interface InviteFlowProps {
  content?: InviteContent
  /** Chỉ dùng cho test: bắt đầu ở bước khác Trang 1. */
  initial?: FlowState
}

export function InviteFlow({ content = inviteContent, initial }: InviteFlowProps) {
  const [state, dispatch] = useReducer(
    flowReducer,
    initial ?? initialFlowFor(window.location.search, import.meta.env.DEV),
  )
  const moveFocus = state.step !== 'intro'

  return (
    <AnimatePresence mode="wait" initial={false}>
      <StepFrame key={state.step} moveFocus={moveFocus}>
        {state.step === 'intro' ? (
          <IntroPage
            intro={content.intro}
            onNext={() => dispatch('next')}
            onSkip={() => dispatch('skip')}
          />
        ) : state.step === 'reveal' ? (
          <RevealPage
            reveal={content.reveal}
            opened={state.opened}
            onTap={() => dispatch('tap')}
            onSkip={() => dispatch('skip')}
          />
        ) : (
          <InvitePage content={content} />
        )}
      </StepFrame>
    </AnimatePresence>
  )
}
