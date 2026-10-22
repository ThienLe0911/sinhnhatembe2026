// Bộ quản lý âm thanh không phụ thuộc React: nhạc nền, tắt/bật tiếng, hạ âm lượng, hiệu ứng.
import { describeSfx, playSfxDescription, type AudioContextLike, type SfxName } from './audio-sfx'

export { SFX_NAMES, describeSfx } from './audio-sfx'
export type { AudioContextLike, SfxDescription, SfxName, SfxNote } from './audio-sfx'

export const MUTED_STORAGE_KEY = 'gacha:audio:muted'
const MUSIC_VOLUME = 0.6

/** Đối tượng giống HTMLAudioElement. */
export type MusicLike = {
  src: string
  loop: boolean
  volume: number
  play(): Promise<void> | void
  pause(): void
}

/** Đối tượng giống localStorage; có thể ném lỗi. */
export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type AudioDeps = {
  createContext: () => AudioContextLike | null
  createMusic: () => MusicLike | null
  storage: StorageLike | null
}

export type AudioState = {
  unlocked: boolean
  muted: boolean
  musicAvailable: boolean
}

export type AudioManager = {
  /** Gọi trong bộ xử lý cử chỉ của người dùng (cú chạm đầu tiên). Gọi nhiều lần an toàn. */
  unlock(): Promise<void>
  setMusicSource(src?: string): void
  startMusic(): void
  setMuted(muted: boolean): void
  isMuted(): boolean
  toggleMuted(): boolean
  /** Hạ âm lượng nhạc về mức level (0 đến 1; 0 là tạm dừng). Gọi lồng nhau được. */
  duck(level: number): void
  /** Khôi phục về mức trước lần duck gần nhất. */
  unduck(): void
  sfx: { play(name: SfxName): void }
  getState(): AudioState
  /** Đăng ký nghe thay đổi trạng thái (dùng được với useSyncExternalStore). Trả về hàm huỷ. */
  subscribe(listener: () => void): () => void
}

type AudioGlobals = {
  AudioContext?: new () => AudioContextLike
  webkitAudioContext?: new () => AudioContextLike
  Audio?: new () => MusicLike
  localStorage?: StorageLike
}

function defaultCreateContext(): AudioContextLike | null {
  const g = globalThis as unknown as AudioGlobals
  const Ctor = g.AudioContext ?? g.webkitAudioContext
  return Ctor ? new Ctor() : null
}

function defaultCreateMusic(): MusicLike | null {
  const g = globalThis as unknown as AudioGlobals
  return g.Audio ? new g.Audio() : null
}

function defaultStorage(): StorageLike | null {
  try {
    // Truy cập localStorage cũng có thể ném lỗi khi bị chặn
    return (globalThis as unknown as AudioGlobals).localStorage ?? null
  } catch {
    return null
  }
}

