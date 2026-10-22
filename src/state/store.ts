// Store nhỏ bọc reducer: getState, subscribe, dispatch (dùng được với useSyncExternalStore).
// Lưu tiến trình ở các điểm ổn định; storage lỗi hoặc không có thì vẫn chạy bằng bộ nhớ trong.
import type { GachaContent } from '../content/types'
import {
  PERSISTING_ACTIONS,
  createInitialState,
  reduce,
  restoreState,
  toSavedProgress,
  type GameAction,
  type GameState,
} from './game'
import {
  clearProgress,
  loadProgress,
  progressKey,
  saveProgress,
  type ProgressStorage,
} from './progress-storage'

export type GameStoreOptions = {
  content: GachaContent
  storage: ProgressStorage | null
  /** Đã qua mốc mở khoá hoặc đang ở chế độ xem trước (tính ở nơi gọi, xem src/lib/time.ts). */
  unlocked: boolean
  preview: boolean
}

export type GameStore = {
  /** Trả về cùng một tham chiếu cho tới khi state đổi (đúng yêu cầu của useSyncExternalStore). */
  getState(): GameState
  dispatch(action: GameAction): void
  subscribe(listener: () => void): () => void
}

export function createGameStore(options: GameStoreOptions): GameStore {
  const { content, storage, unlocked, preview } = options
  const key = progressKey(preview)

  // Chưa mở khoá: luôn COUNTDOWN, không đọc tiến trình (màn này suy ra từ thời gian)
  const saved = unlocked ? loadProgress(storage, key, content) : null
  let state: GameState = saved ? restoreState(content, saved) : createInitialState(unlocked)
  const listeners = new Set<() => void>()

  return {
    getState: () => state,

    dispatch(action) {
      const next = reduce(content, state, action)

      // RESET luôn xoá tiến trình đã lưu, kể cả khi state đã ở INTRO sạch (không đổi tham chiếu)
      if (action.type === 'RESET' && next.screen === 'INTRO') clearProgress(storage, key)

      if (next === state) return
      state = next

      if (PERSISTING_ACTIONS.includes(action.type)) {
        saveProgress(storage, key, toSavedProgress(next))
      }

      // Sao chép để listener huỷ đăng ký trong lúc nghe không làm lệch vòng lặp
      for (const listener of [...listeners]) listener()
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
