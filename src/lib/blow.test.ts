import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BLOW_CALIBRATION_MS,
  BLOW_REQUIRED_MS,
  createBlowEvaluator,
  measureBlowLevel,
  startBlowDetection,
  type BlowAnalyser,
  type BlowAudioContext,
  type BlowAudioNode,
  type BlowState,
  type BlowStream,
  type BlowTrack,
  type GetUserMedia,
} from './blow.ts'

const STEP_MS = 20

// Đẩy mức không đổi `level` trong `ms` mili giây, mỗi bước STEP_MS.
function feed(ev: ReturnType<typeof createBlowEvaluator>, level: number, ms: number) {
  for (let t = 0; t < ms; t += STEP_MS) ev.push(level, STEP_MS)
}

function calibratedEvaluator(noise = 0) {
  const ev = createBlowEvaluator()
  feed(ev, noise, BLOW_CALIBRATION_MS + STEP_MS)
  return ev
}

describe('bộ đánh giá thổi nến', () => {
  it('chưa hiệu chuẩn trong khoảng đầu và level bằng 0', () => {
    const ev = createBlowEvaluator()
    feed(ev, 0.9, BLOW_CALIBRATION_MS - STEP_MS)
    expect(ev.calibrated).toBe(false)
    expect(ev.level).toBe(0)
    expect(ev.blown).toBe(false)
    feed(ev, 0.9, STEP_MS)
    expect(ev.calibrated).toBe(true)
  })

  it('im lặng không kích hoạt', () => {
    const ev = createBlowEvaluator()
    feed(ev, 0, 10_000)
    expect(ev.calibrated).toBe(true)
    expect(ev.blown).toBe(false)
    expect(ev.level).toBe(0)
  })

  it('tiếng động ngắn không kích hoạt', () => {
    const ev = calibratedEvaluator()
    feed(ev, 0.9, 140)
    feed(ev, 0, 1000)
    expect(ev.blown).toBe(false)
    expect(ev.progress).toBe(0)
  })

  it('nhiều tiếng động ngắn lặp lại cũng không cộng dồn', () => {
    const ev = calibratedEvaluator()
    for (let i = 0; i < 30; i++) {
      feed(ev, 0.9, 100)
      feed(ev, 0, 100)
    }
    expect(ev.blown).toBe(false)
  })

  it('tiếng thổi kéo dài kích hoạt', () => {
    const ev = calibratedEvaluator()
    feed(ev, 0.8, BLOW_REQUIRED_MS + STEP_MS)
    expect(ev.blown).toBe(true)
    expect(ev.progress).toBe(1)
  })

  it('trạng thái đã thổi được giữ nguyên cho tới khi reset', () => {
    const ev = calibratedEvaluator()
    feed(ev, 0.8, 600)
    feed(ev, 0, 2000)
    expect(ev.blown).toBe(true)
    ev.reset()
    expect(ev.blown).toBe(false)
    expect(ev.calibrated).toBe(false)
  })

  it('nền ồn đều không kích hoạt sai nhưng thổi mạnh hơn nền vẫn kích hoạt', () => {
    const ev = calibratedEvaluator(0.2)
    expect(ev.baseline).toBeCloseTo(0.2, 5)
    expect(ev.threshold).toBeGreaterThan(0.2)
    feed(ev, 0.2, 5000)
    expect(ev.blown).toBe(false)
    feed(ev, 0.9, 600)
    expect(ev.blown).toBe(true)
  })

  it('khoảng lặng ngắn xen giữa không xoá hết tiến độ', () => {
    const ev = calibratedEvaluator()
    feed(ev, 0.8, 300)
    const before = ev.progress
    expect(before).toBeGreaterThan(0.5)
    feed(ev, 0, 100)
    expect(ev.progress).toBeGreaterThan(0)
    expect(ev.progress).toBeLessThan(before)
    expect(ev.blown).toBe(false)
    feed(ev, 0.8, 200)
    expect(ev.blown).toBe(true)
  })

  it('khoảng lặng dài thì tiến độ về 0', () => {
    const ev = calibratedEvaluator()
    feed(ev, 0.8, 300)
    feed(ev, 0, 1000)
    expect(ev.progress).toBe(0)
  })

  it('level luôn nằm trong [0, 1] kể cả đầu vào xấu', () => {
    const ev = createBlowEvaluator()
    const inputs = [0, 0.3, 1, 5, -2, Number.NaN, Infinity, -Infinity, 0.05, 0.9]
    for (let i = 0; i < 400; i++) {
      ev.push(inputs[(i * 7) % inputs.length], STEP_MS)
      expect(ev.level).toBeGreaterThanOrEqual(0)
      expect(ev.level).toBeLessThanOrEqual(1)
      expect(Number.isNaN(ev.level)).toBe(false)
    }
  })

  it('thổi mạnh hơn cho level cao hơn', () => {
    const weak = calibratedEvaluator()
    const strong = calibratedEvaluator()
    feed(weak, 0.1, 100)
    feed(strong, 0.9, 100)
    expect(strong.level).toBeGreaterThan(weak.level)
  })

  it('bỏ qua dtMs không hợp lệ', () => {
    const ev = createBlowEvaluator()
    ev.push(0.9, 0)
    ev.push(0.9, -5)
    ev.push(0.9, Number.NaN)
    feed(ev, 0, BLOW_CALIBRATION_MS - STEP_MS)
    expect(ev.calibrated).toBe(false)
  })

  it('cho phép tiêm cấu hình', () => {
    const ev = createBlowEvaluator({ calibrationMs: 0, requiredMs: 100, minBurstMs: 0 })
    expect(ev.calibrated).toBe(true)
    feed(ev, 0.8, 120)
    expect(ev.blown).toBe(true)
  })
})

