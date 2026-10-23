import { AnimatePresence, motion, useTransform, type MotionValue } from 'motion/react'
import { useId } from 'react'
import styles from './Cake.module.css'
import { springs } from './motion'

const FONT = "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"
const FLAG_COLORS = ['#f2a193', '#b4a5ee', '#8fba7a', '#fbeab4', '#e9bb52']

// Cờ treo dọc theo một đường cong phía trên bánh
const FLAGS = Array.from({ length: 7 }, (_, i) => {
  const t = (i + 0.5) / 7
  const x = (1 - t) ** 2 * 20 + 2 * (1 - t) * t * 160 + t ** 2 * 300
  const y = (1 - t) ** 2 * 24 + 2 * (1 - t) * t * 72 + t ** 2 * 24
  return { x, y, color: FLAG_COLORS[i % FLAG_COLORS.length] }
})

// Kem và dâu trang trí trên mặt bánh
const DOLLOPS = [86, 112, 138, 164, 190, 216, 242].map((x, i) => ({ x, berry: i % 2 === 0 }))

function candleXs(count: number): number[] {
  const gap = 66
  const start = 160 - ((count - 1) * gap) / 2
  return Array.from({ length: count }, (_, i) => start + i * gap)
}

function Flame({ x, level }: { x: number; level: MotionValue<number> }) {
  // Thổi càng mạnh ngọn lửa càng nghiêng và co lại
  const scaleY = useTransform(level, [0, 1], [1, 0.55])
  const skewX = useTransform(level, [0, 1], [0, -30])
  return (
    <motion.g
      style={{ x, y: 56, originX: 0.5, originY: 1, scaleY, skewX }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.25 } }}
    >
      <g className={styles.flicker}>
        <circle cx="0" cy="-16" r="22" fill="#fbeab4" opacity="0.35" />
        <path d="M 0 0 C 10 -8 12 -22 0 -40 C -12 -22 -10 -8 0 0 Z" fill="#f6a85a" />
        <path d="M 0 -2 C 5 -8 6 -16 0 -26 C -6 -16 -5 -8 0 -2 Z" fill="#fff3b0" />
      </g>
    </motion.g>
  )
}

function Smoke({ x }: { x: number }) {
  return (
    <motion.path
      d={`M ${x} 52 C ${x + 7} 40 ${x - 7} 30 ${x} 16`}
      fill="none"
      stroke="#9a8fa0"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.7, 0], y: -18 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    />
  )
}

interface CakeProps {
  digits: number[]
  /** Mức thổi 0 đến 1, điều khiển độ nghiêng của ngọn lửa. */
  level: MotionValue<number>
  lit: boolean
  /** Khi nến đã tắt: bánh hiện đủ cờ, kem và dâu. */
  decorated: boolean
  className?: string
}

