import { animate, type HTMLMotionProps, type MotionValue } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createKnobTracker, pointerAngle } from '../lib/knob'
import { springs } from '../ui/motion'

// Giữ núm không xoay quá từng này mili giây thì tự quay (phương án thay cho xoay vòng tròn)
const HOLD_MS = 650
// Con trỏ dịch quá từng này pixel thì coi là đang xoay chứ không phải giữ
const MOVE_SLOP = 8
// Một lần quay luôn kéo dài ít nhất từng này để kịp thấy các viên lắc lư
const MIN_SPIN_MS = 1100
const TICK_DEG = 60

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

type Session = {
  id: number
  cx: number
  cy: number
  x: number
  y: number
  moved: boolean
  timer: number
}

interface Options {
  enabled: boolean
  angle: MotionValue<number>
  /** Gọi sau khi núm quay xong; nơi gọi thả capsule vào khay. */
  onSpinEnd: () => void
  /** Gọi mỗi TICK_DEG độ núm xoay, để phát tiếng lạch cạch. */
  onTick?: () => void
  label: string
}

export function useKnobGesture({ enabled, angle, onSpinEnd, onTick, label }: Options) {
  const [spinning, setSpinning] = useState(false)
  const [tracker] = useState(() => createKnobTracker())
  const spinningRef = useRef(false)
  const session = useRef<Session | null>(null)
  const mounted = useRef(true)
  const lastTick = useRef(0)
  const onSpinEndRef = useRef(onSpinEnd)
  const onTickRef = useRef(onTick)

  useEffect(() => {
    onSpinEndRef.current = onSpinEnd
    onTickRef.current = onTick
  })

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (session.current) window.clearTimeout(session.current.timer)
    }
  }, [])

  useEffect(
    () =>
      angle.on('change', (value) => {
        const tick = Math.floor(value / TICK_DEG)
        if (tick === lastTick.current) return
        lastTick.current = tick
        if (tick > 0) onTickRef.current?.()
      }),
    [angle],
  )

  const endSession = useCallback(() => {
    if (session.current) window.clearTimeout(session.current.timer)
    session.current = null
    tracker.reset()
  }, [tracker])

  const spin = useCallback(async () => {
    if (!enabled || spinningRef.current) return
    spinningRef.current = true
    setSpinning(true)
    const from = angle.get()
    const to = Math.max(1, Math.ceil(from / 360)) * 360
    const startedAt = performance.now()
    await animate(angle, to, { duration: 0.7 + ((to - from) / 360) * 0.7, ease: 'easeInOut' })
    const rest = MIN_SPIN_MS - (performance.now() - startedAt)
    if (rest > 0) await sleep(rest)
    // 360 độ trông giống 0 độ nên đặt lại mà không thấy giật
    lastTick.current = 0
    angle.set(0)
    spinningRef.current = false
    if (mounted.current) setSpinning(false)
    onSpinEndRef.current()
  }, [enabled, angle])

  const knobProps: HTMLMotionProps<'div'> = {
    role: 'button',
    tabIndex: enabled ? 0 : -1,
    'aria-label': label,
    'aria-disabled': !enabled,
    onPointerDown(e) {
      if (!enabled || spinningRef.current) return
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      try {
        // Giữ con trỏ khi ngón tay trượt ra ngoài núm; không bắt được thì vẫn xoay bình thường
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // pointerId không còn hoạt động
      }
      tracker.start(pointerAngle(cx, cy, e.clientX, e.clientY))
      session.current = {
        id: e.pointerId,
        cx,
        cy,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        timer: window.setTimeout(() => {
          if (session.current && !session.current.moved) {
            endSession()
            void spin()
          }
        }, HOLD_MS),
      }
    },
    onPointerMove(e) {
      const s = session.current
      if (!s || e.pointerId !== s.id) return
      if (!s.moved) {
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) <= MOVE_SLOP) return
        s.moved = true
        window.clearTimeout(s.timer)
      }
      const result = tracker.move(pointerAngle(s.cx, s.cy, e.clientX, e.clientY))
      angle.set(result.total)
      if (result.done) {
        endSession()
        void spin()
      }
    },
    onPointerUp() {
      if (!session.current) return
      endSession()
      if (!spinningRef.current) animate(angle, 0, springs.bouncy)
    },
    onPointerCancel() {
      if (!session.current) return
      endSession()
      if (!spinningRef.current) animate(angle, 0, springs.bouncy)
    },
    onKeyDown(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        void spin()
      }
    },
  }

  return { spinning, knobProps, spin }
}
