import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TYPEWRITER,
  allVisible,
  splitGraphemes,
  totalDuration,
  visibleCounts,
} from './typewriter'

const opts = { charMs: 10, paragraphPauseMs: 100 }

describe('splitGraphemes', () => {
  it('không chặt đôi chữ có dấu', () => {
    expect(splitGraphemes('Thương')).toEqual(['T', 'h', 'ư', 'ơ', 'n', 'g'])
  })

  it('chữ gồm ký tự gốc và dấu rời vẫn là một ký tự', () => {
    // "ệ" viết dạng tổ hợp: e + dấu mũ + dấu nặng
    expect(splitGraphemes('ệ')).toHaveLength(1)
  })

  it('chuỗi rỗng cho mảng rỗng', () => {
    expect(splitGraphemes('')).toEqual([])
  })
})

describe('visibleCounts', () => {
  it('chưa trôi qua thời gian nào thì chưa hiện gì', () => {
    const frame = visibleCounts([5, 5], 0, opts)
    expect(frame.counts).toEqual([0, 0])
    expect(frame.activeIndex).toBe(0)
    expect(frame.done).toBe(false)
  })

  it('gõ theo tốc độ từng ký tự', () => {
    expect(visibleCounts([5, 5], 25, opts).counts).toEqual([2, 0])
  })

  it('hết đoạn đầu thì nghỉ rồi mới sang đoạn sau', () => {
    const resting = visibleCounts([5, 5], 50 + 40, opts)
    expect(resting.counts).toEqual([5, 0])
    expect(resting.activeIndex).toBe(1)
    const typing = visibleCounts([5, 5], 50 + 100 + 30, opts)
    expect(typing.counts).toEqual([5, 3])
  })

  it('hết toàn bộ thì done và đủ ký tự', () => {
    const frame = visibleCounts([5, 5], totalDuration([5, 5], opts), opts)
    expect(frame.counts).toEqual([5, 5])
    expect(frame.done).toBe(true)
    expect(visibleCounts([5, 5], 99999, opts).done).toBe(true)
  })

  it('không có đoạn nào thì done ngay', () => {
    expect(visibleCounts([], 0, opts).done).toBe(true)
  })

  it('đoạn rỗng không làm kẹt', () => {
    const frame = visibleCounts([0, 3], 10 + 100 + 31, opts)
    expect(frame.counts).toEqual([0, 3])
    expect(frame.done).toBe(true)
  })

  it('thời gian âm coi như 0', () => {
    expect(visibleCounts([3], -50, opts).counts).toEqual([0])
  })
})

describe('totalDuration và allVisible', () => {
  it('cộng thời gian gõ và các lần nghỉ', () => {
    expect(totalDuration([5, 5], opts)).toBe(50 + 50 + 100)
    expect(totalDuration([], opts)).toBe(0)
  })

  it('bức thư dài khoảng nửa phút đến một phút với tốc độ mặc định', () => {
    const letterLike = [10, 40, 150, 70, 80, 270, 260, 120, 25, 19]
    const seconds = totalDuration(letterLike, DEFAULT_TYPEWRITER) / 1000
    expect(seconds).toBeGreaterThan(20)
    expect(seconds).toBeLessThan(75)
  })

  it('allVisible hiện đủ ngay', () => {
    expect(allVisible([3, 4])).toEqual({ counts: [3, 4], activeIndex: 1, done: true })
  })
})
