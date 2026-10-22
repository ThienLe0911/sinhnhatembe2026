// Lớp tích hợp micro cho màn thổi nến. Không ghi âm, không lưu mẫu, không gửi đi (BR-06):
// mỗi lượt chỉ đọc vào hai bộ đệm cố định rồi ghi đè ở lượt sau.
// Các hằng số là giá trị KHỞI ĐẦU, sẽ chỉnh bằng iPhone thật ở T23.
import { createBlowEvaluator, type BlowEvaluatorConfig } from './blow-evaluator.ts'

export * from './blow-evaluator.ts'

/** Kích thước FFT của AnalyserNode. */
export const BLOW_FFT_SIZE = 1024
/** Làm mượt phổ của AnalyserNode (0 đến 1). */
export const BLOW_ANALYSER_SMOOTHING = 0.2
/** Dải thấp tần dùng để đo tiếng thổi (Hz). */
export const BLOW_LOW_BAND_MIN_HZ = 60
export const BLOW_LOW_BAND_MAX_HZ = 1500
/** Trọng số trộn năng lượng thấp tần và RMS miền thời gian (tổng nên bằng 1). */
export const BLOW_LOW_BAND_WEIGHT = 0.6
export const BLOW_RMS_WEIGHT = 0.4
/** RMS miền thời gian thường nhỏ nên nhân thêm hệ số này trước khi trộn. */
export const BLOW_RMS_GAIN = 4
/** Giới hạn dt mỗi lượt (ms) để lúc tab bị treo không bị tính thành tiếng thổi liên tục. */
export const BLOW_MAX_FRAME_DT_MS = 100

export type BlowState = 'idle' | 'requesting' | 'listening' | 'blown' | 'denied' | 'unavailable'

export const BLOW_AUDIO_CONSTRAINTS = {
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
} as const

// Giao diện tối thiểu của Web Audio để test trong node bằng đối tượng giả.
export interface BlowTrack {
  stop(): void
}
export interface BlowStream {
  getTracks(): BlowTrack[]
}
export interface BlowAudioNode {
  connect(destination: unknown): unknown
  disconnect(): void
}
export interface BlowAnalyser extends BlowAudioNode {
  fftSize: number
  smoothingTimeConstant: number
  readonly frequencyBinCount: number
  getByteTimeDomainData(array: Uint8Array<ArrayBuffer>): void
  getByteFrequencyData(array: Uint8Array<ArrayBuffer>): void
}
export interface BlowAudioContext {
  readonly state: string
  readonly sampleRate: number
  resume(): Promise<void>
  close(): Promise<void>
  createMediaStreamSource(stream: BlowStream): BlowAudioNode
  createAnalyser(): BlowAnalyser
}

export type GetUserMedia = (constraints: typeof BLOW_AUDIO_CONSTRAINTS) => Promise<BlowStream>
export type CreateAudioContext = () => BlowAudioContext
/** Hẹn chạy `callback` ở khung kế tiếp, trả về hàm huỷ. */
export type ScheduleFrame = (callback: () => void) => () => void

export interface BlowDetectionOptions {
  onLevel?: (level: number) => void
  onBlow?: () => void
  onStateChange?: (state: BlowState) => void
  /** Bỏ trống là dùng navigator.mediaDevices; null là coi như không có API. */
  getUserMedia?: GetUserMedia | null
  /** Bỏ trống là dùng AudioContext của trình duyệt; null là coi như không có API. */
  createAudioContext?: CreateAudioContext | null
  schedule?: ScheduleFrame
  now?: () => number
  evaluatorConfig?: Partial<BlowEvaluatorConfig>
}

export interface BlowDetection {
  /** Idempotent; sau khi gọi sẽ không còn callback nào. */
  stop(): void
  getState(): BlowState
}

/** Mức thô 0 đến 1 từ dữ liệu AnalyserNode: trộn năng lượng thấp tần và RMS miền thời gian. */
export function measureBlowLevel(
  timeData: ArrayLike<number>,
  freqData: ArrayLike<number>,
  sampleRate: number,
): number {
  const binCount = freqData.length
  let low = 0
  if (binCount > 1 && sampleRate > 0) {
    const binHz = sampleRate / (binCount * 2)
    const from = Math.max(1, Math.floor(BLOW_LOW_BAND_MIN_HZ / binHz))
    const to = Math.min(binCount - 1, Math.max(from, Math.ceil(BLOW_LOW_BAND_MAX_HZ / binHz)))
    let sum = 0
    for (let i = from; i <= to; i++) sum += freqData[i] / 255
    low = sum / (to - from + 1)
  }

  let rms = 0
  if (timeData.length > 0) {
    let sumSquares = 0
    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128
      sumSquares += v * v
    }
    rms = Math.sqrt(sumSquares / timeData.length)
  }

  const mixed = BLOW_LOW_BAND_WEIGHT * low + BLOW_RMS_WEIGHT * Math.min(1, rms * BLOW_RMS_GAIN)
  return Math.min(1, Math.max(0, mixed))
}

function defaultGetUserMedia(): GetUserMedia | null {
  const devices = globalThis.navigator?.mediaDevices
  if (!devices || typeof devices.getUserMedia !== 'function') return null
  return (constraints) => devices.getUserMedia(constraints) as unknown as Promise<BlowStream>
}

