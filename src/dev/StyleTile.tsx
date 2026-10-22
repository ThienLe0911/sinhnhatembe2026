import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { springs } from '../ui/motion'
import { Stage } from '../ui/Stage'
import styles from './StyleTile.module.css'

const swatches = [
  ['Kem bơ', '--color-bg'],
  ['Bề mặt', '--color-surface'],
  ['Hồng đào', '--color-peach'],
  ['Hồng đào đậm', '--color-peach-strong'],
  ['Lavender', '--color-lavender'],
  ['Lavender đậm', '--color-lavender-strong'],
  ['Matcha', '--color-matcha'],
  ['Matcha đậm', '--color-matcha-strong'],
  ['Bơ vàng', '--color-butter'],
  ['Mực', '--color-ink'],
] as const

function Swatch({ label, variable }: { label: string; variable: string }) {
  const [hex, setHex] = useState('')
  useEffect(() => {
    setHex(getComputedStyle(document.documentElement).getPropertyValue(variable).trim())
  }, [variable])
  return (
    <div className={styles.swatch}>
      <div className={styles.chip} style={{ background: `var(${variable})` }} />
      <span className={styles.swatchLabel}>{label}</span>
      <span className={styles.swatchHex}>{hex}</span>
    </div>
  )
}

function Capsule({ tier, label }: { tier: 'normal' | 'silver' | 'gold'; label: string }) {
  return (
    <div className={styles.capsuleItem}>
      <motion.div
        className={`${styles.capsule} ${styles[tier]}`}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className={styles.swatchLabel}>{label}</span>
    </div>
  )
}

export default function StyleTile() {
  return (
    <Stage>
      <div className={styles.tile}>
        <header>
          <p className={styles.eyebrow}>Style tile · T09</p>
          <h1 className={styles.title}>Em Bé Gacha</h1>
          <p className={styles.lead}>
            Chúc mừng sinh nhật 22 tuổi! Anh Thúi của em bé: ắ ằ ẳ ẵ ặ, ế ề ể ễ ệ, ố ồ ổ ỗ ộ, ứ ừ ử
            ữ ự.
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.heading}>Bảng màu</h2>
          <div className={styles.swatches}>
            {swatches.map(([label, variable]) => (
              <Swatch key={variable} label={label} variable={variable} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Chữ</h2>
          <p className={styles.display}>Chúc mừng sinh nhật em bé!</p>
          <p className={styles.body}>
            Nội dung chính cỡ 16px, dễ đọc trên iPhone. Matcha, trang sức bạc, và những buổi chiều
            anh đứng đợi em bé tan làm.
          </p>
          <p className={styles.caption}>Chú thích nhỏ 13px, chỉ dùng cho thông tin phụ.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Nút (chạm để thử lò xo)</h2>
          <div className={styles.row}>
            <Button>Vào chơi</Button>
            <Button variant="secondary">Xem album</Button>
            <Button variant="ghost">Để sau</Button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Thẻ đất sét và kính</h2>
          <div className={styles.cardStage}>
            <div className={styles.blob} />
            <motion.div
              className={styles.clay}
              whileTap={{ scale: 0.97 }}
              transition={springs.bouncy}
            >
              <strong>Thẻ Miễn La</strong>
              <span>Dùng khi em bé ra trễ lúc anh đón.</span>
            </motion.div>
            <div className={styles.glass}>
              <strong>Kính mờ</strong>
              <span>Cho lớp phủ và hộp thoại.</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Ba hạng capsule</h2>
          <div className={styles.capsules}>
            <Capsule tier="normal" label="Thường" />
            <Capsule tier="silver" label="Bạc" />
            <Capsule tier="gold" label="Vàng" />
          </div>
        </section>
      </div>
    </Stage>
  )
}
