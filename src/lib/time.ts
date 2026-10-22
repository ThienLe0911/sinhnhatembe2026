// Thư viện thời gian thuần: không phụ thuộc React, không tự đọc đồng hồ máy.
// Đồng hồ (nowMs) và bộ hẹn giờ luôn do nơi gọi truyền vào để test được bằng đồng hồ giả.

// Thời điểm tuyệt đối, có kèm độ lệch +07:00 nên đúng ở mọi múi giờ máy (BR-03).
export const UNLOCK_AT_ISO = '2026-10-27T00:00:00+07:00'
export const UNLOCK_AT_MS = Date.parse(UNLOCK_AT_ISO)

// Chu kỳ kiểm tra lại. setTimeout bị giới hạn độ trễ (~24,8 ngày) và có thể trễ khi tab ngủ,
// nên không dùng một timer dài duy nhất mà tính lại từ đồng hồ sau mỗi nhịp ngắn.
export const POLL_INTERVAL_MS = 1000

const SECOND_MS = 1000
const MINUTE_S = 60
const HOUR_S = 60 * MINUTE_S
const DAY_S = 24 * HOUR_S

export type Remaining = {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  unlocked: boolean
}

// Giây được làm tròn LÊN: còn 1ms đến 1000ms thì hiển thị 00:00:01 và chưa mở khoá.
// Đồng hồ chỉ về 00:00:00 khi đã mở khoá thật sự (unlocked = true).
export function getRemaining(nowMs: number, unlockAtMs: number = UNLOCK_AT_MS): Remaining {
  const totalMs = Math.max(0, unlockAtMs - nowMs)
  if (totalMs === 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, unlocked: true }
  }
  let rest = Math.ceil(totalMs / SECOND_MS)
  const days = Math.floor(rest / DAY_S)
  rest -= days * DAY_S
  const hours = Math.floor(rest / HOUR_S)
  rest -= hours * HOUR_S
  const minutes = Math.floor(rest / MINUTE_S)
  const seconds = rest - minutes * MINUTE_S
  return { totalMs, days, hours, minutes, seconds, unlocked: false }
}

// Chỉ cần có tên tham số `preview` (có hoặc không có giá trị, kể cả `preview=0`).
// Đây không phải cơ chế bảo mật (FR-28).
export function hasPreviewParam(search: string): boolean {
  for (const key of new URLSearchParams(search).keys()) {
    if (key.toLowerCase() === 'preview') return true
  }
  return false
}

export function isUnlocked(
  nowMs: number,
  options: { preview?: boolean } = {},
  unlockAtMs: number = UNLOCK_AT_MS,
): boolean {
  return options.preview === true || nowMs >= unlockAtMs
}

export type WatchUnlockOptions = {
  now: () => number
  onUnlock: () => void
  unlockAtMs?: number
  preview?: boolean
  setTimer?: (callback: () => void, delayMs: number) => unknown
  clearTimer?: (handle: unknown) => void
}

// Gọi onUnlock đúng một lần khi tới mốc, rồi trả hàm huỷ.
// Luôn BẤT ĐỒNG BỘ: nếu đã mở khoá sẵn hoặc có preview thì onUnlock vẫn chạy ở nhịp hẹn giờ
// kế tiếp (độ trễ 0), không bao giờ chạy trước khi hàm trả về; nhờ vậy huỷ ngay (ví dụ khi
// effect của React dọn dẹp) sẽ chặn được cuộc gọi.
export function watchUnlock(options: WatchUnlockOptions): () => void {
  const {
    now,
    onUnlock,
    unlockAtMs = UNLOCK_AT_MS,
    preview = false,
    setTimer = (callback, delayMs) => setTimeout(callback, delayMs),
    clearTimer = (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  } = options

  let finished = false
  let handle: unknown
  let scheduled = false

  const tick = () => {
    scheduled = false
    if (finished) return
    const remainingMs = unlockAtMs - now()
    if (preview || remainingMs <= 0) {
      finished = true
      onUnlock()
      return
    }
    handle = setTimer(tick, Math.min(POLL_INTERVAL_MS, remainingMs))
    scheduled = true
  }

  handle = setTimer(tick, 0)
  scheduled = true

  return () => {
    finished = true
    // Handle có thể là 0 ở bộ hẹn giờ giả nên dùng cờ riêng thay vì so sánh với undefined.
    if (scheduled) {
      scheduled = false
      clearTimer(handle)
    }
  }
}
