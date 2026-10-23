import { motion, useMotionValue, useSpring, useTransform, type MotionStyle } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Capsule, Tier } from '../content/types'
import { getAudioManager } from '../lib/audio'
import { resolveAudio, resolveMedia } from '../lib/media'
import { useReducedMotionPref } from '../lib/reduced-motion'
import { Burst } from '../ui/Burst'
import { Button } from '../ui/Button'
import { springs } from '../ui/motion'
import styles from './MemoryCard.module.css'

const TIER_LABEL: Record<Tier, string> = { normal: 'Thường', silver: 'Bạc', gold: 'Vàng' }

function Placeholder({ label }: { label: string }) {
  return <div className={styles.placeholder}>{label}</div>
}

function Photo({ name, alt }: { name?: string; alt: string }) {
  const url = resolveMedia(name)
  if (!url) return <Placeholder label="Ảnh đang chờ được bổ sung" />
  return <img className={styles.photo} src={url} alt={alt} draggable={false} />
}

function PhotoPairBody({
  images,
  caption,
  title,
}: {
  images?: [string, string]
  caption: string
  title: string
}) {
  const [flipped, setFlipped] = useState(false)
  const reduced = useReducedMotionPref()
  return (
    <figure className={styles.figure}>
      <button
        type="button"
        className={styles.flip}
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label="Lật ảnh"
      >
        {reduced ? (
          // Giảm chuyển động: đổi ảnh thẳng, không lật 3D
          <div className={styles.flipInner}>
            <div className={styles.face}>
              <Photo
                name={images?.[flipped ? 1 : 0]}
                alt={`${title}, mặt ${flipped ? 'sau' : 'trước'}`}
              />
            </div>
          </div>
        ) : (
          <motion.div
            className={styles.flipInner}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={springs.soft}
          >
            <div className={styles.face}>
              <Photo name={images?.[0]} alt={`${title}, mặt trước`} />
            </div>
            <div className={`${styles.face} ${styles.back}`}>
              <Photo name={images?.[1]} alt={`${title}, mặt sau`} />
            </div>
          </motion.div>
        )}
      </button>
      <figcaption className={styles.caption}>{caption}</figcaption>
      <p className={styles.hint}>Chạm vào ảnh để lật</p>
    </figure>
  )
}

function VideoBody({
  video,
  poster,
  caption,
}: {
  video?: string
  poster?: string
  caption: string
}) {
  const src = resolveMedia(video)
  return (
    <figure className={styles.figure}>
      {src ? (
        <video
          className={styles.photo}
          src={src}
          poster={resolveMedia(poster)}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
        />
      ) : (
        <Placeholder label="Video đang chờ được bổ sung" />
      )}
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  )
}

// Slot voice note: có file thì hiện trình phát, và tạm dừng nhạc nền trong lúc nghe
function VoicePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const ducked = useRef(false)
  const [playing, setPlaying] = useState(false)

  const release = () => {
    setPlaying(false)
    if (ducked.current) {
      getAudioManager().unduck()
      ducked.current = false
    }
  }

  useEffect(
    () => () => {
      if (ducked.current) getAudioManager().unduck()
    },
    [],
  )

  return (
    <div className={styles.voice}>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => {
          setPlaying(true)
          if (!ducked.current) {
            getAudioManager().duck(0)
            ducked.current = true
          }
        }}
        onPause={release}
        onEnded={release}
      />
      <Button
        variant="secondary"
        aria-label={playing ? 'Dừng lời nhắn' : 'Nghe lời nhắn'}
        onClick={() => {
          const el = audioRef.current
          if (!el) return
          if (playing) el.pause()
          else void el.play().catch(release)
        }}
      >
        {playing ? 'Dừng' : 'Nghe lời nhắn'}
      </Button>
    </div>
  )
}

