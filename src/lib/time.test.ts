import { describe, expect, it, vi } from 'vitest'
import {
  POLL_INTERVAL_MS,
  UNLOCK_AT_ISO,
  UNLOCK_AT_MS,
  getRemaining,
  hasPreviewParam,
  isUnlocked,
  watchUnlock,
} from './time'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Đồng hồ và bộ hẹn giờ giả: chạy các timer theo thứ tự thời gian khi tua đồng hồ.
function createFakeClock(startMs: number) {
  let current = startMs
  let nextId = 0
  const timers = new Map<number, { at: number; callback: () => void }>()
  const delays: number[] = []

  const runDue = () => {
    for (;;) {
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= current)
        .sort((a, b) => a[1].at - b[1].at)[0]
      if (!due) return
      timers.delete(due[0])
      due[1].callback()
    }
  }

  return {
    now: () => current,
    setTimer: (callback: () => void, delayMs: number) => {
      const id = nextId++
      delays.push(delayMs)
      timers.set(id, { at: current + delayMs, callback })
      return id
    },
    clearTimer: (handle: unknown) => {
      timers.delete(handle as number)
    },
    // Tua từng bước nhỏ, mỗi bước chạy các timer đã đến hạn.
    advance: (ms: number, step = 100) => {
      const end = current + ms
      while (current < end) {
        current = Math.min(end, current + step)
        runDue()
      }
    },
    // Giả lập tab ngủ: đồng hồ nhảy một đoạn dài rồi mới chạy các timer quá hạn.
    jump: (ms: number) => {
      current += ms
      runDue()
    },
    pending: () => timers.size,
    delays,
  }
}

describe('hằng mốc mở khoá', () => {
  it('là thời điểm tuyệt đối 17:00 UTC ngày 26/10/2026, không phụ thuộc múi giờ máy', () => {
    expect(UNLOCK_AT_ISO).toBe('2026-10-27T00:00:00+07:00')
    expect(UNLOCK_AT_MS).toBe(Date.parse('2026-10-26T17:00:00Z'))
    expect(UNLOCK_AT_MS).toBe(1793034000000)
  })
})

describe('getRemaining', () => {
  it('trước mốc: tách đúng ngày, giờ, phút, giây và chưa mở khoá', () => {
    const now = UNLOCK_AT_MS - (5 * DAY + 4 * HOUR + 3 * MINUTE + 2 * SECOND)
    expect(getRemaining(now)).toEqual({
      totalMs: 5 * DAY + 4 * HOUR + 3 * MINUTE + 2 * SECOND,
      days: 5,
      hours: 4,
      minutes: 3,
      seconds: 2,
      unlocked: false,
    })
  })

  it('đúng mốc: mở khoá và mọi thành phần bằng 0', () => {
    expect(getRemaining(UNLOCK_AT_MS)).toEqual({
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      unlocked: true,
    })
  })

  it('sau mốc: vẫn mở khoá, totalMs không âm', () => {
    const result = getRemaining(UNLOCK_AT_MS + 3 * DAY + 123)
    expect(result).toEqual({
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      unlocked: true,
    })
  })

  it('giây làm tròn lên: còn 1ms đến 1000ms vẫn hiển thị 1 giây và chưa mở khoá', () => {
    for (const leftMs of [1, 500, 999, 1000]) {
      const result = getRemaining(UNLOCK_AT_MS - leftMs)
      expect(result.seconds).toBe(1)
      expect(result.minutes + result.hours + result.days).toBe(0)
      expect(result.unlocked).toBe(false)
      expect(result.totalMs).toBe(leftMs)
    }
  })

  it('còn 1001ms thì hiển thị 2 giây (làm tròn lên nhất quán)', () => {
    expect(getRemaining(UNLOCK_AT_MS - 1001).seconds).toBe(2)
  })

  it('chỉ hiển thị toàn 0 khi đã mở khoá', () => {
    for (const leftMs of [-5, 0, 1, 999, 1000, 59 * SECOND, 60 * SECOND, DAY]) {
      const r = getRemaining(UNLOCK_AT_MS - leftMs)
      const allZero = r.days + r.hours + r.minutes + r.seconds === 0
      expect(allZero).toBe(r.unlocked)
    }
  })

  it('sang phút, giờ, ngày đúng ở các biên', () => {
    expect(getRemaining(UNLOCK_AT_MS - 60 * SECOND)).toMatchObject({ minutes: 1, seconds: 0 })
    expect(getRemaining(UNLOCK_AT_MS - 59 * SECOND)).toMatchObject({ minutes: 0, seconds: 59 })
    expect(getRemaining(UNLOCK_AT_MS - HOUR)).toMatchObject({ hours: 1, minutes: 0, seconds: 0 })
    expect(getRemaining(UNLOCK_AT_MS - DAY)).toMatchObject({ days: 1, hours: 0, seconds: 0 })
    expect(getRemaining(UNLOCK_AT_MS - (DAY - 1))).toMatchObject({
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    })
  })

  it('nhận mốc tuỳ chỉnh', () => {
    expect(getRemaining(1000, 4000)).toMatchObject({ seconds: 3, unlocked: false })
    expect(getRemaining(4000, 4000).unlocked).toBe(true)
  })
})

