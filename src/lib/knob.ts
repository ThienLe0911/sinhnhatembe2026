// Theo dõi cử chỉ xoay núm: cộng dồn góc xoay theo chiều kim đồng hồ cho tới ngưỡng quay.
// Thuần túy (không đụng DOM) để test được.

export const KNOB_FULL_TURN_DEG = 300

/** Góc (độ) của con trỏ quanh tâm núm; dương theo chiều kim đồng hồ vì trục y hướng xuống. */
export function pointerAngle(cx: number, cy: number, x: number, y: number): number {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI
}

/** Đưa độ lệch góc về khoảng (-180, 180] để vượt qua mốc ±180 vẫn đúng. */
export function normalizeDelta(deg: number): number {
  let d = deg % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

export type KnobProgress = {
  /** Tổng góc đã xoay thuận chiều, tính bằng độ, không âm. */
  total: number
  /** 0 đến 1 so với ngưỡng. */
  progress: number
  done: boolean
}

export type KnobTracker = {
  start(angle: number): void
  move(angle: number): KnobProgress
  reset(): void
}

export function createKnobTracker(threshold: number = KNOB_FULL_TURN_DEG): KnobTracker {
  let last: number | null = null
  let total = 0
  let done = false

  const snapshot = (): KnobProgress => ({
    total,
    progress: Math.min(1, total / threshold),
    done,
  })

  return {
    start(angle) {
      last = angle
      total = 0
      done = false
    },
    move(angle) {
      if (last === null || done) return snapshot()
      total = Math.max(0, total + normalizeDelta(angle - last))
      last = angle
      if (total >= threshold) done = true
      return snapshot()
    },
    reset() {
      last = null
      total = 0
      done = false
    },
  }
}
