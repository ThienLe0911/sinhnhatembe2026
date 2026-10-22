import { describe, expect, it, vi } from 'vitest'
import type { GachaContent } from '../content/types'
import { createInitialState, type GameAction } from './game'
import { PREVIEW_PROGRESS_KEY, PROGRESS_KEY } from './progress-storage'
import { createGameStore, type GameStoreOptions } from './store'
import { makeContent, makeStorage, makeThrowingStorage, type FakeStorage } from './test-fixtures'

const content = makeContent(4) // c1, c2, c3, gold

function open(
  storage: GameStoreOptions['storage'],
  patch: Partial<GameStoreOptions> = {},
  c: GachaContent = content,
) {
  return createGameStore({ content: c, storage, unlocked: true, preview: false, ...patch })
}

function send(store: ReturnType<typeof open>, ...types: GameAction['type'][]) {
  for (const type of types) store.dispatch({ type })
}

function stored(storage: FakeStorage, key = PROGRESS_KEY) {
  const raw = storage.data.get(key)
  return raw === undefined ? undefined : JSON.parse(raw)
}

describe('khởi tạo', () => {
  it('chưa mở khoá: COUNTDOWN, kể cả khi có dữ liệu lưu', () => {
    const storage = makeStorage({
      [PROGRESS_KEY]: JSON.stringify({
        v: 1,
        coinInserted: true,
        openedIds: [],
        trayId: null,
        finaleDone: false,
      }),
    })
    expect(open(storage, { unlocked: false }).getState().screen).toBe('COUNTDOWN')
  })

  it('chưa mở khoá: UNLOCKED chuyển sang INTRO', () => {
    const store = open(makeStorage(), { unlocked: false })
    send(store, 'UNLOCKED')
    expect(store.getState().screen).toBe('INTRO')
  })

  it('mở khoá, không có dữ liệu: INTRO sạch', () => {
    expect(open(makeStorage()).getState()).toEqual(createInitialState(true))
  })

  it('không lưu gì khi chỉ ở COUNTDOWN và UNLOCKED', () => {
    const storage = makeStorage()
    const store = open(storage, { unlocked: false })
    send(store, 'UNLOCKED')
    expect(storage.data.size).toBe(0)
  })
})

