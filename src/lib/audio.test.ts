import { describe, expect, it } from 'vitest'
import {
  MUTED_STORAGE_KEY,
  SFX_NAMES,
  createAudioManager,
  describeSfx,
  type AudioContextLike,
  type MusicLike,
  type StorageLike,
} from './audio'
import { SFX_MAX_PEAK } from './audio-sfx'

type FakeContext = AudioContextLike & {
  state: string
  sources: number
  oscillators: number
  resumeCalls: number
}

function makeParam() {
  return {
    setValueAtTime: () => undefined,
    linearRampToValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
  }
}

function makeContext(options: { state?: string; rejectResume?: boolean } = {}): FakeContext {
  const ctx = {
    state: options.state ?? 'running',
    sources: 0,
    oscillators: 0,
    resumeCalls: 0,
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    resume() {
      ctx.resumeCalls += 1
      if (options.rejectResume) return Promise.reject(new Error('không resume được'))
      ctx.state = 'running'
      return Promise.resolve()
    },
    createGain: () => ({ gain: makeParam(), connect: () => undefined }),
    createOscillator: () => {
      ctx.sources += 1
      ctx.oscillators += 1
      return {
        type: 'sine',
        frequency: makeParam(),
        connect: () => undefined,
        start: () => undefined,
        stop: () => undefined,
      }
    },
    createBufferSource: () => {
      ctx.sources += 1
      return {
        buffer: null,
        connect: () => undefined,
        start: () => undefined,
        stop: () => undefined,
      }
    },
    createBiquadFilter: () => ({
      type: 'lowpass',
      frequency: makeParam(),
      connect: () => undefined,
    }),
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
  }
  return ctx
}

type FakeMusic = MusicLike & { playing: boolean; playCalls: number; pauseCalls: number }

function makeMusic(options: { rejectPlay?: boolean; ignoreVolume?: boolean } = {}): FakeMusic {
  let volume = 1
  const music = {
    src: '',
    loop: false,
    playing: false,
    playCalls: 0,
    pauseCalls: 0,
    get volume() {
      return volume
    },
    set volume(value: number) {
      if (!options.ignoreVolume) volume = value
    },
    play() {
      music.playCalls += 1
      if (options.rejectPlay) return Promise.reject(new Error('NotAllowedError'))
      music.playing = true
      return Promise.resolve()
    },
    pause() {
      music.pauseCalls += 1
      music.playing = false
    },
  }
  return music
}

function makeStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>
} {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

const brokenStorage: StorageLike = {
  getItem() {
    throw new Error('bị chặn')
  },
  setItem() {
    throw new Error('bị chặn')
  },
}

function setup(
  options: {
    ctx?: FakeContext
    music?: FakeMusic
    storage?: StorageLike | null
  } = {},
) {
  const ctx = options.ctx ?? makeContext()
  const music = options.music ?? makeMusic()
  const storage = options.storage === undefined ? makeStorage() : options.storage
  const manager = createAudioManager({
    createContext: () => ctx,
    createMusic: () => music,
    storage,
  })
  return { ctx, music, storage, manager }
}

describe('nhạc nền', () => {
  it('không có nguồn nhạc thì startMusic không lỗi và không phát', async () => {
    const { music, manager } = setup()
    await manager.unlock()
    expect(() => manager.startMusic()).not.toThrow()
    expect(music.playCalls).toBe(0)
    expect(manager.getState().musicAvailable).toBe(false)
  })

  it('setMusicSource rỗng hoặc không truyền thì coi như không có nhạc', async () => {
    const { music, manager } = setup()
    manager.setMusicSource()
    manager.setMusicSource('')
    await manager.unlock()
    manager.startMusic()
    expect(music.playCalls).toBe(0)
    expect(manager.getState().musicAvailable).toBe(false)
  })

  it('chưa unlock thì chưa phát; unlock xong mới phát và lặp lại', async () => {
    const { music, manager } = setup()
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    expect(music.playCalls).toBe(0)
    await manager.unlock()
    expect(music.playing).toBe(true)
    expect(music.src).toBe('/nhac.mp3')
    expect(music.loop).toBe(true)
    expect(manager.getState()).toEqual({ unlocked: true, muted: false, musicAvailable: true })
  })

  it('unlock gọi nhiều lần an toàn, không phát lại nhạc đang chạy', async () => {
    const { ctx, music, manager } = setup()
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    await manager.unlock()
    await manager.unlock()
    expect(music.playCalls).toBe(1)
    expect(ctx.resumeCalls).toBe(0)
  })

  it('play() bị từ chối thì được bắt, không ném lỗi chưa xử lý', async () => {
    const { music, manager } = setup({ music: makeMusic({ rejectPlay: true }) })
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    expect(() => manager.unlock()).not.toThrow()
    await Promise.resolve()
    await Promise.resolve()
    expect(music.playCalls).toBe(1)
    // Lần chạm sau vẫn thử lại được
    await manager.unlock()
    expect(music.playCalls).toBe(2)
  })

  it('không tạo được phần tử nhạc thì vẫn chạy bình thường', async () => {
    const manager = createAudioManager({
      createContext: () => makeContext(),
      createMusic: () => null,
      storage: makeStorage(),
    })
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    expect(manager.getState().musicAvailable).toBe(false)
  })
})

describe('tắt tiếng', () => {
  it('tắt tiếng thì nhạc dừng, bật lại thì nhạc tiếp tục', async () => {
    const { music, manager } = setup()
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    manager.setMuted(true)
    expect(music.playing).toBe(false)
    expect(manager.isMuted()).toBe(true)
    manager.setMuted(false)
    expect(music.playing).toBe(true)
  })

  it('tắt tiếng thì sfx.play không tạo nguồn âm nào', async () => {
    const { ctx, manager } = setup()
    await manager.unlock()
    manager.setMuted(true)
    for (const name of SFX_NAMES) manager.sfx.play(name)
    expect(ctx.oscillators).toBe(0)
  })

  it('bật tiếng thì sfx.play tạo nguồn âm', async () => {
    const { ctx, manager } = setup()
    await manager.unlock()
    manager.sfx.play('coin')
    expect(ctx.oscillators).toBeGreaterThan(0)
  })

  it('chưa unlock thì sfx im lặng', () => {
    const { ctx, manager } = setup()
    manager.sfx.play('pop')
    expect(ctx.sources).toBe(0)
  })

  it('toggleMuted đảo trạng thái và trả về giá trị mới', () => {
    const { manager } = setup()
    expect(manager.toggleMuted()).toBe(true)
    expect(manager.toggleMuted()).toBe(false)
  })

  it('tải lại (manager mới trên cùng storage) vẫn giữ trạng thái tắt', () => {
    const storage = makeStorage()
    const first = setup({ storage }).manager
    first.setMuted(true)
    expect(storage.data[MUTED_STORAGE_KEY]).toBe('1')
    const second = setup({ storage }).manager
    expect(second.isMuted()).toBe(true)
    second.setMuted(false)
    expect(setup({ storage }).manager.isMuted()).toBe(false)
  })

  it('storage ném lỗi thì manager vẫn chạy, mặc định bật tiếng', async () => {
    const { ctx, music, manager } = setup({ storage: brokenStorage })
    expect(manager.isMuted()).toBe(false)
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    expect(music.playing).toBe(true)
    expect(() => manager.setMuted(true)).not.toThrow()
    expect(manager.isMuted()).toBe(true)
    expect(music.playing).toBe(false)
    manager.setMuted(false)
    manager.sfx.play('knob')
    expect(ctx.oscillators).toBeGreaterThan(0)
  })

  it('không có storage (null) cũng chạy được', () => {
    const { manager } = setup({ storage: null })
    expect(manager.isMuted()).toBe(false)
    expect(() => manager.setMuted(true)).not.toThrow()
  })
})

describe('AudioContext không dùng được', () => {
  it('suspended mà resume() reject thì unlock và sfx không ném lỗi, không phát', async () => {
    const ctx = makeContext({ state: 'suspended', rejectResume: true })
    const { manager } = setup({ ctx })
    await expect(manager.unlock()).resolves.toBeUndefined()
    expect(() => manager.sfx.play('drop')).not.toThrow()
    await Promise.resolve()
    await Promise.resolve()
    expect(ctx.oscillators).toBe(0)
    expect(ctx.resumeCalls).toBeGreaterThan(0)
  })

  it('suspended nhưng resume() thành công thì sfx phát sau khi resume', async () => {
    const ctx = makeContext({ state: 'suspended' })
    const { manager } = setup({ ctx })
    await manager.unlock()
    manager.sfx.play('pop')
    await Promise.resolve()
    await Promise.resolve()
    expect(ctx.oscillators).toBeGreaterThan(0)
  })

  it('không tạo được context thì mọi thứ vẫn chạy, sfx im lặng', async () => {
    const manager = createAudioManager({
      createContext: () => {
        throw new Error('không hỗ trợ')
      },
      createMusic: () => makeMusic(),
      storage: makeStorage(),
    })
    await expect(manager.unlock()).resolves.toBeUndefined()
    expect(() => manager.sfx.play('coin')).not.toThrow()
    expect(manager.getState().unlocked).toBe(true)
  })

  it('tạo node bị ném lỗi giữa chừng thì sfx không ném ra ngoài', async () => {
    const ctx = makeContext()
    ctx.createOscillator = () => {
      throw new Error('hỏng')
    }
    const { manager } = setup({ ctx })
    await manager.unlock()
    expect(() => manager.sfx.play('coin')).not.toThrow()
  })

  it('môi trường không có API trình duyệt (node) vẫn tạo và dùng được', async () => {
    const manager = createAudioManager()
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await expect(manager.unlock()).resolves.toBeUndefined()
    expect(() => manager.sfx.play('sparkle')).not.toThrow()
    expect(manager.getState().musicAvailable).toBe(false)
  })
})

describe('duck / unduck', () => {
  it('hạ âm lượng rồi khôi phục', async () => {
    const { music, manager } = setup()
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    const full = music.volume
    manager.duck(0.25)
    expect(music.volume).toBeCloseTo(full * 0.25)
    manager.unduck()
    expect(music.volume).toBeCloseTo(full)
  })

  it('gọi lồng nhau khôi phục về đúng mức trước đó', async () => {
    const { music, manager } = setup()
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    const full = music.volume
    manager.duck(0.5)
    manager.duck(0.2)
    expect(music.volume).toBeCloseTo(full * 0.2)
    manager.unduck()
    expect(music.volume).toBeCloseTo(full * 0.5)
    manager.unduck()
    expect(music.volume).toBeCloseTo(full)
    manager.unduck()
    expect(music.volume).toBeCloseTo(full)
  })

  it('duck(0) tạm dừng hẳn, unduck thì phát tiếp', async () => {
    const { music, manager } = setup()
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    manager.duck(0)
    expect(music.playing).toBe(false)
    manager.unduck()
    expect(music.playing).toBe(true)
  })

  it('đang tắt tiếng thì unduck không làm nhạc bật lại', async () => {
    const { music, manager } = setup()
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    manager.setMuted(true)
    manager.duck(0.3)
    manager.unduck()
    expect(music.playing).toBe(false)
  })

  it('mức ngoài khoảng được kẹp về 0 đến 1', async () => {
    const { music, manager } = setup()
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    const full = music.volume
    manager.duck(5)
    expect(music.volume).toBeCloseTo(full)
    manager.duck(Number.NaN)
    expect(music.playing).toBe(false)
  })

  it('thiết bị không chỉnh được volume (iOS) thì hạ âm lượng thành tạm dừng', async () => {
    const { music, manager } = setup({ music: makeMusic({ ignoreVolume: true }) })
    manager.setMusicSource('/nhac.mp3')
    manager.startMusic()
    await manager.unlock()
    expect(music.playing).toBe(true)
    manager.duck(0.3)
    expect(music.playing).toBe(false)
    manager.unduck()
    expect(music.playing).toBe(true)
  })
})

describe('trạng thái công khai', () => {
  it('subscribe nhận thông báo khi trạng thái đổi và dừng khi huỷ', async () => {
    const { manager } = setup()
    let calls = 0
    const off = manager.subscribe(() => {
      calls += 1
    })
    const before = manager.getState()
    await manager.unlock()
    manager.setMuted(true)
    expect(calls).toBe(2)
    expect(manager.getState()).not.toBe(before)
    manager.setMuted(true)
    expect(calls).toBe(2)
    off()
    manager.setMuted(false)
    expect(calls).toBe(2)
  })
})

describe('mô tả hiệu ứng (dữ liệu thuần)', () => {
  it('có đủ sáu hiệu ứng', () => {
    expect([...SFX_NAMES].sort()).toEqual(['coin', 'confetti', 'drop', 'knob', 'pop', 'sparkle'])
  })

  for (const name of SFX_NAMES) {
    it(`"${name}" có mô tả hợp lệ`, () => {
      const { notes, duration } = describeSfx(name)
      expect(notes.length).toBeGreaterThan(0)
      expect(Number.isFinite(duration)).toBe(true)
      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(2)
      for (const note of notes) {
        expect(note.startAt).toBeGreaterThanOrEqual(0)
        expect(note.duration).toBeGreaterThan(0)
        expect(note.attack).toBeGreaterThan(0)
        expect(note.attack).toBeLessThan(note.duration)
        expect(note.freq).toBeGreaterThan(0)
        if (note.freqEnd !== undefined) expect(note.freqEnd).toBeGreaterThan(0)
        expect(note.peak).toBeGreaterThan(0)
        expect(note.peak).toBeLessThanOrEqual(SFX_MAX_PEAK)
      }
    })

    it(`"${name}": tổng biên độ các nốt chồng nhau không vượt giới hạn`, () => {
      const { notes } = describeSfx(name)
      for (const probe of notes) {
        const overlapping = notes.filter(
          (n) => n.startAt <= probe.startAt && probe.startAt < n.startAt + n.duration,
        )
        const sum = overlapping.reduce((total, n) => total + n.peak, 0)
        expect(sum).toBeLessThanOrEqual(SFX_MAX_PEAK)
      }
    })
  }
})