describe('hasPreviewParam', () => {
  it('nhận ?preview có hoặc không có giá trị', () => {
    expect(hasPreviewParam('?preview')).toBe(true)
    expect(hasPreviewParam('?preview=1')).toBe(true)
    expect(hasPreviewParam('?preview=')).toBe(true)
    expect(hasPreviewParam('preview')).toBe(true)
  })

  it('không phân biệt hoa thường tên tham số', () => {
    expect(hasPreviewParam('?Preview')).toBe(true)
    expect(hasPreviewParam('?PREVIEW=true')).toBe(true)
  })

  it('chịu được chuỗi rỗng và dấu ? đơn độc', () => {
    expect(hasPreviewParam('')).toBe(false)
    expect(hasPreviewParam('?')).toBe(false)
  })

  it('đọc đúng khi có nhiều tham số', () => {
    expect(hasPreviewParam('?a=1&preview&b=2')).toBe(true)
    expect(hasPreviewParam('?a=1&b=preview')).toBe(false)
    expect(hasPreviewParam('?previews=1&xpreview')).toBe(false)
    expect(hasPreviewParam('?a=1&b=2')).toBe(false)
  })
})

describe('isUnlocked', () => {
  it('chưa qua mốc và không preview thì chưa mở khoá', () => {
    expect(isUnlocked(UNLOCK_AT_MS - 1, { preview: false })).toBe(false)
    expect(isUnlocked(UNLOCK_AT_MS - 1)).toBe(false)
  })

  it('đúng mốc hoặc sau mốc thì mở khoá', () => {
    expect(isUnlocked(UNLOCK_AT_MS, { preview: false })).toBe(true)
    expect(isUnlocked(UNLOCK_AT_MS + 1, { preview: false })).toBe(true)
  })

  it('có preview thì coi như đã mở khoá, kể cả rất sớm', () => {
    expect(isUnlocked(0, { preview: true })).toBe(true)
    expect(isUnlocked(UNLOCK_AT_MS - DAY, { preview: true })).toBe(true)
  })

  it('nhận mốc tuỳ chỉnh', () => {
    expect(isUnlocked(999, { preview: false }, 1000)).toBe(false)
    expect(isUnlocked(1000, { preview: false }, 1000)).toBe(true)
  })
})

