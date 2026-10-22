// Hiệu ứng âm thanh tổng hợp bằng Web Audio. Phần mô tả (dữ liệu thuần) tách khỏi phần phát.

export type SfxName = 'coin' | 'knob' | 'drop' | 'pop' | 'sparkle' | 'confetti'

export const SFX_NAMES: readonly SfxName[] = ['coin', 'knob', 'drop', 'pop', 'sparkle', 'confetti']

export type SfxNote = {
  wave: 'sine' | 'triangle' | 'noise'
  /** Giây, tính từ lúc bắt đầu phát hiệu ứng. */
  startAt: number
  duration: number
  /** Tần số (Hz); với 'noise' là tần số cắt của bộ lọc. */
  freq: number
  /** Nếu có, tần số trượt dần tới giá trị này (chỉ cho sine/triangle). */
  freqEnd?: number
  /** Biên độ đỉnh của envelope, 0 đến 1. */
  peak: number
  attack: number
  filter?: 'lowpass' | 'highpass' | 'bandpass'
}

export type SfxDescription = {
  notes: readonly SfxNote[]
  /** Thời điểm nốt cuối kết thúc (giây). */
  duration: number
}

// Giới hạn dịu tai: tổng biên độ đỉnh của các nốt chồng nhau không vượt mức này.
export const SFX_MAX_PEAK = 0.3

const notes: Record<SfxName, readonly SfxNote[]> = {
  // Hai nốt cao nối nhau, kiểu "ting-ting" của đồng xu
  coin: [
    { wave: 'triangle', startAt: 0, duration: 0.14, freq: 988, peak: 0.14, attack: 0.005 },
    { wave: 'triangle', startAt: 0.08, duration: 0.4, freq: 1319, peak: 0.14, attack: 0.005 },
  ],
  // Ba tiếng "cạch" nhỏ liên tiếp khi xoay núm
  knob: [0, 0.07, 0.14].flatMap((startAt): SfxNote[] => [
    {
      wave: 'noise',
      startAt,
      duration: 0.035,
      freq: 1400,
      peak: 0.12,
      attack: 0.002,
      filter: 'bandpass',
    },
    {
      wave: 'triangle',
      startAt,
      duration: 0.05,
      freq: 220,
      freqEnd: 150,
      peak: 0.1,
      attack: 0.002,
    },
  ]),
  // Tiếng "bịch" trầm rồi nảy lại nhỏ hơn
  drop: [
    {
      wave: 'sine',
      startAt: 0,
      duration: 0.25,
      freq: 420,
      freqEnd: 120,
      peak: 0.22,
      attack: 0.004,
    },
    {
      wave: 'noise',
      startAt: 0,
      duration: 0.08,
      freq: 500,
      peak: 0.06,
      attack: 0.002,
      filter: 'lowpass',
    },
    {
      wave: 'sine',
      startAt: 0.3,
      duration: 0.18,
      freq: 320,
      freqEnd: 110,
      peak: 0.12,
      attack: 0.004,
    },
  ],
  // Tiếng "póc" khi bật nắp
  pop: [
    { wave: 'sine', startAt: 0, duration: 0.1, freq: 300, freqEnd: 800, peak: 0.2, attack: 0.003 },
    {
      wave: 'noise',
      startAt: 0,
      duration: 0.06,
      freq: 2500,
      peak: 0.07,
      attack: 0.002,
      filter: 'highpass',
    },
  ],
  // Chuỗi nốt cao đi lên, nhỏ và thưa
  sparkle: [1568, 2093, 2637, 3136].map((freq, index): SfxNote => ({
    wave: 'sine',
    startAt: index * 0.06,
    duration: 0.28,
    freq,
    peak: 0.07,
    attack: 0.004,
  })),
  // Ba đợt nhiễu "xoẹt" và một hợp âm vui, dịu
  confetti: [
    {
      wave: 'noise',
      startAt: 0,
      duration: 0.2,
      freq: 2500,
      peak: 0.08,
      attack: 0.005,
      filter: 'bandpass',
    },
    {
      wave: 'noise',
      startAt: 0.1,
      duration: 0.2,
      freq: 3200,
      peak: 0.06,
      attack: 0.005,
      filter: 'bandpass',
    },
    {
      wave: 'noise',
      startAt: 0.2,
      duration: 0.25,
      freq: 2800,
      peak: 0.05,
      attack: 0.005,
      filter: 'bandpass',
    },
    { wave: 'triangle', startAt: 0, duration: 0.5, freq: 523, peak: 0.04, attack: 0.01 },
    { wave: 'triangle', startAt: 0.06, duration: 0.5, freq: 659, peak: 0.04, attack: 0.01 },
    { wave: 'triangle', startAt: 0.12, duration: 0.6, freq: 784, peak: 0.04, attack: 0.01 },
  ],
}

