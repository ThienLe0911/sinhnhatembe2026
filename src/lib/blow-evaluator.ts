// Bộ đánh giá "thổi nến" thuần túy: chỉ nhận mức âm và dtMs, không dùng đồng hồ thật.
// Mọi hằng số dưới đây là giá trị KHỞI ĐẦU, sẽ chỉnh bằng iPhone thật ở T23.

/** Thời gian đầu dùng để đo tiếng ồn nền (ms). */
export const BLOW_CALIBRATION_MS = 400
/** Ngưỡng = nền × hệ số này (nhưng không dưới BLOW_MIN_THRESHOLD). */
export const BLOW_NOISE_FACTOR = 2.5
/** Ngưỡng tuyệt đối tối thiểu (thang 0 đến 1) khi nền gần như im lặng. */
export const BLOW_MIN_THRESHOLD = 0.08
/** Trần của ngưỡng để nền rất ồn vẫn còn khả năng vượt ngưỡng. */
export const BLOW_MAX_THRESHOLD = 0.9
/** Tổng thời gian cộng dồn trên ngưỡng để coi là đã thổi xong (ms). */
export const BLOW_REQUIRED_MS = 350
/** Tiếng động liên tục ngắn hơn mức này bị bỏ qua hoàn toàn (ms). */
export const BLOW_MIN_BURST_MS = 150
/** Mỗi 1ms dưới ngưỡng làm bộ tích luỹ giảm chừng này ms (nhỏ hơn 1 để khoảng lặng ngắn không xoá hết). */
export const BLOW_DECAY_RATE = 0.75
/** Mức đầu vào ứng với level = 1 là ngưỡng × hệ số này. */
export const BLOW_FULL_SCALE_FACTOR = 3
/** Hằng số thời gian làm mượt level cho ngọn lửa (ms); 0 là không làm mượt. */
export const BLOW_LEVEL_SMOOTHING_MS = 50

export interface BlowEvaluatorConfig {
  calibrationMs: number
  noiseFactor: number
  minThreshold: number
  maxThreshold: number
  requiredMs: number
  minBurstMs: number
  decayRate: number
  fullScaleFactor: number
  levelSmoothingMs: number
}

export const DEFAULT_BLOW_EVALUATOR_CONFIG: Readonly<BlowEvaluatorConfig> = {
  calibrationMs: BLOW_CALIBRATION_MS,
  noiseFactor: BLOW_NOISE_FACTOR,
  minThreshold: BLOW_MIN_THRESHOLD,
  maxThreshold: BLOW_MAX_THRESHOLD,
  requiredMs: BLOW_REQUIRED_MS,
  minBurstMs: BLOW_MIN_BURST_MS,
  decayRate: BLOW_DECAY_RATE,
  fullScaleFactor: BLOW_FULL_SCALE_FACTOR,
  levelSmoothingMs: BLOW_LEVEL_SMOOTHING_MS,
}

export interface BlowEvaluator {
  /** Đẩy một mẫu mức âm thô (0 đến 1) và khoảng thời gian kể từ mẫu trước (ms). */
  push(level: number, dtMs: number): void
  /** Mức thổi đã chuẩn hoá và làm mượt, luôn trong [0, 1]; 0 khi đang hiệu chuẩn. */
  readonly level: number
  readonly calibrated: boolean
  readonly blown: boolean
  /** Tiến độ cộng dồn 0 đến 1 (1 là đã thổi xong). */
  readonly progress: number
  /** Ngưỡng đang dùng (0 khi chưa hiệu chuẩn), để chỉnh khi thử máy thật. */
  readonly threshold: number
  /** Mức nền đã đo (0 khi chưa hiệu chuẩn). */
  readonly baseline: number
  reset(): void
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function createBlowEvaluator(config: Partial<BlowEvaluatorConfig> = {}): BlowEvaluator {
  const cfg: BlowEvaluatorConfig = { ...DEFAULT_BLOW_EVALUATOR_CONFIG, ...config }

  let calibrated = false
  let calibrationElapsed = 0
  let calibrationSum = 0
  let baseline = 0
  let threshold = 0
  let smoothed = 0
  let burstMs = 0
  let burstCredited = false
  let accumulated = 0
  let blown = false

  function finishCalibration() {
    baseline = calibrationElapsed > 0 ? calibrationSum / calibrationElapsed : 0
    threshold = Math.min(cfg.maxThreshold, Math.max(baseline * cfg.noiseFactor, cfg.minThreshold))
    calibrated = true
  }

  function reset() {
    calibrated = false
    calibrationElapsed = 0
    calibrationSum = 0
    baseline = 0
    threshold = 0
    smoothed = 0
    burstMs = 0
    burstCredited = false
    accumulated = 0
    blown = false
    if (cfg.calibrationMs <= 0) finishCalibration()
  }

  reset()

  function push(level: number, dtMs: number) {
    if (blown || !Number.isFinite(dtMs) || dtMs <= 0) return
    const raw = clamp01(level)

    if (!calibrated) {
      calibrationElapsed += dtMs
      calibrationSum += raw * dtMs
      if (calibrationElapsed >= cfg.calibrationMs) finishCalibration()
      return
    }

    const span = Math.max(threshold * cfg.fullScaleFactor - baseline, 1e-6)
    const target = clamp01((raw - baseline) / span)
    const alpha = cfg.levelSmoothingMs > 0 ? 1 - Math.exp(-dtMs / cfg.levelSmoothingMs) : 1
    smoothed = clamp01(smoothed + (target - smoothed) * alpha)

    if (raw > threshold) {
      burstMs += dtMs
      if (burstMs >= cfg.minBurstMs) {
        // Đoạn đủ dài mới được tính, và tính bù cả phần đã qua của nó.
        accumulated += burstCredited ? dtMs : burstMs
        burstCredited = true
        if (accumulated >= cfg.requiredMs) blown = true
      }
    } else {
      burstMs = 0
      burstCredited = false
      accumulated = Math.max(0, accumulated - dtMs * cfg.decayRate)
    }
  }

  return {
    push,
    reset,
    get level() {
      return smoothed
    },
    get calibrated() {
      return calibrated
    },
    get blown() {
      return blown
    },
    get progress() {
      return clamp01(accumulated / cfg.requiredMs)
    },
    get threshold() {
      return threshold
    },
    get baseline() {
      return baseline
    },
  }
}