function CardBody({ capsule }: { capsule: Capsule }) {
  const { card, title } = capsule
  switch (card.kind) {
    case 'photo':
      return (
        <figure className={styles.figure}>
          <Photo name={card.image} alt={title} />
          <figcaption className={styles.caption}>{card.caption}</figcaption>
        </figure>
      )
    case 'photoPair':
      return <PhotoPairBody images={card.images} caption={card.caption} title={title} />
    case 'video':
      return <VideoBody video={card.video} poster={card.poster} caption={card.caption} />
    case 'voucher':
      return (
        <div className={styles.voucher}>
          <p className={styles.voucherLabel}>Voucher</p>
          <p className={styles.voucherText}>{card.text}</p>
        </div>
      )
    case 'promise': {
      const voice = resolveAudio(card.voice?.src)
      return (
        <div className={styles.promise}>
          <ul className={styles.promises}>
            {card.promises.map((promise) => (
              <li key={promise}>{promise}</li>
            ))}
          </ul>
          {voice ? <VoicePlayer src={voice} /> : <Photo name={card.fallbackImage} alt={title} />}
        </div>
      )
    }
    case 'finale':
      return null
  }
}

// Hologram hạng Bạc: ánh kim và độ nghiêng theo ngón tay kéo (không dùng cảm biến nghiêng máy)
function useHolo(enabled: boolean, tilt: boolean) {
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spring = { stiffness: 180, damping: 22, mass: 0.8 }
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), spring)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), spring)
  const mx = useTransform(px, (v) => `${(v + 0.5) * 100}%`)
  const my = useTransform(py, (v) => `${(v + 0.5) * 100}%`)

  const handlers = enabled
    ? {
        onPointerMove(e: PointerEvent<HTMLElement>) {
          const rect = e.currentTarget.getBoundingClientRect()
          px.set((e.clientX - rect.left) / rect.width - 0.5)
          py.set((e.clientY - rect.top) / rect.height - 0.5)
        },
        onPointerLeave() {
          px.set(0)
          py.set(0)
        },
      }
    : {}

  const style = enabled
    ? ({
        // Giảm chuyển động: bỏ độ nghiêng 3D, vẫn giữ ánh kim đổi màu theo ngón tay
        ...(tilt ? { rotateX, rotateY, transformPerspective: 900 } : {}),
        '--mx': mx,
        '--my': my,
      } as MotionStyle)
    : undefined
  return { handlers, style }
}

interface MemoryCardProps {
  capsule: Capsule
  onClose: () => void
  /** Chữ trên nút đóng: "Cất vào album" lúc vừa mở capsule, "Đóng" khi xem lại trong album. */
  closeLabel?: string
  /** Tia sáng bung ra khi thẻ xuất hiện; tắt khi xem lại trong album. */
  celebrate?: boolean
}

export function MemoryCard({
  capsule,
  onClose,
  closeLabel = 'Cất vào album',
  celebrate = true,
}: MemoryCardProps) {
  const silver = capsule.tier === 'silver'
  const reduced = useReducedMotionPref()
  const holo = useHolo(silver, !reduced)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {celebrate ? <Burst tier={capsule.tier} /> : null}
      <motion.article
        role="dialog"
        aria-modal="true"
        aria-label={`Thẻ ${capsule.title}`}
        className={`${styles.card} ${styles[capsule.tier]}`}
        style={holo.style}
        initial={{ y: 180, scale: 0.5, rotate: -8, opacity: 0 }}
        animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
        exit={{ y: 60, scale: 0.6, opacity: 0 }}
        transition={springs.bouncy}
        {...holo.handlers}
      >
        <header className={styles.header}>
          <span className={styles.badge}>{TIER_LABEL[capsule.tier]}</span>
          <h2 className={styles.title}>{capsule.title}</h2>
        </header>
        <div className={styles.body}>
          <CardBody capsule={capsule} />
        </div>
        <Button onClick={onClose} autoFocus>
          {closeLabel}
        </Button>
        {silver ? <div className={styles.foil} aria-hidden="true" /> : null}
      </motion.article>
    </motion.div>
  )
}
