import type { InviteIcon } from './content'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function InfoIcon({ name }: { name: 'calendar' | 'clock' | 'pin' }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...stroke}>
      {name === 'calendar' ? (
        <>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </>
      ) : name === 'clock' ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      ) : (
        <>
          <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      )}
    </svg>
  )
}

// Ba hình minh hoạ nhỏ cho lịch trình, vẽ tay bằng SVG cùng bảng màu của site
function Art({ name }: { name: InviteIcon }) {
  return (
    <svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true">
      {name === 'sushi' ? (
        <>
          <rect x="7" y="25" width="34" height="14" rx="7" fill="#fffdf8" stroke="#e8dccb" />
          <rect x="5" y="14" width="38" height="17" rx="8.5" fill="#f2a193" />
          <path
            d="M13 19c4 2 8 2 12 0M24 22c4 2 8 2 12 0"
            stroke="#ffd9cf"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="21" y="14" width="6" height="25" fill="#3b3340" opacity="0.85" />
        </>
      ) : name === 'cup' ? (
        <>
          <path
            d="M20 8c-2 3 2 4 0 7M27 8c-2 3 2 4 0 7"
            stroke="#9a8fa0"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="9" y="18" width="24" height="22" rx="6" fill="#d3e7c3" stroke="#8fba7a" />
          <path d="M33 22h2.5a5.5 5.5 0 0 1 0 11H33" fill="none" stroke="#8fba7a" strokeWidth="3" />
        </>
      ) : (
        <>
          <rect
            x="7"
            y="7"
            width="34"
            height="34"
            rx="9"
            fill="#fffdf8"
            stroke="#b4a5ee"
            strokeWidth="2"
          />
          <circle cx="17" cy="17" r="3" fill="#b4a5ee" />
          <circle cx="24" cy="24" r="3" fill="#b4a5ee" />
          <circle cx="31" cy="31" r="3" fill="#b4a5ee" />
        </>
      )}
    </svg>
  )
}

export function StepArt({ icons }: { icons: InviteIcon[] }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      {icons.map((name) => (
        <Art key={name} name={name} />
      ))}
    </span>
  )
}

// Icon bí mật của Trang 2: bóng bay có dấu "?" (không dùng hộp quà, BR-I10). Chạm thì "bụp" ra bánh sinh nhật.
export function SecretBalloon() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
      <path
        d="M60 94c-4 8 5 12 0 24"
        fill="none"
        stroke="#9a8fa0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M60 86l-7 10h14z" fill="#8f7fdc" />
      <ellipse cx="60" cy="50" rx="35" ry="41" fill="#b4a5ee" />
      <ellipse
        cx="45"
        cy="33"
        rx="9"
        ry="14"
        fill="#fff"
        opacity="0.35"
        transform="rotate(25 45 33)"
      />
      <path
        d="M49 40c0-8 5-12 11-12 7 0 11 5 11 11 0 6-5 8-9 11-2 1.5-2 3-2 6"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="72" r="3.6" fill="#fff" />
    </svg>
  )
}

export function SecretCake() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
      <ellipse cx="60" cy="106" rx="46" ry="7" fill="#e8dccb" />
      <rect
        x="22"
        y="70"
        width="76"
        height="34"
        rx="10"
        fill="#ffd9cf"
        stroke="#f2a193"
        strokeWidth="2"
      />
      <path d="M22 76h76v6q-9.5 10-19 0q-9.5 10-19 0q-9.5 10-19 0q-9.5 10-19 0z" fill="#fffdf8" />
      <circle cx="36" cy="94" r="2.8" fill="#b4a5ee" />
      <circle cx="54" cy="97" r="2.8" fill="#8fba7a" />
      <circle cx="72" cy="94" r="2.8" fill="#b4a5ee" />
      <circle cx="88" cy="97" r="2.8" fill="#8fba7a" />
      <rect
        x="36"
        y="48"
        width="48"
        height="26"
        rx="8"
        fill="#fbeab4"
        stroke="#e9bb52"
        strokeWidth="2"
      />
      <path d="M36 54h48v4q-8 8-16 0q-8 8-16 0q-8 8-16 0z" fill="#fffdf8" />
      <rect
        x="57"
        y="30"
        width="6"
        height="19"
        rx="2"
        fill="#d3e7c3"
        stroke="#8fba7a"
        strokeWidth="1.5"
      />
      <g data-flame>
        <path d="M60 12q10 9 0 18q-10-9 0-18z" fill="#f5b53a" />
        <path d="M60 19q4.5 4.5 0 9q-4.5-4.5 0-9z" fill="#fff1b8" />
      </g>
    </svg>
  )
}
