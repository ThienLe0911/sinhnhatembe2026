import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import styles from './Button.module.css'
import { springs } from './motion'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  return (
    <motion.button
      type="button"
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
      whileTap={{ scale: 0.96 }}
      transition={springs.snappy}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