describe('lưu tại điểm ổn định và khôi phục (AC-11)', () => {
  it('lưu sau INSERT_COIN, DROP_CAPSULE, OPEN_CAPSULE, FINALE_COMPLETE', () => {
    const storage = makeStorage()
    const store = open(storage)

    send(store, 'INSERT_COIN')
    expect(stored(storage)).toEqual({
      v: 1,
      coinInserted: true,
      openedIds: [],
      trayId: null,
      finaleDone: false,
    })

    send(store, 'DROP_CAPSULE')
    expect(stored(storage)).toMatchObject({ openedIds: [], trayId: 'c1' })

    send(store, 'OPEN_CAPSULE')
    expect(stored(storage)).toMatchObject({ openedIds: ['c1'], trayId: null })

    send(store, 'DROP_CAPSULE', 'OPEN_CAPSULE', 'DROP_CAPSULE', 'OPEN_CAPSULE')
    send(store, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    expect(stored(storage)).toMatchObject({
      openedIds: ['c1', 'c2', 'c3', 'gold'],
      finaleDone: false,
    })

    send(store, 'FINALE_COMPLETE')
    expect(stored(storage)).toMatchObject({ finaleDone: true })
  })

  it('không lưu khi mở/đóng album hoặc hành động không hợp lệ', () => {
    const storage = makeStorage()
    const store = open(storage)
    send(store, 'INSERT_COIN')
    const setItem = vi.spyOn(storage, 'setItem')
    send(store, 'OPEN_ALBUM', 'CLOSE_ALBUM', 'OPEN_CAPSULE', 'REPLAY_FINALE')
    expect(setItem).not.toHaveBeenCalled()
  })

  it('mở lại sau khi nạp xu: PLAY', () => {
    const storage = makeStorage()
    send(open(storage), 'INSERT_COIN')
    const s = open(storage).getState()
    expect(s.screen).toBe('PLAY')
    expect(s.coinInserted).toBe(true)
  })

  it('mở lại khi capsule còn trong khay: khay vẫn còn đúng capsule đó', () => {
    const storage = makeStorage()
    send(open(storage), 'INSERT_COIN', 'DROP_CAPSULE', 'OPEN_CAPSULE', 'DROP_CAPSULE')
    const s = open(storage).getState()
    expect(s.screen).toBe('PLAY')
    expect(s.openedIds).toEqual(['c1'])
    expect(s.trayId).toBe('c2')
  })

  it('mở lại sau khi mở vài capsule, khay trống', () => {
    const storage = makeStorage()
    send(
      open(storage),
      'INSERT_COIN',
      'DROP_CAPSULE',
      'OPEN_CAPSULE',
      'DROP_CAPSULE',
      'OPEN_CAPSULE',
    )
    const s = open(storage).getState()
    expect(s.screen).toBe('PLAY')
    expect(s.openedIds).toEqual(['c1', 'c2'])
    expect(s.trayId).toBeNull()
  })

  it('mở lại khi capsule vàng đang nằm trong khay: PLAY, khay còn capsule vàng', () => {
    const storage = makeStorage()
    const store = open(storage)
    send(store, 'INSERT_COIN', 'DROP_CAPSULE', 'OPEN_CAPSULE', 'DROP_CAPSULE', 'OPEN_CAPSULE')
    send(store, 'DROP_CAPSULE', 'OPEN_CAPSULE', 'DROP_CAPSULE')
    const s = open(storage).getState()
    expect(s.screen).toBe('PLAY')
    expect(s.trayId).toBe('gold')
  })

  it('mở lại sau khi mở capsule vàng nhưng chưa xong finale: FINALE', () => {
    const storage = makeStorage()
    const store = open(storage)
    send(store, 'INSERT_COIN')
    for (let i = 0; i < 4; i++) send(store, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    expect(open(storage).getState().screen).toBe('FINALE')
  })

  it('mở lại sau finale: ALBUM, finaleDone', () => {
    const storage = makeStorage()
    const store = open(storage)
    send(store, 'INSERT_COIN')
    for (let i = 0; i < 4; i++) send(store, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    send(store, 'FINALE_COMPLETE')
    const s = open(storage).getState()
    expect(s.screen).toBe('ALBUM')
    expect(s.finaleDone).toBe(true)
  })

  it('xem lại finale rồi thoát: mở lại vẫn ở ALBUM', () => {
    const storage = makeStorage()
    const store = open(storage)
    send(store, 'INSERT_COIN')
    for (let i = 0; i < 4; i++) send(store, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    send(store, 'FINALE_COMPLETE', 'REPLAY_FINALE')
    expect(store.getState().screen).toBe('FINALE')
    expect(open(storage).getState().screen).toBe('ALBUM')
  })

  it('album mở giữa chừng rồi thoát: mở lại về PLAY với khay còn nguyên', () => {
    const storage = makeStorage()
    const store = open(storage)
    send(store, 'INSERT_COIN', 'DROP_CAPSULE', 'OPEN_ALBUM')
    const s = open(storage).getState()
    expect(s.screen).toBe('PLAY')
    expect(s.trayId).toBe('c1')
  })
})

describe('dữ liệu lưu không hợp lệ bị bỏ qua, bắt đầu lại từ đầu', () => {
  const fresh = createInitialState(true)
  const good = { v: 1, coinInserted: true, openedIds: ['c1'], trayId: 'c2', finaleDone: false }

  function startFrom(raw: string) {
    return open(makeStorage({ [PROGRESS_KEY]: raw })).getState()
  }

  it('JSON hỏng', () => {
    expect(startFrom('{hỏng')).toEqual(fresh)
  })

  it('sai phiên bản', () => {
    expect(startFrom(JSON.stringify({ ...good, v: 2 }))).toEqual(fresh)
  })

  it('id không còn tồn tại', () => {
    expect(startFrom(JSON.stringify({ ...good, openedIds: ['da-xoa'], trayId: null }))).toEqual(
      fresh,
    )
  })

  it('danh sách đã mở không phải k capsule đầu theo thứ tự', () => {
    expect(startFrom(JSON.stringify({ ...good, openedIds: ['c2'], trayId: null }))).toEqual(fresh)
  })

  it('id khay không phải capsule kế tiếp', () => {
    expect(startFrom(JSON.stringify({ ...good, trayId: 'c3' }))).toEqual(fresh)
  })

  it('mâu thuẫn: finaleDone mà chưa mở hết', () => {
    expect(startFrom(JSON.stringify({ ...good, finaleDone: true, trayId: null }))).toEqual(fresh)
  })

  it('sai kiểu dữ liệu', () => {
    expect(startFrom(JSON.stringify({ ...good, coinInserted: 'có' }))).toEqual(fresh)
    expect(startFrom(JSON.stringify({ ...good, openedIds: 'c1' }))).toEqual(fresh)
  })

  it('sau khi bỏ qua, chơi tiếp bình thường và ghi đè dữ liệu hỏng', () => {
    const storage = makeStorage({ [PROGRESS_KEY]: '{hỏng' })
    const store = open(storage)
    send(store, 'INSERT_COIN')
    expect(stored(storage)).toMatchObject({ v: 1, coinInserted: true })
  })
})

describe('storage lỗi hoặc không có', () => {
  const flow: GameAction['type'][] = [
    'INSERT_COIN',
    'DROP_CAPSULE',
    'OPEN_CAPSULE',
    'DROP_CAPSULE',
    'OPEN_CAPSULE',
    'DROP_CAPSULE',
    'OPEN_CAPSULE',
    'DROP_CAPSULE',
    'OPEN_CAPSULE',
    'FINALE_COMPLETE',
  ]

  it('ném lỗi ở mọi thao tác: vẫn đi trọn luồng INTRO tới ALBUM', () => {
    const store = open(makeThrowingStorage())
    expect(store.getState().screen).toBe('INTRO')
    expect(() => send(store, ...flow)).not.toThrow()
    expect(store.getState().screen).toBe('ALBUM')
    expect(store.getState().finaleDone).toBe(true)
    expect(() => send(store, 'RESET')).not.toThrow()
    expect(store.getState().screen).toBe('INTRO')
  })

  it('không có storage (null): vẫn đi trọn luồng', () => {
    const store = open(null)
    send(store, ...flow)
    expect(store.getState().screen).toBe('ALBUM')
  })

  it('storage ném lỗi khi khởi tạo cũng không crash', () => {
    expect(() => open(makeThrowingStorage(), { unlocked: false })).not.toThrow()
    expect(open(makeThrowingStorage()).getState()).toEqual(createInitialState(true))
  })

  it('getItem trả về giá trị lạ (không phải chuỗi) thì bỏ qua', () => {
    const storage = {
      getItem: () => 123 as unknown as string,
      setItem: () => {},
      removeItem: () => {},
    }
    expect(open(storage).getState()).toEqual(createInitialState(true))
  })
})

describe('RESET', () => {
  it('xoá tiến trình đã lưu và về INTRO; mở lại vẫn là INTRO', () => {
    const storage = makeStorage()
    const store = open(storage)
    send(store, 'INSERT_COIN', 'DROP_CAPSULE', 'OPEN_CAPSULE')
    expect(storage.data.has(PROGRESS_KEY)).toBe(true)
    send(store, 'RESET')
    expect(store.getState()).toEqual(createInitialState(true))
    expect(storage.data.has(PROGRESS_KEY)).toBe(false)
    expect(open(storage).getState().screen).toBe('INTRO')
  })

  it('RESET sau finale cũng xoá', () => {
    const storage = makeStorage()
    const store = open(storage)
    send(store, 'INSERT_COIN')
    for (let i = 0; i < 4; i++) send(store, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    send(store, 'FINALE_COMPLETE', 'RESET')
    expect(storage.data.size).toBe(0)
    expect(store.getState().screen).toBe('INTRO')
  })

  it('RESET ở INTRO sạch vẫn xoá dữ liệu cũ còn sót (dữ liệu bị bỏ qua lúc khởi tạo)', () => {
    const storage = makeStorage({ [PROGRESS_KEY]: '{hỏng' })
    const store = open(storage)
    send(store, 'RESET')
    expect(storage.data.has(PROGRESS_KEY)).toBe(false)
  })

  it('RESET ở COUNTDOWN không xoá gì và không đổi màn', () => {
    const storage = makeStorage({ [PROGRESS_KEY]: 'x' })
    const store = open(storage, { unlocked: false })
    send(store, 'RESET')
    expect(store.getState().screen).toBe('COUNTDOWN')
    expect(storage.data.has(PROGRESS_KEY)).toBe(true)
  })
})

describe('chế độ xem trước dùng khoá riêng', () => {
  it('preview ghi vào khoá riêng và không đụng khoá thật', () => {
    const storage = makeStorage({ [PROGRESS_KEY]: 'du-lieu-that' })
    const store = open(storage, { preview: true })
    send(store, 'INSERT_COIN', 'DROP_CAPSULE')
    expect(storage.data.get(PROGRESS_KEY)).toBe('du-lieu-that')
    expect(stored(storage, PREVIEW_PROGRESS_KEY)).toMatchObject({
      coinInserted: true,
      trayId: 'c1',
    })
  })

  it('chế độ thật ghi vào khoá thật và không đụng khoá xem trước', () => {
    const storage = makeStorage({ [PREVIEW_PROGRESS_KEY]: 'du-lieu-thu' })
    const store = open(storage)
    send(store, 'INSERT_COIN', 'DROP_CAPSULE')
    expect(storage.data.get(PREVIEW_PROGRESS_KEY)).toBe('du-lieu-thu')
    expect(stored(storage)).toMatchObject({ coinInserted: true, trayId: 'c1' })
  })

  it('preview không đọc tiến trình thật, chế độ thật không đọc tiến trình xem trước', () => {
    const storage = makeStorage()
    send(open(storage), 'INSERT_COIN') // tiến trình thật: PLAY
    expect(open(storage, { preview: true }).getState().screen).toBe('INTRO')
    send(open(storage, { preview: true }), 'INSERT_COIN', 'DROP_CAPSULE', 'OPEN_CAPSULE')
    expect(open(storage).getState().openedIds).toEqual([])
    expect(open(storage, { preview: true }).getState().openedIds).toEqual(['c1'])
  })

  it('RESET ở preview chỉ xoá khoá xem trước', () => {
    const storage = makeStorage()
    send(open(storage), 'INSERT_COIN')
    const preview = open(storage, { preview: true })
    send(preview, 'INSERT_COIN', 'RESET')
    expect(storage.data.has(PREVIEW_PROGRESS_KEY)).toBe(false)
    expect(storage.data.has(PROGRESS_KEY)).toBe(true)
  })

  it('RESET ở chế độ thật chỉ xoá khoá thật', () => {
    const storage = makeStorage()
    send(open(storage, { preview: true }), 'INSERT_COIN')
    const real = open(storage)
    send(real, 'INSERT_COIN', 'RESET')
    expect(storage.data.has(PROGRESS_KEY)).toBe(false)
    expect(storage.data.has(PREVIEW_PROGRESS_KEY)).toBe(true)
  })
})

describe('subscribe', () => {
  it('thông báo khi state đổi và dừng sau khi huỷ đăng ký', () => {
    const store = open(makeStorage())
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    send(store, 'INSERT_COIN')
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    send(store, 'DROP_CAPSULE')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('hành động không hợp lệ không thông báo và giữ nguyên tham chiếu state', () => {
    const store = open(makeStorage())
    const before = store.getState()
    const listener = vi.fn()
    store.subscribe(listener)
    send(store, 'OPEN_CAPSULE', 'DROP_CAPSULE', 'FINALE_COMPLETE', 'CLOSE_ALBUM')
    expect(listener).not.toHaveBeenCalled()
    expect(store.getState()).toBe(before)
  })

  it('getState ổn định giữa hai lần gọi khi chưa có thay đổi', () => {
    const store = open(makeStorage())
    expect(store.getState()).toBe(store.getState())
  })

  it('listener huỷ đăng ký trong lúc nghe không làm hỏng vòng thông báo', () => {
    const store = open(makeStorage())
    const second = vi.fn()
    const unsubscribeFirst = store.subscribe(() => unsubscribeFirst())
    store.subscribe(second)
    send(store, 'INSERT_COIN')
    expect(second).toHaveBeenCalledTimes(1)
  })
})

describe('số capsule không cố định', () => {
  it.each([3, 10])('khôi phục đúng với %i capsule', (n) => {
    const c = makeContent(n)
    const storage = makeStorage()
    const store = open(storage, {}, c)
    send(store, 'INSERT_COIN')
    for (let i = 0; i < n - 2; i++) send(store, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    send(store, 'DROP_CAPSULE')
    const s = open(storage, {}, c).getState()
    expect(s.screen).toBe('PLAY')
    expect(s.openedIds).toHaveLength(n - 2)
    expect(s.trayId).toBe(c.capsules[n - 2].id)
  })

  it('dữ liệu lưu của nội dung cũ (10 capsule) bị bỏ qua khi nội dung giờ chỉ còn 3', () => {
    const storage = makeStorage()
    const old = makeContent(10)
    const store = open(storage, {}, old)
    send(store, 'INSERT_COIN')
    for (let i = 0; i < 5; i++) send(store, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    const s = open(storage, {}, makeContent(3)).getState()
    expect(s).toEqual(createInitialState(true))
  })
})