describe('đo mức thô từ dữ liệu AnalyserNode', () => {
  const bins = 512
  const sampleRate = 48_000
  const silentTime = new Uint8Array(1024).fill(128)

  it('im lặng cho mức 0', () => {
    expect(measureBlowLevel(silentTime, new Uint8Array(bins), sampleRate)).toBe(0)
  })

  it('năng lượng thấp tần cho mức cao hơn cùng năng lượng ở cao tần', () => {
    const low = new Uint8Array(bins)
    low.fill(255, 1, 33)
    const high = new Uint8Array(bins)
    high.fill(255, 300, 500)
    expect(measureBlowLevel(silentTime, low, sampleRate)).toBeGreaterThan(
      measureBlowLevel(silentTime, high, sampleRate),
    )
  })

  it('luôn trong [0, 1] kể cả khi dữ liệu cực đại', () => {
    const time = new Uint8Array(1024)
    time.forEach((_, i) => (time[i] = i % 2 === 0 ? 0 : 255))
    const level = measureBlowLevel(time, new Uint8Array(bins).fill(255), sampleRate)
    expect(level).toBeGreaterThan(0.9)
    expect(level).toBeLessThanOrEqual(1)
  })

  it('không lỗi khi dữ liệu rỗng', () => {
    expect(measureBlowLevel([], [], sampleRate)).toBe(0)
  })
})

// ---------- Lớp tích hợp với đối tượng giả (không bao giờ dùng micro thật) ----------

