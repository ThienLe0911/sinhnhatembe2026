import { useId } from 'react'
import styles from './Mascot.module.css'

export type MascotState = 'idle' | 'happy' | 'surprised' | 'sleepy' | 'celebrate'

interface MascotProps {
  state?: MascotState
  // Bật khi có capsule hạng Bạc: vòng bạc ở cổ tay lấp lánh
  sparkle?: boolean
  label?: string
  className?: string
}

const SKIN = '#f3c9a8'
const SKIN_SHADE = '#e6ae88'
const INK = '#2b1d1a'
const TEE = '#2d2833'
const SKIRT = '#7a5f49'
const SKIRT_FOLD = '#695039'
const LIP = '#b5534a'
const FRAME = '#b8935a'

const eyeArc = {
  sleepy: ['M 76 124 Q 90 131 104 124', 'M 136 124 Q 150 131 164 124'],
  happy: ['M 76 127 Q 90 111 104 127', 'M 136 127 Q 150 111 164 127'],
} as const

export function Mascot({
  state = 'idle',
  sparkle = false,
  label = 'Em bé phiên bản chibi',
  className,
}: MascotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const hairId = `${uid}-hair`
  const closedEyes =
    state === 'sleepy'
      ? eyeArc.sleepy
      : state === 'happy' || state === 'celebrate'
        ? eyeArc.happy
        : null
  const wide = state === 'surprised'
  const browLift = wide ? -6 : 0
  const armsUp = state === 'celebrate'
  const cheekOpacity = state === 'happy' || state === 'celebrate' ? 0.7 : 0.45

  return (
    <svg
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-state={state}
      viewBox="0 0 240 300"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={hairId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2024" />
          <stop offset="0.55" stopColor="#35242b" />
          <stop offset="1" stopColor="#7d3f31" />
        </linearGradient>
      </defs>

      <g className={styles.body}>
        {/* Tóc phía sau: dài, gợn sóng, ngả nâu đỏ ở ngọn */}
        <path
          fill={`url(#${hairId})`}
          d="M 120 28 C 68 28 34 66 34 118 C 34 160 22 190 28 226 C 32 248 52 254 62 240 C 72 226 64 206 74 190 L 166 190 C 176 206 168 226 178 240 C 188 254 208 248 212 226 C 218 190 206 160 206 118 C 206 66 172 28 120 28 Z"
        />

        {/* Thân: áo thun đen, váy nâu */}
        <path
          fill={SKIRT}
          d="M 48 238 C 62 258 178 258 192 238 L 208 286 C 162 300 78 300 32 286 Z"
        />
        <path
          stroke={SKIRT_FOLD}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          d="M 90 252 L 80 290 M 120 256 L 120 294 M 150 252 L 160 290"
        />
        <ellipse cx="88" cy="292" rx="18" ry="7" fill="#e8d9c2" />
        <ellipse cx="152" cy="292" rx="18" ry="7" fill="#e8d9c2" />
        <path
          fill={TEE}
          d="M 66 198 C 80 186 102 184 120 190 C 138 184 160 186 174 198 L 188 244 C 160 256 80 256 52 244 Z"
        />
        <path fill={SKIN} d="M 102 186 Q 120 206 138 186 Z" />
        <rect x="106" y="170" width="28" height="24" rx="10" fill={SKIN_SHADE} />

        {armsUp ? (
          <g>
            <path
              stroke={SKIN}
              strokeWidth="17"
              strokeLinecap="round"
              fill="none"
              d="M 62 214 L 38 128"
            />
            <path
              stroke={SKIN}
              strokeWidth="17"
              strokeLinecap="round"
              fill="none"
              d="M 178 214 L 202 128"
            />
            <circle cx="36" cy="120" r="12" fill={SKIN} />
            <circle cx="204" cy="120" r="12" fill={SKIN} />
            <path
              stroke={TEE}
              strokeWidth="24"
              strokeLinecap="round"
              fill="none"
              d="M 68 208 L 58 180"
            />
            <path
              stroke={TEE}
              strokeWidth="24"
              strokeLinecap="round"
              fill="none"
              d="M 172 208 L 182 180"
            />
          </g>
        ) : (
          <g>
            {/* Tay trái nghỉ trên đùi, có vòng bạc */}
            <path
              stroke={SKIN}
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
              d="M 60 238 L 96 262"
            />
            <path
              stroke={TEE}
              strokeWidth="24"
              strokeLinecap="round"
              fill="none"
              d="M 66 206 L 58 236"
            />
            <path
              stroke="#c9d1dc"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              d="M 79 240 Q 76 249 69 256"
            />
            {sparkle ? (
              <g>
                <path
                  className={styles.twinkle}
                  fill="#ffffff"
                  stroke="#c9d1dc"
                  strokeWidth="1"
                  d="M 82 244 L 85 251 L 92 254 L 85 257 L 82 264 L 79 257 L 72 254 L 79 251 Z"
                />
                <path
                  className={styles.twinkleLate}
                  fill="#ffffff"
                  stroke="#c9d1dc"
                  strokeWidth="1"
                  d="M 100 238 L 102 243 L 107 245 L 102 247 L 100 252 L 98 247 L 93 245 L 98 243 Z"
                />
              </g>
            ) : null}
            {/* Tay phải chống cằm */}
            <path
              stroke={TEE}
              strokeWidth="26"
              strokeLinecap="round"
              fill="none"
              d="M 172 206 L 184 238"
            />
            <path
              stroke={SKIN}
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
              d="M 182 242 L 152 190"
            />
          </g>
        )}
      </g>

      <g className={styles.head}>
        {/* Mặt */}
        <path
          fill={SKIN}
          d="M 46 114 C 46 66 82 44 120 44 C 158 44 194 66 194 114 C 194 152 162 182 120 182 C 78 182 46 152 46 114 Z"
        />

        {/* Tóc mái rẽ lệch, để lộ trán */}
        <path
          fill={`url(#${hairId})`}
          d="M 112 40 C 90 54 62 78 52 126 C 62 100 80 84 98 76 C 108 70 112 56 112 40 Z"
        />
        <path
          fill={`url(#${hairId})`}
          d="M 112 40 C 142 48 180 74 190 126 C 178 102 152 86 130 78 C 118 72 112 56 112 40 Z"
        />

        {/* Má hồng */}
        <ellipse cx="68" cy="148" rx="13" ry="7" fill="#f2a193" opacity={cheekOpacity} />
        <ellipse cx="172" cy="148" rx="13" ry="7" fill="#f2a193" opacity={cheekOpacity} />

        {/* Mắt */}
        <g className={styles.eyes}>
          {closedEyes ? (
            <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
              <path d={closedEyes[0]} />
              <path d={closedEyes[1]} />
            </g>
          ) : (
            <g>
              <ellipse cx="90" cy="122" rx={wide ? 9.5 : 7.5} ry={wide ? 12 : 9.5} fill={INK} />
              <ellipse cx="150" cy="122" rx={wide ? 9.5 : 7.5} ry={wide ? 12 : 9.5} fill={INK} />
              <circle cx="93" cy="117" r="3" fill="#ffffff" />
              <circle cx="153" cy="117" r="3" fill="#ffffff" />
              <circle cx="87" cy="127" r="1.6" fill="#ffffff" />
              <circle cx="147" cy="127" r="1.6" fill="#ffffff" />
            </g>
          )}
        </g>

        {/* Lông mày */}
        <g
          stroke={INK}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          transform={`translate(0 ${browLift})`}
        >
          <path d="M 76 92 Q 90 86 104 92" />
          <path d="M 136 92 Q 150 86 164 92" />
        </g>

        {/* Kính tròn gọng mảnh */}
        <g fill="#ffffff" fillOpacity="0.18" stroke={FRAME} strokeWidth="3">
          <circle cx="90" cy="122" r="25" />
          <circle cx="150" cy="122" r="25" />
        </g>
        <path
          stroke={FRAME}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          d="M 115 118 Q 120 112 125 118"
        />

        {/* Mũi và miệng */}
        <path
          stroke="#c98e6a"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          d="M 117 143 Q 120 146 123 143"
        />
        {state === 'surprised' ? (
          <ellipse cx="120" cy="160" rx="6" ry="8" fill={LIP} />
        ) : state === 'happy' || state === 'celebrate' ? (
          <path fill={LIP} d="M 105 153 Q 120 180 135 153 Z" />
        ) : state === 'sleepy' ? (
          <path
            stroke={LIP}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            d="M 113 160 Q 120 163 127 160"
          />
        ) : (
          <path
            stroke={LIP}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            d="M 107 155 Q 120 166 133 155"
          />
        )}

        {/* Nắm tay đỡ cằm */}
        {armsUp ? null : (
          <g>
            <circle cx="146" cy="182" r="15" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="2" />
            <path
              stroke={SKIN_SHADE}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              d="M 138 176 L 138 186 M 146 174 L 146 188 M 154 176 L 154 186"
            />
          </g>
        )}

        {state === 'sleepy' ? (
          <g fill={FRAME} fontFamily="ui-rounded, system-ui, sans-serif" fontWeight="800">
            <text className={styles.zzz} x="176" y="60" fontSize="22">
              z
            </text>
            <text className={styles.zzzLate} x="192" y="40" fontSize="28">
              Z
            </text>
          </g>
        ) : null}
      </g>
    </svg>
  )
}
