import { describe, expect, it } from 'vitest'
import { content as realContent } from '../content/content'
import type { GachaContent } from '../content/types'
import {
  canDrop,
  canOpen,
  createInitialState,
  getAlbumSlots,
  getNextCapsule,
  getProgress,
  getSpinsUntilGold,
  isGoldAvailable,
  reduce,
  restoreState,
  toSavedProgress,
  type GameAction,
  type GameState,
} from './game'
import { makeContent } from './test-fixtures'

function run(content: GachaContent, state: GameState, ...types: GameAction['type'][]): GameState {
  return types.reduce((s, type) => reduce(content, s, { type }), state)
}

function playing(content: GachaContent): GameState {
  return run(content, createInitialState(true), 'INSERT_COIN')
}

// Mở n capsule đầu (rơi rồi mở), đang ở PLAY
function openFirst(content: GachaContent, n: number): GameState {
  let s = playing(content)
  for (let i = 0; i < n; i++) s = run(content, s, 'DROP_CAPSULE', 'OPEN_CAPSULE')
  return s
}

describe.each([3, 8, 10])('luồng đầy đủ với %i capsule', (n) => {
  const content = makeContent(n)

  it('đi từ COUNTDOWN tới ALBUM, số capsule lấy từ nội dung', () => {
    let s = createInitialState(false)
    expect(s.screen).toBe('COUNTDOWN')
    s = run(content, s, 'UNLOCKED')
    expect(s.screen).toBe('INTRO')
    s = run(content, s, 'INSERT_COIN')
    expect(s.screen).toBe('PLAY')
    expect(s.coinInserted).toBe(true)

    for (let i = 0; i < n - 1; i++) {
      s = run(content, s, 'DROP_CAPSULE')
      expect(s.trayId).toBe(content.capsules[i].id)
      s = run(content, s, 'OPEN_CAPSULE')
      expect(s.trayId).toBeNull()
      expect(s.screen).toBe('PLAY')
      expect(s.openedIds).toEqual(content.capsules.slice(0, i + 1).map((c) => c.id))
    }

    s = run(content, s, 'DROP_CAPSULE')
    expect(s.trayId).toBe('gold')
    s = run(content, s, 'OPEN_CAPSULE')
    expect(s.screen).toBe('FINALE')
    expect(s.openedIds).toHaveLength(n)

    s = run(content, s, 'FINALE_COMPLETE')
    expect(s.screen).toBe('ALBUM')
    expect(s.finaleDone).toBe(true)
    expect(getProgress(content, s)).toEqual({ opened: n, total: n })
  })

  it('capsule vàng bị khoá đến khi mở hết các capsule trước', () => {
    let s = playing(content)
    for (let i = 0; i < n - 1; i++) {
      expect(isGoldAvailable(content, s)).toBe(false)
      expect(getNextCapsule(content, s)?.tier).not.toBe('gold')
      s = run(content, s, 'DROP_CAPSULE')
      expect(s.trayId).not.toBe('gold')
      s = run(content, s, 'OPEN_CAPSULE')
    }
    expect(isGoldAvailable(content, s)).toBe(true)
    expect(getNextCapsule(content, s)?.id).toBe('gold')
    s = run(content, s, 'DROP_CAPSULE')
    expect(s.trayId).toBe('gold')
  })

  it('pity đếm ngược về 1 ngay trước lần quay ra capsule vàng, rồi về 0', () => {
    let s = playing(content)
    expect(getSpinsUntilGold(content, s)).toBe(n)
    for (let i = 0; i < n - 1; i++) {
      expect(getSpinsUntilGold(content, s)).toBe(n - i)
      s = run(content, s, 'DROP_CAPSULE')
      expect(getSpinsUntilGold(content, s)).toBe(n - i - 1)
      s = run(content, s, 'OPEN_CAPSULE')
      expect(getSpinsUntilGold(content, s)).toBe(n - i - 1)
    }
    expect(getSpinsUntilGold(content, s)).toBe(1)
    s = run(content, s, 'DROP_CAPSULE')
    expect(getSpinsUntilGold(content, s)).toBe(0)
  })

  it('album: thẻ nào đã mở thì đánh dấu đúng', () => {
    const s = openFirst(content, 2)
    const slots = getAlbumSlots(content, s)
    expect(slots).toHaveLength(n)
    expect(slots.map((x) => x.opened)).toEqual(slots.map((_, i) => i < 2))
    expect(slots.map((x) => x.capsule.id)).toEqual(content.capsules.map((c) => c.id))
  })
})