function createHarness() {
  let loud = 0
  let clock = 0
  let pending: (() => void) | null = null
  const canceled: number[] = []

  const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }] satisfies BlowTrack[]
  const stream: BlowStream = { getTracks: () => tracks }

  const sourceNode = { connect: vi.fn(), disconnect: vi.fn() } satisfies BlowAudioNode
  const analyser = {
    fftSize: 0,
    smoothingTimeConstant: 0,
    get frequencyBinCount() {
      return this.fftSize / 2
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    getByteTimeDomainData(array: Uint8Array) {
      for (let i = 0; i < array.length; i++) {
        const swing = Math.round(loud * 100)
        array[i] = 128 + (i % 2 === 0 ? swing : -swing)
      }
    },
    getByteFrequencyData(array: Uint8Array) {
      array.fill(Math.round(loud * 255))
    },
  } satisfies BlowAnalyser

  const context = {
    state: 'running',
    sampleRate: 48_000,
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    createMediaStreamSource: vi.fn(() => sourceNode),
    createAnalyser: vi.fn(() => analyser),
  } satisfies BlowAudioContext

  return {
    tracks,
    stream,
    sourceNode,
    analyser,
    context,
    canceled,
    getUserMedia: vi.fn<GetUserMedia>(async () => stream),
    createAudioContext: vi.fn(() => context),
    schedule: (callback: () => void) => {
      pending = callback
      return () => {
        if (pending === callback) pending = null
        canceled.push(clock)
      }
    },
    now: () => clock,
    setLoud(value: number) {
      loud = value
    },
    hasPendingFrame: () => pending !== null,
    // Tiến đồng hồ giả rồi chạy khung đang chờ (nếu có).
    step(ms = STEP_MS) {
      clock += ms
      const callback = pending
      pending = null
      callback?.()
    },
    run(ms: number) {
      for (let t = 0; t < ms; t += STEP_MS) this.step(STEP_MS)
    },
  }
}

type Harness = ReturnType<typeof createHarness>

async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

function startWith(h: Harness, extra: Parameters<typeof startBlowDetection>[0] = {}) {
  const states: BlowState[] = []
  const onLevel = vi.fn()
  const onBlow = vi.fn()
  const detection = startBlowDetection({
    getUserMedia: h.getUserMedia,
    createAudioContext: h.createAudioContext,
    schedule: h.schedule,
    now: h.now,
    onStateChange: (s) => states.push(s),
    onLevel,
    onBlow,
    ...extra,
  })
  return { detection, states, onLevel, onBlow }
}