function defaultCreateAudioContext(): CreateAudioContext | null {
  const scope = globalThis as { AudioContext?: unknown; webkitAudioContext?: unknown }
  const Ctor = (scope.AudioContext ?? scope.webkitAudioContext) as
    (new () => BlowAudioContext) | undefined
  if (!Ctor) return null
  return () => new Ctor()
}

function defaultSchedule(callback: () => void): () => void {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(callback)
    return () => cancelAnimationFrame(id)
  }
  const id = setTimeout(callback, 16)
  return () => clearTimeout(id)
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

// Người dùng từ chối quyền thì là 'denied'; mọi lỗi còn lại (không có thiết bị, ...) là 'unavailable'.
function classifyError(error: unknown): 'denied' | 'unavailable' {
  const name = (error as { name?: unknown } | null)?.name
  return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable'
}

/**
 * Bắt đầu nghe micro. CHỈ gọi trong bộ xử lý nút "Thổi nến" để quyền micro chỉ được xin sau khi bấm.
 * Không bao giờ ném lỗi; mọi kết quả đi qua onStateChange.
 */
export function startBlowDetection(options: BlowDetectionOptions = {}): BlowDetection {
  const schedule = options.schedule ?? defaultSchedule
  const now = options.now ?? defaultNow
  const evaluator = createBlowEvaluator(options.evaluatorConfig)

  let state: BlowState = 'idle'
  let stopped = false
  let finished = false
  let cancelFrame: (() => void) | null = null
  let stream: BlowStream | null = null
  let context: BlowAudioContext | null = null
  let source: BlowAudioNode | null = null
  let analyser: BlowAnalyser | null = null

  // Callback của người dùng không được làm hỏng vòng lặp hay ném ra ngoài.
  function safely(fn: (() => void) | undefined) {
    if (stopped || !fn) return
    try {
      fn()
    } catch {
      // bỏ qua
    }
  }

  function setState(next: BlowState) {
    if (stopped || state === next) return
    state = next
    safely(() => options.onStateChange?.(next))
  }

  // Gọi lại nhiều lần được: chỉ xử lý những gì đang giữ, nên stream đến muộn vẫn bị dừng.
  function release() {
    finished = true
    cancelFrame?.()
    cancelFrame = null
    for (const node of [source, analyser]) {
      try {
        node?.disconnect()
      } catch {
        // đã ngắt rồi
      }
    }
    try {
      for (const track of stream?.getTracks() ?? []) {
        try {
          track.stop()
        } catch {
          // tiếp tục dừng các track còn lại
        }
      }
    } catch {
      // stream hỏng
    }
    try {
      if (context && context.state !== 'closed')
        void Promise.resolve(context.close()).catch(() => {})
    } catch {
      // context đã đóng
    }
    source = null
    analyser = null
    stream = null
    context = null
  }

  function fail(next: 'denied' | 'unavailable') {
    release()
    setState(next)
  }

  async function run() {
    const getUserMedia =
      options.getUserMedia === undefined ? defaultGetUserMedia() : options.getUserMedia
    if (!getUserMedia) {
      fail('unavailable')
      return
    }

    try {
      const acquired = await getUserMedia(BLOW_AUDIO_CONSTRAINTS)
      stream = acquired
      if (stopped) {
        release()
        return
      }

      const createContext =
        options.createAudioContext === undefined
          ? defaultCreateAudioContext()
          : options.createAudioContext
      if (!createContext) {
        fail('unavailable')
        return
      }

      context = createContext()
      analyser = context.createAnalyser()
      analyser.fftSize = BLOW_FFT_SIZE
      analyser.smoothingTimeConstant = BLOW_ANALYSER_SMOOTHING
      source = context.createMediaStreamSource(acquired)
      // Không nối analyser ra loa để tránh tiếng vọng.
      source.connect(analyser)

      if (context.state === 'suspended') await context.resume()
      if (stopped) {
        release()
        return
      }
    } catch (error) {
      fail(classifyError(error))
      return
    }

    const activeAnalyser = analyser
    const activeContext = context
    if (!activeAnalyser || !activeContext) return

    const timeData = new Uint8Array(activeAnalyser.fftSize)
    const freqData = new Uint8Array(activeAnalyser.frequencyBinCount)
    let last = now()
    setState('listening')

    const tick = () => {
      if (stopped || finished) return
      const current = now()
      const dt = Math.min(Math.max(current - last, 0), BLOW_MAX_FRAME_DT_MS)
      last = current

      activeAnalyser.getByteTimeDomainData(timeData)
      activeAnalyser.getByteFrequencyData(freqData)
      evaluator.push(measureBlowLevel(timeData, freqData, activeContext.sampleRate), dt)
      safely(() => options.onLevel?.(evaluator.level))

      if (evaluator.blown) {
        // Tắt micro trước rồi mới báo, để khi onBlow chạy thì không còn track nào hoạt động.
        release()
        setState('blown')
        safely(options.onBlow)
        stopped = true
        return
      }
      if (!stopped) cancelFrame = schedule(tick)
    }
    if (!stopped) cancelFrame = schedule(tick)
  }

  setState('requesting')
  void run().catch(() => fail('unavailable'))

  return {
    stop() {
      if (stopped) return
      stopped = true
      release()
      if (state === 'requesting' || state === 'listening') state = 'idle'
    },
    getState: () => state,
  }
}