describe('hành động hợp lệ và không hợp lệ', () => {
  const content = makeContent(4)

  it('UNLOCKED chỉ có tác dụng ở COUNTDOWN', () => {
    const intro = createInitialState(true)
    expect(reduce(content, intro, { type: 'UNLOCKED' })).toBe(intro)
    const play = playing(content)
    expect(reduce(content, play, { type: 'UNLOCKED' })).toBe(play)
  })

  it('không thể vượt màn đếm ngược bằng hành động khác', () => {
    const cd = createInitialState(false)
    const actions: GameAction['type'][] = [
      'INSERT_COIN',
      'DROP_CAPSULE',
      'OPEN_CAPSULE',
      'FINALE_COMPLETE',
      'REPLAY_FINALE',
      'OPEN_ALBUM',
      'CLOSE_ALBUM',
      'RESET',
    ]
    for (const type of actions) expect(reduce(content, cd, { type })).toBe(cd)
  })

  it('INSERT_COIN chỉ ở INTRO', () => {
    const play = playing(content)
    expect(reduce(content, play, { type: 'INSERT_COIN' })).toBe(play)
  })

  it('không thể rơi capsule khi chưa nạp xu (ở INTRO)', () => {
    const intro = createInitialState(true)
    expect(reduce(content, intro, { type: 'DROP_CAPSULE' })).toBe(intro)
  })

  it('không thể mở capsule khi khay trống', () => {
    const s = playing(content)
    expect(canOpen(s)).toBe(false)
    expect(reduce(content, s, { type: 'OPEN_CAPSULE' })).toBe(s)
    const afterOpen = run(content, s, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    expect(reduce(content, afterOpen, { type: 'OPEN_CAPSULE' })).toBe(afterOpen)
  })

  it('không thể rơi capsule thứ hai khi khay chưa mở', () => {
    const s = run(content, playing(content), 'DROP_CAPSULE')
    expect(canDrop(content, s)).toBe(false)
    expect(reduce(content, s, { type: 'DROP_CAPSULE' })).toBe(s)
    expect(s.trayId).toBe('c1')
  })

  it('không rơi thêm khi đã hết capsule', () => {
    const s = run(content, playing(content), 'DROP_CAPSULE', 'OPEN_CAPSULE')
    const all = openFirst(content, 4)
    expect(all.screen).toBe('FINALE')
    expect(reduce(content, all, { type: 'DROP_CAPSULE' })).toBe(all)
    expect(canDrop(content, s)).toBe(true)
  })

  it('không thể nhảy thẳng tới capsule vàng bằng cách rơi sớm', () => {
    let s = playing(content)
    for (let i = 0; i < 3; i++) {
      s = run(content, s, 'DROP_CAPSULE')
      expect(s.trayId).not.toBe('gold')
      s = run(content, s, 'DROP_CAPSULE') // thừa, bị bỏ qua
      expect(s.trayId).not.toBe('gold')
      s = run(content, s, 'OPEN_CAPSULE')
    }
  })

  it('FINALE_COMPLETE chỉ ở FINALE', () => {
    const play = openFirst(content, 1)
    expect(reduce(content, play, { type: 'FINALE_COMPLETE' })).toBe(play)
    expect(play.finaleDone).toBe(false)
  })

  it('REPLAY_FINALE: ALBUM sau finale quay lại FINALE và giữ finaleDone', () => {
    const album = run(
      content,
      openFirst(content, 3),
      'DROP_CAPSULE',
      'OPEN_CAPSULE',
      'FINALE_COMPLETE',
    )
    const replay = reduce(content, album, { type: 'REPLAY_FINALE' })
    expect(replay.screen).toBe('FINALE')
    expect(replay.finaleDone).toBe(true)
    const back = reduce(content, replay, { type: 'FINALE_COMPLETE' })
    expect(back.screen).toBe('ALBUM')
    expect(back.finaleDone).toBe(true)
  })

  it('REPLAY_FINALE không dùng được khi album mở giữa chừng', () => {
    const album = run(content, openFirst(content, 1), 'OPEN_ALBUM')
    expect(album.screen).toBe('ALBUM')
    expect(reduce(content, album, { type: 'REPLAY_FINALE' })).toBe(album)
  })

  it('REPLAY_FINALE không dùng được ngoài ALBUM', () => {
    const play = playing(content)
    expect(reduce(content, play, { type: 'REPLAY_FINALE' })).toBe(play)
  })

  it('OPEN_ALBUM từ PLAY rồi CLOSE_ALBUM quay lại đúng màn và giữ nguyên tiến trình', () => {
    const before = run(content, openFirst(content, 2), 'DROP_CAPSULE') // khay còn capsule
    const album = reduce(content, before, { type: 'OPEN_ALBUM' })
    expect(album.screen).toBe('ALBUM')
    expect(album.albumReturn).toBe('PLAY')
    expect(album.trayId).toBe(before.trayId)
    expect(reduce(content, album, { type: 'OPEN_CAPSULE' })).toBe(album)
    expect(reduce(content, album, { type: 'DROP_CAPSULE' })).toBe(album)
    expect(reduce(content, album, { type: 'OPEN_ALBUM' })).toBe(album)
    const closed = reduce(content, album, { type: 'CLOSE_ALBUM' })
    expect(closed).toEqual(before)
  })

  it('OPEN_ALBUM không dùng được ở INTRO và FINALE', () => {
    const intro = createInitialState(true)
    expect(reduce(content, intro, { type: 'OPEN_ALBUM' })).toBe(intro)
    const finale = openFirst(content, 4)
    expect(reduce(content, finale, { type: 'OPEN_ALBUM' })).toBe(finale)
  })

  it('CLOSE_ALBUM không có tác dụng với album là đích cuối (sau finale)', () => {
    const album = run(content, openFirst(content, 4), 'FINALE_COMPLETE')
    expect(reduce(content, album, { type: 'CLOSE_ALBUM' })).toBe(album)
  })

  it('CLOSE_ALBUM ngoài ALBUM không có tác dụng', () => {
    const play = playing(content)
    expect(reduce(content, play, { type: 'CLOSE_ALBUM' })).toBe(play)
  })

  it('RESET về INTRO sạch từ mọi màn sau đếm ngược', () => {
    const fresh = createInitialState(true)
    const album = run(content, openFirst(content, 4), 'FINALE_COMPLETE')
    const states = [
      openFirst(content, 2),
      run(content, openFirst(content, 1), 'DROP_CAPSULE'),
      album,
    ]
    for (const s of states) expect(reduce(content, s, { type: 'RESET' })).toEqual(fresh)
    expect(reduce(content, fresh, { type: 'RESET' })).toBe(fresh)
  })

  it('RESET từ album mở giữa chừng cũng về INTRO sạch', () => {
    const album = run(content, openFirst(content, 2), 'OPEN_ALBUM')
    expect(reduce(content, album, { type: 'RESET' })).toEqual(createInitialState(true))
  })

  it('hành động lạ không ném lỗi và không đổi state', () => {
    const s = playing(content)
    const weird = { type: 'KHONG_TON_TAI' } as unknown as GameAction
    expect(reduce(content, s, weird)).toBe(s)
  })

  it('không đột biến state cũ', () => {
    const s = playing(content)
    const snapshot = JSON.stringify(s)
    run(content, s, 'DROP_CAPSULE', 'OPEN_CAPSULE', 'OPEN_ALBUM')
    expect(JSON.stringify(s)).toBe(snapshot)
  })
})

describe('selector với nội dung thật', () => {
  const content = realContent
  const total = content.capsules.length

  it('tiến độ, capsule kế tiếp và cờ capsule vàng', () => {
    const s = openFirst(content, 2)
    expect(getProgress(content, s)).toEqual({ opened: 2, total })
    expect(getNextCapsule(content, s)?.id).toBe(content.capsules[2].id)
    expect(isGoldAvailable(content, s)).toBe(false)
    const ready = openFirst(content, total - 1)
    expect(isGoldAvailable(content, ready)).toBe(true)
  })

  it('capsule kế tiếp bỏ qua capsule đang nằm trong khay', () => {
    const s = run(content, openFirst(content, 1), 'DROP_CAPSULE')
    expect(s.trayId).toBe(content.capsules[1].id)
    expect(getNextCapsule(content, s)?.id).toBe(content.capsules[2].id)
  })

  it('hết capsule thì không còn capsule kế tiếp', () => {
    const s = openFirst(content, total)
    expect(getNextCapsule(content, s)).toBeNull()
  })
})

describe('restoreState và toSavedProgress', () => {
  const content = makeContent(4)

  it('suy ra màn hình đúng từ tiến trình', () => {
    const base = {
      v: 1 as const,
      coinInserted: true,
      openedIds: [],
      trayId: null,
      finaleDone: false,
    }
    expect(restoreState(content, { ...base, coinInserted: false }).screen).toBe('INTRO')
    expect(restoreState(content, base).screen).toBe('PLAY')
    expect(restoreState(content, { ...base, openedIds: ['c1'], trayId: 'c2' }).screen).toBe('PLAY')
    const all = ['c1', 'c2', 'c3', 'gold']
    expect(restoreState(content, { ...base, openedIds: all }).screen).toBe('FINALE')
    expect(restoreState(content, { ...base, openedIds: all, finaleDone: true }).screen).toBe(
      'ALBUM',
    )
  })

  it('chuyển đổi qua lại không mất thông tin', () => {
    const s = run(content, openFirst(content, 2), 'DROP_CAPSULE')
    expect(restoreState(content, toSavedProgress(s))).toEqual(s)
  })
})