export function Cake({ digits, level, lit, decorated, className }: CakeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (name: string) => `${uid}-${name}`
  const ref = (name: string) => `url(#${id(name)})`
  const xs = candleXs(digits.length)

  return (
    <svg
      className={[styles.cake, className].filter(Boolean).join(' ')}
      viewBox="0 0 320 300"
      role="img"
      aria-label={`Bánh matcha cắm ${digits.length} cây nến số ${digits.join(' ')}`}
    >
      <defs>
        <linearGradient id={id('plate')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f8fb" />
          <stop offset="1" stopColor="#b6c0cf" />
        </linearGradient>
        <linearGradient id={id('base')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9cc487" />
          <stop offset="1" stopColor="#7aa866" />
        </linearGradient>
        <linearGradient id={id('top')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6d9a2" />
          <stop offset="1" stopColor="#97c283" />
        </linearGradient>
        <linearGradient id={id('candle')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2a193" />
          <stop offset="1" stopColor="#b4a5ee" />
        </linearGradient>
      </defs>

      {/* Đĩa */}
      <ellipse cx="160" cy="268" rx="136" ry="24" fill={ref('plate')} />
      <ellipse cx="160" cy="265" rx="118" ry="16" fill="#fbfcfe" />

      {/* Thân bánh hai tầng, vị matcha */}
      <rect x="44" y="176" width="232" height="88" rx="22" fill={ref('base')} />
      <rect x="70" y="118" width="180" height="70" rx="18" fill={ref('top')} />
      <path
        fill="#fffdf8"
        d="M 44 178 H 276 V 194 a 14.5 12 0 0 1 -29 0 a 14.5 12 0 0 1 -29 0 a 14.5 12 0 0 1 -29 0 a 14.5 12 0 0 1 -29 0 a 14.5 12 0 0 1 -29 0 a 14.5 12 0 0 1 -29 0 a 14.5 12 0 0 1 -29 0 a 14.5 12 0 0 1 -29 0 Z"
      />
      <rect x="66" y="108" width="188" height="26" rx="13" fill="#fffdf8" />
      {[84, 106, 128, 150, 172, 194, 216, 238].map((cx) => (
        <circle key={cx} cx={cx} cy="132" r="9" fill="#fffdf8" />
      ))}

      {/* Trang trí nằm sau nến để nến luôn ở lớp trên */}
      <AnimatePresence>
        {decorated ? (
          <g>
            <motion.path
              d="M 20 24 Q 160 72 300 24"
              fill="none"
              stroke="#3b3340"
              strokeOpacity="0.35"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
            {FLAGS.map((flag, i) => (
              <motion.path
                key={i}
                d="M -11 0 L 11 0 L 0 26 Z"
                fill={flag.color}
                style={{ x: flag.x, y: flag.y, originX: 0.5, originY: 0 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springs.bouncy, delay: 0.25 + i * 0.07 }}
              />
            ))}
            {DOLLOPS.map((dollop, i) => (
              <motion.g
                key={dollop.x}
                style={{ x: dollop.x, y: 104, originX: 0.5, originY: 1 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springs.bouncy, delay: 0.6 + i * 0.06 }}
              >
                <circle cx="0" cy="0" r="9" fill="#fffdf8" stroke="#e8dccb" />
                {dollop.berry ? (
                  <g>
                    <circle cx="0" cy="-9" r="8" fill="#f2a193" />
                    <circle cx="-3" cy="-12" r="2" fill="#fff" opacity="0.7" />
                  </g>
                ) : null}
              </motion.g>
            ))}
            <motion.g
              style={{ x: 160, y: 226, originX: 0.5, originY: 0.5 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springs.bouncy, delay: 1 }}
            >
              <circle r="24" fill="#fffdf8" stroke="#f2a193" strokeWidth="3" />
              <text
                y="7"
                textAnchor="middle"
                fontFamily={FONT}
                fontSize="22"
                fontWeight="900"
                fill="#3b3340"
              >
                {digits.join('')}
              </text>
            </motion.g>
          </g>
        ) : null}
      </AnimatePresence>

      {/* Nến số */}
      {digits.map((digit, i) => (
        <g key={i}>
          <ellipse cx={xs[i]} cy="116" rx="26" ry="6" fill="#fffdf8" />
          <text
            x={xs[i]}
            y="118"
            textAnchor="middle"
            fontFamily={FONT}
            fontSize="92"
            fontWeight="900"
            fill={ref('candle')}
            stroke="#3b3340"
            strokeOpacity="0.4"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {digit}
          </text>
          <rect
            x={xs[i] - 1.5}
            y="46"
            width="3"
            height="10"
            rx="1.5"
            fill="#3b3340"
            opacity="0.7"
          />
        </g>
      ))}

      <AnimatePresence>
        {lit ? xs.map((x, i) => <Flame key={`flame-${i}`} x={x} level={level} />) : null}
      </AnimatePresence>
      {!lit ? xs.map((x, i) => <Smoke key={`smoke-${i}`} x={x} />) : null}
    </svg>
  )
}