describe('watchUnlock', () => {
  const start = (nowMs: number, extra: { preview?: boolean; unlockAtMs?: number } = {}) => {
    const clock = createFakeClock(nowMs)
    const onUnlock = vi.fn()
    const cancel = watchUnlock({
      now: clock.now,
      onUnlock,
      setTimer: clock.setTimer,
      clearTimer: clock.clearTimer,
      ...extra,
    })
    return { clock, onUnlock, cancel }
  }

  it('trước mốc: chưa gọi, tới mốc gọi đúng một lần và đúng lúc', () => {
    const { clock, onUnlock } = start(UNLOCK_AT_MS - 3500)
    clock.advance(3499)
    expect(onUnlock).not.toHaveBeenCalled()
    clock.advance(1)
    expect(onUnlock).toHaveBeenCalledTimes(1)
    clock.advance(10 * SECOND)
    expect(onUnlock).toHaveBeenCalledTimes(1)
    expect(clock.pending()).toBe(0)
  })

  it('đã qua mốc sẵn: gọi một lần, bất đồng bộ (chưa gọi trước khi timer chạy)', () => {
    const { clock, onUnlock } = start(UNLOCK_AT_MS + SECOND)
    expect(onUnlock).not.toHaveBeenCalled()
    clock.advance(0)
    clock.jump(0)
    expect(onUnlock).toHaveBeenCalledTimes(1)
    clock.advance(5 * SECOND)
    expect(onUnlock).toHaveBeenCalledTimes(1)
  })

  it('có preview: gọi một lần dù còn xa mốc, không đặt timer dài', () => {
    const { clock, onUnlock } = start(UNLOCK_AT_MS - 30 * DAY, { preview: true })
    expect(onUnlock).not.toHaveBeenCalled()
    clock.jump(0)
    expect(onUnlock).toHaveBeenCalledTimes(1)
    expect(clock.pending()).toBe(0)
    expect(Math.max(...clock.delays)).toBe(0)
  })

  it('huỷ trước khi tới mốc thì không gọi và không còn timer treo', () => {
    const { clock, onUnlock, cancel } = start(UNLOCK_AT_MS - 5 * SECOND)
    clock.advance(2 * SECOND)
    cancel()
    expect(clock.pending()).toBe(0)
    clock.advance(10 * SECOND)
    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('huỷ ngay sau khi gọi (kể cả đã mở khoá sẵn hoặc preview) thì không gọi', () => {
    const open = start(UNLOCK_AT_MS + SECOND)
    open.cancel()
    open.clock.advance(SECOND)
    expect(open.onUnlock).not.toHaveBeenCalled()

    const previewed = start(0, { preview: true })
    previewed.cancel()
    previewed.clock.advance(SECOND)
    expect(previewed.onUnlock).not.toHaveBeenCalled()
  })

  it('gọi hàm huỷ nhiều lần, hoặc huỷ sau khi đã mở khoá, không lỗi và không gọi thêm', () => {
    const { clock, onUnlock, cancel } = start(UNLOCK_AT_MS - SECOND)
    clock.advance(SECOND)
    expect(onUnlock).toHaveBeenCalledTimes(1)
    cancel()
    cancel()
    clock.advance(5 * SECOND)
    expect(onUnlock).toHaveBeenCalledTimes(1)
  })

  it('bị kích hoạt nhiều lần (nhiều timer đến hạn cùng lúc) vẫn chỉ gọi một lần', () => {
    const clock = createFakeClock(UNLOCK_AT_MS - 10 * SECOND)
    const onUnlock = vi.fn()
    const callbacks: Array<() => void> = []
    watchUnlock({
      now: clock.now,
      onUnlock,
      setTimer: (callback) => {
        callbacks.push(callback)
        return callbacks.length
      },
      clearTimer: () => {},
    })
    clock.jump(20 * SECOND)
    // Mô phỏng timer cũ và mới cùng chạy sau mốc.
    callbacks[0]()
    callbacks[0]()
    callbacks.slice(1).forEach((callback) => callback())
    callbacks.forEach((callback) => callback())
    expect(onUnlock).toHaveBeenCalledTimes(1)
  })

  it('xa mốc hàng chục ngày: không bao giờ đặt độ trễ vượt chu kỳ ngắn', () => {
    const { clock, onUnlock } = start(UNLOCK_AT_MS - 40 * DAY)
    clock.advance(10 * SECOND)
    expect(Math.max(...clock.delays)).toBeLessThanOrEqual(POLL_INTERVAL_MS)
    // 2^31 - 1 ms là giới hạn của setTimeout
    expect(Math.max(...clock.delays)).toBeLessThan(2 ** 31 - 1)
    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('tab ngủ: timer trễ rất lâu vẫn mở khoá đúng một lần ở nhịp kế tiếp', () => {
    const { clock, onUnlock } = start(UNLOCK_AT_MS - 3 * DAY)
    clock.advance(5 * SECOND)
    expect(onUnlock).not.toHaveBeenCalled()
    clock.jump(3 * DAY + HOUR)
    expect(onUnlock).toHaveBeenCalledTimes(1)
    clock.advance(10 * SECOND)
    expect(onUnlock).toHaveBeenCalledTimes(1)
  })

  it('tab ngủ nhưng chưa tới mốc: tính lại từ đồng hồ và tiếp tục chờ', () => {
    const { clock, onUnlock } = start(UNLOCK_AT_MS - 10 * DAY)
    clock.jump(4 * DAY)
    expect(onUnlock).not.toHaveBeenCalled()
    expect(clock.pending()).toBe(1)
    clock.advance(6 * DAY - SECOND, SECOND)
    expect(onUnlock).not.toHaveBeenCalled()
    clock.advance(SECOND, SECOND)
    expect(onUnlock).toHaveBeenCalledTimes(1)
  })

  it('nhận mốc tuỳ chỉnh', () => {
    const { clock, onUnlock } = start(0, { unlockAtMs: 2500 })
    clock.advance(2499)
    expect(onUnlock).not.toHaveBeenCalled()
    clock.advance(1)
    expect(onUnlock).toHaveBeenCalledTimes(1)
  })

  it('dùng setTimeout thật khi không tiêm bộ hẹn giờ', () => {
    vi.useFakeTimers()
    try {
      let nowMs = UNLOCK_AT_MS - 2 * SECOND
      const onUnlock = vi.fn()
      const cancel = watchUnlock({ now: () => nowMs, onUnlock })
      vi.advanceTimersByTime(1000)
      nowMs += 1000
      expect(onUnlock).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1000)
      nowMs += 1000
      vi.advanceTimersByTime(1000)
      expect(onUnlock).toHaveBeenCalledTimes(1)
      cancel()
    } finally {
      vi.useRealTimers()
    }
  })
})
