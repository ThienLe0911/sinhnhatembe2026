import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import buttonStyles from '../ui/Button.module.css'
import { springs } from '../ui/motion'

interface LinkButtonProps extends Omit<HTMLMotionProps<'a'>, 'children' | 'href'> {
  href: string
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

// Liên kết trông như nút. Liên kết web mở ở thẻ mới; tel: và sms: để hệ thống tự xử lý.
export function LinkButton({
  href,
  variant = 'primary',
  children,
  className,
  ...rest
}: LinkButtonProps) {
  const external = href.startsWith('https://')
  return (
    <motion.a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={[buttonStyles.button, buttonStyles[variant], className].filter(Boolean).join(' ')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
      }}
      whileTap={{ scale: 0.96 }}
      transition={springs.snappy}
      {...rest}
    >
      {children}
    </motion.a>
  )
}
