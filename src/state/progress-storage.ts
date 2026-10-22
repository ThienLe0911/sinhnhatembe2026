// Lưu và khôi phục tiến trình (FR-24). Không phụ thuộc React.
// Storage được tiêm vào để test; mọi thao tác đều bọc try/catch vì localStorage có thể bị chặn.
import type { GachaContent } from '../content/types'

export const PROGRESS_KEY = 'gacha:progress'
// Chế độ xem trước dùng khoá riêng để các lần chạy thử không làm lẫn tiến trình thật
export const PREVIEW_PROGRESS_KEY = 'gacha:progress:preview'
export const PROGRESS_VERSION = 1

/** Đối tượng giống localStorage; mọi hàm đều có thể ném lỗi. */
export type ProgressStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Phần tiến trình được lưu. Màn hình không lưu mà suy ra khi khôi phục. */
export type SavedProgress = {
  v: typeof PROGRESS_VERSION
  coinInserted: boolean
  /** Id capsule đã mở, theo thứ tự mở. */
  openedIds: string[]
  /** Capsule đã rơi vào khay nhưng chưa mở. */
  trayId: string | null
  finaleDone: boolean
}

export function progressKey(preview: boolean): string {
  return preview ? PREVIEW_PROGRESS_KEY : PROGRESS_KEY
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Kiểm tra chặt dữ liệu đọc ra. Trả về null nếu bất kỳ điều kiện nào sai
 * (JSON hỏng, sai phiên bản, sai kiểu, id lạ, thứ tự sai, mâu thuẫn).
 */
export function parseProgress(
  raw: string | null | undefined,
  content: GachaContent,
): SavedProgress | null {
  if (typeof raw !== 'string') return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data)) return null
  if (data.v !== PROGRESS_VERSION) return null

  const { coinInserted, openedIds, trayId, finaleDone } = data
  if (typeof coinInserted !== 'boolean' || typeof finaleDone !== 'boolean') return null
  if (!Array.isArray(openedIds) || !openedIds.every((id) => typeof id === 'string')) return null
  if (trayId !== null && typeof trayId !== 'string') return null

  const ids = content.capsules.map((c) => c.id)
  const opened = openedIds as string[]
  const k = opened.length

  // Danh sách đã mở phải đúng k capsule đầu theo thứ tự cấu hình (BR-01, BR-02)
  if (k > ids.length || opened.some((id, i) => id !== ids[i])) return null
  // Capsule trong khay phải đúng là capsule kế tiếp
  if (trayId !== null && trayId !== ids[k]) return null
  // Chưa nạp xu thì không thể có capsule nào đã rơi
  if (!coinInserted && (k > 0 || trayId !== null)) return null
  // Finale xong nghĩa là đã mở hết và khay trống
  if (finaleDone && (!coinInserted || k !== ids.length || trayId !== null)) return null

  return { v: PROGRESS_VERSION, coinInserted, openedIds: [...opened], trayId, finaleDone }
}

export function loadProgress(
  storage: ProgressStorage | null,
  key: string,
  content: GachaContent,
): SavedProgress | null {
  if (!storage) return null
  try {
    return parseProgress(storage.getItem(key), content)
  } catch {
    return null
  }
}

/** Trả về false nếu không lưu được; nơi gọi không cần xử lý vì store vẫn chạy bằng bộ nhớ trong. */
export function saveProgress(
  storage: ProgressStorage | null,
  key: string,
  progress: SavedProgress,
): boolean {
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

export function clearProgress(storage: ProgressStorage | null, key: string): boolean {
  if (!storage) return false
  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/** Lấy localStorage của trình duyệt; null nếu không có hoặc bị chặn (truy cập cũng có thể ném). */
export function getBrowserStorage(): ProgressStorage | null {
  try {
    return (globalThis as { localStorage?: ProgressStorage }).localStorage ?? null
  } catch {
    return null
  }
}
