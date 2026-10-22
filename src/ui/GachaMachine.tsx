import { useId, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import styles from './GachaMachine.module.css'

// Bản vẽ dùng hệ toạ độ 360 x 720; các lớp tương tác (núm, khe xu, khay, linh vật) là phần tử HTML
// đặt chồng theo cùng toạ độ này để màn hình sau gắn cử chỉ và tham chiếu trực tiếp.
const W = 360
const H = 720

const pctX = (x: number) => `${(x / W) * 100}%`
const pctY = (y: number) => `${(y / H) * 100}%`

const MASCOT_WIDTH = 188
const KNOB = { cx: 132, cy: 572, size: 68 }
const COIN = { cx: 236, cy: 572, w: 64, h: 70 }
const TRAY = { x: 100, y: 620, w: 160, h: 72 }

type Variant = 'n1' | 'n2' | 'n3' | 'n4' | 'silver' | 'gold'

// Các viên capsule nằm trong quả cầu: [x, y, bán kính, góc xoay, màu]
const balls: Array<[number, number, number, number, Variant]> = [
  [116, 458, 24, 10, 'n1'],
  [164, 462, 24, -20, 'n2'],
  [212, 458, 24, 30, 'n3'],
  [252, 452, 23, -8, 'n4'],
  [86, 414, 24, 24, 'n2'],
  [134, 412, 24, -12, 'silver'],
  [182, 414, 25, 6, 'n1'],
  [230, 410, 24, -30, 'n3'],
  [276, 416, 23, 14, 'n4'],
  [74, 366, 24, -4, 'n1'],
  [124, 364, 24, 26, 'n3'],
  [174, 368, 24, -16, 'n2'],
  [224, 362, 24, 8, 'silver'],
  [272, 366, 24, -26, 'n1'],
  [100, 320, 23, 18, 'n4'],
  [152, 322, 24, -6, 'n2'],
  [206, 318, 24, 20, 'gold'],
  [258, 322, 23, -14, 'n3'],
  [130, 276, 23, 12, 'n3'],
  [182, 274, 24, -22, 'n4'],
  [232, 278, 23, 4, 'silver'],
]

interface GachaMachineProps {
  // Linh vật ngồi trên đỉnh máy
  mascot?: ReactNode
  // Nội dung nằm trong cửa nhận quà, thường là <Capsule />
  tray?: ReactNode
  // Góc xoay của núm, tính bằng độ; điều khiển được từ bên ngoài
  knobAngle?: number
  // Các viên trong quả cầu lắc lư
  spinning?: boolean
  // Khe xu sáng lên để gợi ý chỗ thả xu
  coinSlotGlow?: boolean
  plaque?: string
  knobProps?: HTMLAttributes<HTMLDivElement>
  knobRef?: Ref<HTMLDivElement>
  coinSlotRef?: Ref<HTMLDivElement>
  trayRef?: Ref<HTMLDivElement>
  className?: string
}

function ballVariant(id: string, top: string, bottom: string) {
  return (
    <g id={id}>
      <circle r="24" fill={bottom} />
      <path d="M -24 0 A 24 24 0 0 1 24 0 Z" fill={top} />
      <path d="M -24 0 H 24" stroke="rgb(59 51 64 / 0.22)" strokeWidth="2.5" />
      <circle r="23.5" fill="none" stroke="rgb(59 51 64 / 0.14)" />
      <ellipse
        cx="-9"
        cy="-12"
        rx="7"
        ry="4"
        fill="#ffffff"
        opacity="0.65"
        transform="rotate(-30 -9 -12)"
      />
    </g>
  )
}

export function GachaMachine({
  mascot,
  tray,
  knobAngle = 0,
  spinning = false,
  coinSlotGlow = false,
  plaque = 'EM BÉ GACHA',
  knobProps,
  knobRef,
  coinSlotRef,
  trayRef,
  className,
}: GachaMachineProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (name: string) => `${uid}-${name}`
  const ref = (name: string) => `url(#${id(name)})`
  const { style: knobStyle, className: knobClass, ...knobRest } = knobProps ?? {}

  return (
    <div
      className={[styles.machine, spinning ? styles.spinning : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <svg className={styles.art} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe6dd" />
            <stop offset="1" stopColor="#ffcfc2" />
          </linearGradient>
          <linearGradient id={id('ring')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6f8fb" />
            <stop offset="0.5" stopColor="#c9d1dc" />
            <stop offset="1" stopColor="#9aa6b8" />
          </linearGradient>
          <linearGradient id={id('panel')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff8f3" />
            <stop offset="1" stopColor="#ffeadf" />
          </linearGradient>
          <radialGradient id={id('dome')} cx="0.35" cy="0.3" r="0.9">
            <stop offset="0" stopColor="#f8f4ff" />
            <stop offset="1" stopColor="#e2d8f6" />
          </radialGradient>
          <linearGradient id={id('glass')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id={id('silver-top')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f1f4f8" />
            <stop offset="1" stopColor="#98a4b5" />
          </linearGradient>
          <linearGradient id={id('gold-top')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbe7a8" />
            <stop offset="1" stopColor="#b98a1d" />
          </linearGradient>
          <clipPath id={id('clip')}>
            <circle cx="180" cy="362" r="126" />
          </clipPath>
          {ballVariant(id('v-n1'), '#f2a193', '#e4ddfb')}
          {ballVariant(id('v-n2'), '#8fba7a', '#fbeab4')}
          {ballVariant(id('v-n3'), '#b4a5ee', '#ffd9cf')}
          {ballVariant(id('v-n4'), '#ffd9cf', '#d3e7c3')}
          {ballVariant(id('v-silver'), ref('silver-top'), '#c9d1dc')}
          {ballVariant(id('v-gold'), ref('gold-top'), '#e9bb52')}
        </defs>

        <ellipse cx="180" cy="710" rx="124" ry="8" fill="rgb(59 51 64 / 0.12)" />

        {/* Thân máy */}
        <rect x="56" y="514" width="248" height="186" rx="34" fill={ref('body')} />
        <rect
          x="58"
          y="516"
          width="244"
          height="182"
          rx="32"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="2"
        />
        <path
          d="M 56 668 H 304 V 666 A 34 34 0 0 1 270 700 H 90 A 34 34 0 0 1 56 666 Z"
          fill="#f2a193"
          opacity="0.28"
        />

        {/* Quả cầu */}
        <circle cx="180" cy="362" r="128" fill={ref('dome')} />
        <g clipPath={ref('clip')}>
          {balls.map(([x, y, r, rot, variant], i) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
              <g className={styles.ball} style={{ '--i': i } as CSSProperties}>
                <use
                  href={`#${id(`v-${variant}`)}`}
                  transform={`rotate(${rot}) scale(${r / 24})`}
                />
              </g>
            </g>
          ))}
        </g>
        <circle cx="180" cy="362" r="128" fill={ref('glass')} />
        <circle
          cx="180"
          cy="362"
          r="127"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.9"
          strokeWidth="3"
        />
        <ellipse
          cx="116"
          cy="304"
          rx="12"
          ry="54"
          fill="#ffffff"
          opacity="0.6"
          transform="rotate(34 116 304)"
        />
        <ellipse cx="150" cy="262" rx="9" ry="4" fill="#ffffff" opacity="0.7" />

        {/* Nắp trên đỉnh để linh vật ngồi */}
        <ellipse cx="180" cy="236" rx="62" ry="11" fill={ref('ring')} />
        <ellipse cx="180" cy="233" rx="56" ry="8" fill="#f6f8fb" opacity="0.8" />

        {/* Vành đế dưới quả cầu */}
        <rect x="44" y="484" width="272" height="38" rx="17" fill={ref('ring')} />
        <rect
          x="46"
          y="486"
          width="268"
          height="34"
          rx="15"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.7"
        />
        <text
          x="180"
          y="509"
          textAnchor="middle"
          fontSize="14"
          fontWeight="800"
          letterSpacing="2.5"
          fill="#3b3340"
          fillOpacity="0.72"
          fontFamily="ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"
        >
          {plaque}
        </text>

        {/* Bảng điều khiển */}
        <rect x="74" y="534" width="212" height="80" rx="26" fill={ref('panel')} />
        <rect
          x="76"
          y="536"
          width="208"
          height="76"
          rx="24"
          fill="none"
          stroke="#f2a193"
          strokeOpacity="0.35"
          strokeWidth="2"
        />
        <circle cx={KNOB.cx} cy={KNOB.cy} r="42" fill="rgb(59 51 64 / 0.08)" />
        <path
          d="M 94 548 A 46 46 0 0 1 170 548"
          fill="none"
          stroke="#3b3340"
          strokeOpacity="0.32"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M 172 552 L 163 549 L 171 541 Z" fill="#3b3340" fillOpacity="0.32" />

        {/* Khe xu */}
        <rect
          x={COIN.cx - COIN.w / 2}
          y={COIN.cy - COIN.h / 2}
          width={COIN.w}
          height={COIN.h}
          rx="18"
          fill="#f6d9cd"
        />
        <rect
          x={COIN.cx - COIN.w / 2 + 2}
          y={COIN.cy - COIN.h / 2 + 2}
          width={COIN.w - 4}
          height={COIN.h - 4}
          rx="16"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.8"
          strokeWidth="2"
        />
        <rect x={COIN.cx - 4} y={COIN.cy - 24} width="8" height="34" rx="4" fill="#3b3340" />
        <text
          x={COIN.cx}
          y={COIN.cy + 28}
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          letterSpacing="1.5"
          fill="#3b3340"
          fillOpacity="0.6"
          fontFamily="ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"
        >
          XU
        </text>

        {/* Cửa nhận quà */}
        <rect x={TRAY.x} y={TRAY.y} width={TRAY.w} height={TRAY.h} rx="28" fill="#4a3b46" />
        <rect x={TRAY.x} y={TRAY.y} width={TRAY.w} height="26" rx="16" fill="rgb(0 0 0 / 0.28)" />
        <rect
          x={TRAY.x - 2}
          y={TRAY.y - 2}
          width={TRAY.w + 4}
          height={TRAY.h + 4}
          rx="30"
          fill="none"
          stroke="#fff3ec"
          strokeWidth="5"
        />
      </svg>

      {/* Lớp tương tác */}
      <div
        className={styles.mascot}
        style={{ width: pctX(MASCOT_WIDTH), left: pctX((W - MASCOT_WIDTH) / 2) }}
      >
        {mascot}
      </div>

      <div
        ref={coinSlotRef}
        className={[styles.coinSlot, coinSlotGlow ? styles.glow : ''].filter(Boolean).join(' ')}
        style={{
          left: pctX(COIN.cx - COIN.w / 2),
          top: pctY(COIN.cy - COIN.h / 2),
          width: pctX(COIN.w),
          height: pctY(COIN.h),
        }}
      />

      <div
        ref={knobRef}
        {...knobRest}
        className={[styles.knob, knobClass].filter(Boolean).join(' ')}
        style={{
          left: pctX(KNOB.cx - KNOB.size / 2),
          top: pctY(KNOB.cy - KNOB.size / 2),
          width: pctX(KNOB.size),
          transform: `rotate(${knobAngle}deg)`,
          ...knobStyle,
        }}
      >
        <span className={styles.knobBar} />
      </div>

      <div
        ref={trayRef}
        className={styles.tray}
        style={{
          left: pctX(TRAY.x),
          top: pctY(TRAY.y),
          width: pctX(TRAY.w),
          height: pctY(TRAY.h),
        }}
      >
        {tray}
      </div>
    </div>
  )
}
