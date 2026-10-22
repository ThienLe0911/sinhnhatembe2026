import { describe, expect, it } from 'vitest'
import {
  PREVIEW_PROGRESS_KEY,
  PROGRESS_KEY,
  clearProgress,
  loadProgress,
  parseProgress,
  progressKey,
  saveProgress,
  type SavedProgress,
} from './progress-storage'
import { makeContent, makeStorage, makeThrowingStorage } from './test-fixtures'

const content = makeContent(4) // c1, c2, c3, gold

function saved(patch: Partial<Record<keyof SavedProgress, unknown>> = {}): string {
  return JSON.stringify({
    v: 1,
    coinInserted: true,
    openedIds: ['c1', 'c2'],
    trayId: 'c3',
    finaleDone: false,
    ...patch,
  })
}

describe('khoá lưu', () => {
  it('khoá thật và khoá xem trước khác nhau', () => {
    expect(PROGRESS_KEY).toBe('gacha:progress')
    expect(PREVIEW_PROGRESS_KEY).toBe('gacha:progress:preview')
    expect(progressKey(false)).toBe(PROGRESS_KEY)
    expect(progressKey(true)).toBe(PREVIEW_PROGRESS_KEY)
  })
})

describe('parseProgress: dữ liệu hợp lệ', () => {
  it('chấp nhận dữ liệu đúng', () => {
    expect(parseProgress(saved(), content)).toEqual({
      v: 1,
      coinInserted: true,
      openedIds: ['c1', 'c2'],
      trayId: 'c3',
      finaleDone: false,
    })
  })

  it('chấp nhận khay trống và chưa mở capsule nào sau khi nạp xu', () => {
    expect(parseProgress(saved({ openedIds: [], trayId: null }), content)).not.toBeNull()
  })

  it('chấp nhận chưa nạp xu', () => {
    const r = parseProgress(saved({ coinInserted: false, openedIds: [], trayId: null }), content)
    expect(r?.coinInserted).toBe(false)
  })

  it('chấp nhận capsule vàng đang nằm trong khay', () => {
    expect(
      parseProgress(saved({ openedIds: ['c1', 'c2', 'c3'], trayId: 'gold' }), content),
    ).not.toBeNull()
  })

  it('chấp nhận đã xong finale', () => {
    const raw = saved({ openedIds: ['c1', 'c2', 'c3', 'gold'], trayId: null, finaleDone: true })
    expect(parseProgress(raw, content)?.finaleDone).toBe(true)
  })
})