function clamp01(value: number): number {
  // Giá trị không hợp lệ thì chọn phương án yên lặng
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function createAudioManager(deps: Partial<AudioDeps> = {}): AudioManager {
  const createContext = deps.createContext ?? defaultCreateContext
  const createMusic = deps.createMusic ?? defaultCreateMusic
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage

  let unlocked = false
  let muted = readMuted()
  let ctx: AudioContextLike | null = null
  let music: MusicLike | null = null
  let musicSrc: string | undefined
  let musicWanted = false
  let musicPlaying = false
  // Safari iOS bỏ qua việc đặt volume của phần tử audio; khi đó hạ âm lượng = tạm dừng
  let volumeSupported = true
  const duckStack: number[] = []
  const listeners = new Set<() => void>()
  let snapshot = buildState()

  function readMuted(): boolean {
    try {
      return storage?.getItem(MUTED_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  }

  function writeMuted(value: boolean): void {
    try {
      storage?.setItem(MUTED_STORAGE_KEY, value ? '1' : '0')
    } catch {
      // Không nhớ được lựa chọn thì thôi, vẫn chạy bình thường
    }
  }

  function buildState(): AudioState {
    return { unlocked, muted, musicAvailable: music !== null && musicSrc !== undefined }
  }

  function emitIfChanged(): void {
    const next = buildState()
    if (
      next.unlocked === snapshot.unlocked &&
      next.muted === snapshot.muted &&
      next.musicAvailable === snapshot.musicAvailable
    ) {
      return
    }
    snapshot = next
    listeners.forEach((listener) => {
      try {
        listener()
      } catch {
        // Người nghe lỗi không được làm hỏng âm thanh
      }
    })
  }

  function duckLevel(): number {
    return duckStack.length > 0 ? duckStack[duckStack.length - 1] : 1
  }

  function pauseMusic(): void {
    if (!music || !musicPlaying) return
    musicPlaying = false
    try {
      music.pause()
    } catch {
      // bỏ qua
    }
  }

  function applyMusic(): void {
    if (!music || musicSrc === undefined) return
    const level = duckLevel()
    const volume = MUSIC_VOLUME * level
    const shouldPlay = musicWanted && unlocked && !muted && level > 0

    if (shouldPlay) {
      try {
        music.volume = volume
        volumeSupported = Math.abs(music.volume - volume) < 0.01
      } catch {
        volumeSupported = false
      }
      // Không chỉnh được âm lượng thì mọi mức hạ đều thành tạm dừng
      if (!volumeSupported && level < 1) {
        pauseMusic()
        return
      }
      if (musicPlaying) return
      musicPlaying = true
      try {
        Promise.resolve(music.play()).catch(() => {
          // Bị chặn autoplay: để lần sau (cú chạm kế tiếp) thử lại
          musicPlaying = false
        })
      } catch {
        musicPlaying = false
      }
    } else {
      pauseMusic()
    }
  }

  function ensureContext(): AudioContextLike | null {
    if (ctx) return ctx
    try {
      ctx = createContext()
    } catch {
      ctx = null
    }
    return ctx
  }

  function ensureMusic(): MusicLike | null {
    if (music) return music
    try {
      music = createMusic()
    } catch {
      music = null
    }
    if (music) music.loop = true
    return music
  }

  // iOS cần một âm im lặng phát ngay trong cử chỉ để mở khoá Web Audio
  function playSilentUnlock(context: AudioContextLike): void {
    try {
      const buffer = context.createBuffer(1, 1, context.sampleRate)
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(context.destination)
      source.start(0)
    } catch {
      // bỏ qua
    }
  }

  function resumeContext(context: AudioContextLike): Promise<void> {
    if (context.state === 'running') return Promise.resolve()
    try {
      return Promise.resolve(context.resume()).catch(() => undefined)
    } catch {
      return Promise.resolve()
    }
  }

  const manager: AudioManager = {
    unlock() {
      const first = !unlocked
      unlocked = true
      const context = ensureContext()
      const pending = context ? resumeContext(context) : Promise.resolve()
      if (context && first) playSilentUnlock(context)
      // play() của nhạc phải được gọi đồng bộ trong cử chỉ nên áp dụng ngay tại đây
      applyMusic()
      emitIfChanged()
      return pending
    },

    setMusicSource(src) {
      const clean = src?.trim() ? src : undefined
      if (clean === musicSrc) return
      const wasPlaying = musicPlaying
      pauseMusic()
      musicSrc = clean
      if (clean === undefined) {
        emitIfChanged()
        return
      }
      const element = ensureMusic()
      if (element) {
        try {
          element.src = clean
          element.loop = true
        } catch {
          // bỏ qua
        }
      }
      if (wasPlaying) applyMusic()
      emitIfChanged()
    },

    startMusic() {
      musicWanted = true
      applyMusic()
    },

    setMuted(value) {
      if (value !== muted) {
        muted = value
        writeMuted(value)
      }
      applyMusic()
      emitIfChanged()
    },

    isMuted() {
      return muted
    },

    toggleMuted() {
      manager.setMuted(!muted)
      return muted
    },

    duck(level) {
      duckStack.push(clamp01(level))
      applyMusic()
    },

    unduck() {
      if (duckStack.length === 0) return
      duckStack.pop()
      applyMusic()
    },

    sfx: {
      play(name) {
        if (muted || !unlocked) return
        const context = ctx
        if (!context) return
        const description = describeSfx(name)
        const run = () => {
          // Kiểm tra lại: có thể đã tắt tiếng trong lúc chờ resume
          if (muted || context.state !== 'running') return
          try {
            playSfxDescription(context, description)
          } catch {
            // Hiệu ứng hỏng không được làm văng ứng dụng
          }
        }
        if (context.state === 'running') {
          run()
        } else {
          void resumeContext(context).then(run)
        }
      },
    },

    getState() {
      return snapshot
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }

  return manager
}

let shared: AudioManager | null = null

/** Bộ quản lý dùng chung cho toàn ứng dụng (tạo lười, dùng API trình duyệt). */
export function getAudioManager(): AudioManager {
  shared ??= createAudioManager()
  return shared
}