describe('startBlowDetection', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('xin micro với ràng buộc tắt xử lý âm thanh', async () => {
    const h = createHarness()
    startWith(h)
    await flush()
    expect(h.getUserMedia).toHaveBeenCalledTimes(1)
    expect(h.getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
  })

  it('thành công thì sang listening, cấu hình analyser và không nối ra loa', async () => {
    const h = createHarness()
    const { detection, states } = startWith(h)
    expect(detection.getState()).toBe('requesting')
    await flush()
    expect(detection.getState()).toBe('listening')
    expect(states).toEqual(['requesting', 'listening'])
    expect(h.analyser.fftSize).toBe(1024)
    expect(h.sourceNode.connect).toHaveBeenCalledWith(h.analyser)
    expect(h.analyser.connect).not.toHaveBeenCalled()
  })

  it('từ chối quyền thì denied và không tạo AudioContext', async () => {
    const h = createHarness()
    h.getUserMedia.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'NotAllowedError' }))
    const { detection, states } = startWith(h)
    await flush()
    expect(detection.getState()).toBe('denied')
    expect(states).toEqual(['requesting', 'denied'])
    expect(h.createAudioContext).not.toHaveBeenCalled()
    expect(h.hasPendingFrame()).toBe(false)
  })

  it('SecurityError cũng là denied', async () => {
    const h = createHarness()
    h.getUserMedia.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'SecurityError' }))
    const { detection } = startWith(h)
    await flush()
    expect(detection.getState()).toBe('denied')
  })

  it('không có thiết bị hoặc lỗi khác thì unavailable', async () => {
    for (const name of ['NotFoundError', 'NotReadableError', 'Error']) {
      const h = createHarness()
      h.getUserMedia.mockRejectedValueOnce(Object.assign(new Error('x'), { name }))
      const { detection } = startWith(h)
      await flush()
      expect(detection.getState()).toBe('unavailable')
      expect(h.createAudioContext).not.toHaveBeenCalled()
    }
  })

  it('getUserMedia ném lỗi đồng bộ thì vẫn không ném ra ngoài', async () => {
    const h = createHarness()
    h.getUserMedia.mockImplementationOnce(() => {
      throw new TypeError('x')
    })
    let detection!: ReturnType<typeof startBlowDetection>
    expect(() => (detection = startWith(h).detection)).not.toThrow()
    await flush()
    expect(detection.getState()).toBe('unavailable')
  })

  it('không có getUserMedia thì unavailable', async () => {
    const h = createHarness()
    const { detection, states } = startWith(h, { getUserMedia: null })
    await flush()
    expect(detection.getState()).toBe('unavailable')
    expect(states).toEqual(['requesting', 'unavailable'])
    expect(h.createAudioContext).not.toHaveBeenCalled()
  })

  it('mặc định: trình duyệt không có mediaDevices thì unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const h = createHarness()
    const detection = startBlowDetection({ schedule: h.schedule, now: h.now })
    await flush()
    expect(detection.getState()).toBe('unavailable')
  })

  it('tạo AudioContext lỗi thì dừng mọi track và unavailable', async () => {
    const h = createHarness()
    h.createAudioContext.mockImplementationOnce(() => {
      throw new Error('x')
    })
    const { detection } = startWith(h)
    await flush()
    expect(detection.getState()).toBe('unavailable')
    for (const track of h.tracks) expect(track.stop).toHaveBeenCalledTimes(1)
  })

  it('không có AudioContext thì dừng mọi track và unavailable', async () => {
    const h = createHarness()
    const { detection } = startWith(h, { createAudioContext: null })
    await flush()
    expect(detection.getState()).toBe('unavailable')
    for (const track of h.tracks) expect(track.stop).toHaveBeenCalledTimes(1)
  })

  it('gọi resume khi AudioContext đang suspended', async () => {
    const h = createHarness()
    Object.assign(h.context, { state: 'suspended' })
    const { detection } = startWith(h)
    await flush()
    expect(h.context.resume).toHaveBeenCalledTimes(1)
    expect(detection.getState()).toBe('listening')
  })

  it('stop dừng mọi track, ngắt node, đóng context và an toàn khi gọi hai lần', async () => {
    const h = createHarness()
    const { detection, onLevel, onBlow, states } = startWith(h)
    await flush()
    h.run(100)
    const levelCalls = onLevel.mock.calls.length
    expect(levelCalls).toBeGreaterThan(0)

    detection.stop()
    detection.stop()
    await flush()

    for (const track of h.tracks) expect(track.stop).toHaveBeenCalledTimes(1)
    expect(h.context.close).toHaveBeenCalledTimes(1)
    expect(h.sourceNode.disconnect).toHaveBeenCalled()
    expect(h.analyser.disconnect).toHaveBeenCalled()
    expect(h.hasPendingFrame()).toBe(false)

    h.setLoud(1)
    h.run(2000)
    expect(onLevel).toHaveBeenCalledTimes(levelCalls)
    expect(onBlow).not.toHaveBeenCalled()
    expect(states).toEqual(['requesting', 'listening'])
    expect(detection.getState()).toBe('idle')
  })

  it('stop khi đang chờ quyền thì stream đến muộn vẫn bị dừng và không có callback', async () => {
    const h = createHarness()
    let resolve!: (stream: BlowStream) => void
    h.getUserMedia.mockImplementationOnce(() => new Promise<BlowStream>((r) => (resolve = r)))
    const { detection, states } = startWith(h)
    detection.stop()
    resolve(h.stream)
    await flush()
    for (const track of h.tracks) expect(track.stop).toHaveBeenCalledTimes(1)
    expect(h.createAudioContext).not.toHaveBeenCalled()
    expect(states).toEqual(['requesting'])
    expect(detection.getState()).toBe('idle')
  })

  it('stop khi đang resume thì vẫn đóng context và dừng track', async () => {
    const h = createHarness()
    Object.assign(h.context, { state: 'suspended' })
    let finishResume!: () => void
    h.context.resume.mockImplementationOnce(() => new Promise<void>((r) => (finishResume = r)))
    const { detection, states } = startWith(h)
    await flush()
    detection.stop()
    finishResume()
    await flush()
    for (const track of h.tracks) expect(track.stop).toHaveBeenCalledTimes(1)
    expect(h.context.close).toHaveBeenCalledTimes(1)
    expect(states).toEqual(['requesting'])
    expect(h.hasPendingFrame()).toBe(false)
  })

  it('im lặng thì không thổi, onLevel luôn trong [0, 1]', async () => {
    const h = createHarness()
    const { detection, onLevel, onBlow } = startWith(h)
    await flush()
    h.run(5000)
    expect(onBlow).not.toHaveBeenCalled()
    expect(detection.getState()).toBe('listening')
    for (const [level] of onLevel.mock.calls) {
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(1)
    }
    detection.stop()
  })

  it('thổi đủ lâu thì blown, gọi onBlow đúng một lần và tự dừng stream', async () => {
    const h = createHarness()
    const { detection, onBlow, states } = startWith(h)
    await flush()
    h.run(BLOW_CALIBRATION_MS + 100)
    h.setLoud(0.9)
    h.run(1000)
    await flush()

    expect(onBlow).toHaveBeenCalledTimes(1)
    expect(detection.getState()).toBe('blown')
    expect(states).toEqual(['requesting', 'listening', 'blown'])
    for (const track of h.tracks) expect(track.stop).toHaveBeenCalledTimes(1)
    expect(h.context.close).toHaveBeenCalledTimes(1)
    expect(h.hasPendingFrame()).toBe(false)

    detection.stop()
    expect(detection.getState()).toBe('blown')
    expect(h.context.close).toHaveBeenCalledTimes(1)
  })

  it('khi onBlow chạy thì micro đã được tắt', async () => {
    const h = createHarness()
    const stoppedAtBlow: number[] = []
    startWith(h, {
      onBlow: () => stoppedAtBlow.push(...h.tracks.map((t) => t.stop.mock.calls.length)),
    })
    await flush()
    h.run(BLOW_CALIBRATION_MS + 100)
    h.setLoud(0.9)
    h.run(1000)
    expect(stoppedAtBlow).toEqual([1, 1])
  })

  it('tiếng động ngắn trong lúc nghe không gây blown', async () => {
    const h = createHarness()
    const { detection, onBlow } = startWith(h)
    await flush()
    h.run(BLOW_CALIBRATION_MS + 100)
    h.setLoud(0.9)
    h.run(100)
    h.setLoud(0)
    h.run(1000)
    expect(onBlow).not.toHaveBeenCalled()
    expect(detection.getState()).toBe('listening')
    detection.stop()
  })

  it('dt lớn bất thường (tab bị treo) không bị tính là thổi liên tục', async () => {
    const h = createHarness()
    const { detection, onBlow } = startWith(h)
    await flush()
    h.run(BLOW_CALIBRATION_MS + 100)
    h.setLoud(0.9)
    h.step(60_000)
    expect(onBlow).not.toHaveBeenCalled()
    detection.stop()
  })

  it('callback của người dùng ném lỗi không làm hỏng vòng lặp', async () => {
    const h = createHarness()
    const { detection } = startWith(h, {
      onLevel: () => {
        throw new Error('x')
      },
    })
    await flush()
    expect(() => h.run(200)).not.toThrow()
    expect(h.hasPendingFrame()).toBe(true)
    detection.stop()
  })

  it('import module không gọi getUserMedia; chỉ gọi khi startBlowDetection', async () => {
    const getUserMedia = vi.fn(async () => {
      throw Object.assign(new Error('x'), { name: 'NotAllowedError' })
    })
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    vi.resetModules()
    const fresh = await import('./blow.ts')
    await flush()
    expect(getUserMedia).not.toHaveBeenCalled()

    const h = createHarness()
    const detection = fresh.startBlowDetection({ schedule: h.schedule, now: h.now })
    await flush()
    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(detection.getState()).toBe('denied')
  })
})