export function describeSfx(name: SfxName): SfxDescription {
  const list = notes[name]
  const duration = list.reduce((max, note) => Math.max(max, note.startAt + note.duration), 0)
  return { notes: list, duration }
}

// Các kiểu tối thiểu của Web Audio mà phần phát cần; AudioContext thật thoả mãn cấu trúc này.
export type AudioParamLike = {
  setValueAtTime(value: number, time: number): unknown
  linearRampToValueAtTime(value: number, time: number): unknown
  exponentialRampToValueAtTime(value: number, time: number): unknown
}
export type AudioNodeLike = { connect(destination: unknown): unknown }
export type GainNodeLike = AudioNodeLike & { gain: AudioParamLike }
export type OscillatorNodeLike = AudioNodeLike & {
  type: string
  frequency: AudioParamLike
  start(when?: number): void
  stop(when?: number): void
}
export type BufferSourceNodeLike = AudioNodeLike & {
  buffer: unknown
  start(when?: number): void
  stop(when?: number): void
}
export type BiquadFilterNodeLike = AudioNodeLike & { type: string; frequency: AudioParamLike }
export type AudioContextLike = {
  readonly state: string
  readonly currentTime: number
  readonly sampleRate: number
  readonly destination: unknown
  resume(): Promise<void>
  createGain(): GainNodeLike
  createOscillator(): OscillatorNodeLike
  createBufferSource(): BufferSourceNodeLike
  createBiquadFilter(): BiquadFilterNodeLike
  createBuffer(
    channels: number,
    length: number,
    sampleRate: number,
  ): { getChannelData(channel: number): Float32Array }
}

const SILENT_LEVEL = 0.0001
const STOP_MARGIN = 0.03

function createNoiseSource(ctx: AudioContextLike, seconds: number): BufferSourceNodeLike {
  const length = Math.max(1, Math.ceil(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = buffer
  return source
}

/** Phát một mô tả hiệu ứng lên context. Người gọi chịu trách nhiệm bắt lỗi. */
export function playSfxDescription(ctx: AudioContextLike, description: SfxDescription): void {
  const base = ctx.currentTime + 0.005
  for (const note of description.notes) {
    const start = base + note.startAt
    const end = start + note.duration

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(note.peak, start + note.attack)
    gain.gain.exponentialRampToValueAtTime(SILENT_LEVEL, end)

    let source: OscillatorNodeLike | BufferSourceNodeLike
    if (note.wave === 'noise') {
      source = createNoiseSource(ctx, note.duration + STOP_MARGIN)
    } else {
      const osc = ctx.createOscillator()
      osc.type = note.wave
      osc.frequency.setValueAtTime(note.freq, start)
      if (note.freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(note.freqEnd, end)
      }
      source = osc
    }

    if (note.filter) {
      const filter = ctx.createBiquadFilter()
      filter.type = note.filter
      filter.frequency.setValueAtTime(note.freq, start)
      source.connect(filter)
      filter.connect(gain)
    } else {
      source.connect(gain)
    }
    gain.connect(ctx.destination)

    source.start(start)
    source.stop(end + STOP_MARGIN)
  }
}
