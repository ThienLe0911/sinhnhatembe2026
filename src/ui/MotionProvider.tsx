import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'
import { useReducedMotionPref } from '../lib/reduced-motion'

// Một nguồn duy nhất cho "giảm chuyển động": bật thì Motion bỏ hoạt hình transform, chỉ còn mờ dần
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotionPref()
  return <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
}