describe('parseProgress: dữ liệu không hợp lệ bị bỏ qua', () => {
  it('JSON hỏng', () => {
    expect(parseProgress('{không phải json', content)).toBeNull()
  })

  it('không có dữ liệu', () => {
    expect(parseProgress(null, content)).toBeNull()
    expect(parseProgress(undefined, content)).toBeNull()
  })

  it('không phải đối tượng', () => {
    expect(parseProgress('null', content)).toBeNull()
    expect(parseProgress('[]', content)).toBeNull()
    expect(parseProgress('42', content)).toBeNull()
  })

  it('sai phiên bản', () => {
    expect(parseProgress(saved({ v: 2 }), content)).toBeNull()
    expect(parseProgress(saved({ v: undefined }), content)).toBeNull()
  })

  it('id không còn tồn tại', () => {
    expect(parseProgress(saved({ openedIds: ['c1', 'cu-xoa'], trayId: null }), content)).toBeNull()
    expect(parseProgress(saved({ trayId: 'cu-xoa' }), content)).toBeNull()
  })

  it('danh sách đã mở sai thứ tự', () => {
    expect(parseProgress(saved({ openedIds: ['c2', 'c1'], trayId: 'c3' }), content)).toBeNull()
  })

  it('danh sách đã mở không phải đúng k capsule đầu (bỏ cách quãng)', () => {
    expect(parseProgress(saved({ openedIds: ['c1', 'c3'], trayId: null }), content)).toBeNull()
  })

  it('danh sách đã mở có trùng lặp hoặc dài hơn số capsule', () => {
    expect(parseProgress(saved({ openedIds: ['c1', 'c1'], trayId: null }), content)).toBeNull()
    const tooMany = ['c1', 'c2', 'c3', 'gold', 'c1']
    expect(parseProgress(saved({ openedIds: tooMany, trayId: null }), content)).toBeNull()
  })

  it('capsule vàng đã mở nhưng thiếu các capsule trước', () => {
    expect(parseProgress(saved({ openedIds: ['gold'], trayId: null }), content)).toBeNull()
  })

  it('id khay không phải capsule kế tiếp', () => {
    expect(parseProgress(saved({ trayId: 'gold' }), content)).toBeNull()
    expect(parseProgress(saved({ trayId: 'c1' }), content)).toBeNull()
  })

  it('khay còn capsule khi đã mở hết', () => {
    const all = ['c1', 'c2', 'c3', 'gold']
    expect(parseProgress(saved({ openedIds: all, trayId: 'gold' }), content)).toBeNull()
  })

  it('finaleDone nhưng chưa mở hết', () => {
    expect(parseProgress(saved({ finaleDone: true, trayId: null }), content)).toBeNull()
  })

  it('finaleDone nhưng khay còn capsule hoặc chưa nạp xu', () => {
    const all = ['c1', 'c2', 'c3', 'gold']
    expect(
      parseProgress(
        saved({ openedIds: all, finaleDone: true, coinInserted: false, trayId: null }),
        content,
      ),
    ).toBeNull()
  })

  it('đã có capsule rơi mà chưa nạp xu', () => {
    expect(parseProgress(saved({ coinInserted: false }), content)).toBeNull()
    expect(
      parseProgress(saved({ coinInserted: false, openedIds: [], trayId: 'c1' }), content),
    ).toBeNull()
  })

  it('sai kiểu dữ liệu', () => {
    expect(parseProgress(saved({ coinInserted: 'true' }), content)).toBeNull()
    expect(parseProgress(saved({ finaleDone: 0 }), content)).toBeNull()
    expect(parseProgress(saved({ openedIds: 'c1' }), content)).toBeNull()
    expect(parseProgress(saved({ openedIds: ['c1', 2], trayId: null }), content)).toBeNull()
    expect(parseProgress(saved({ trayId: 3 }), content)).toBeNull()
    expect(parseProgress(saved({ trayId: undefined }), content)).toBeNull()
  })
})

describe('đọc, ghi, xoá qua storage', () => {
  it('ghi rồi đọc lại đúng', () => {
    const storage = makeStorage()
    const progress: SavedProgress = {
      v: 1,
      coinInserted: true,
      openedIds: ['c1'],
      trayId: 'c2',
      finaleDone: false,
    }
    expect(saveProgress(storage, PROGRESS_KEY, progress)).toBe(true)
    expect(loadProgress(storage, PROGRESS_KEY, content)).toEqual(progress)
  })

  it('xoá thì đọc lại ra null', () => {
    const storage = makeStorage({ [PROGRESS_KEY]: saved() })
    expect(clearProgress(storage, PROGRESS_KEY)).toBe(true)
    expect(loadProgress(storage, PROGRESS_KEY, content)).toBeNull()
  })

  it('storage ném lỗi: không ném ra ngoài, báo thất bại', () => {
    const storage = makeThrowingStorage()
    const progress = parseProgress(saved(), content)!
    expect(loadProgress(storage, PROGRESS_KEY, content)).toBeNull()
    expect(saveProgress(storage, PROGRESS_KEY, progress)).toBe(false)
    expect(clearProgress(storage, PROGRESS_KEY)).toBe(false)
  })

  it('không có storage: không ném lỗi', () => {
    const progress = parseProgress(saved(), content)!
    expect(loadProgress(null, PROGRESS_KEY, content)).toBeNull()
    expect(saveProgress(null, PROGRESS_KEY, progress)).toBe(false)
    expect(clearProgress(null, PROGRESS_KEY)).toBe(false)
  })
})
