import type { Transition } from 'motion/react'

// Ngôn ngữ chuyển động chung: mọi màn dùng các lò xo này để cảm giác nhất quán.
export const springs = {
  soft: { type: 'spring', stiffness: 170, damping: 24 },
  snappy: { type: 'spring', stiffness: 420, damping: 32 },
  bouncy: { type: 'spring', stiffness: 260, damping: 14 },
} satisfies Record<string, Transition>
