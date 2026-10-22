// Máy trạng thái thuần của toàn bộ luồng: không phụ thuộc React, không đụng storage.
// Hành động không hợp lệ trả lại đúng state cũ (cùng tham chiếu) và không ném lỗi.
import type { Capsule, GachaContent } from '../content/types'
import { PROGRESS_VERSION, type SavedProgress } from './progress-storage'

export type Screen = 'COUNTDOWN' | 'INTRO' | 'PLAY' | 'FINALE' | 'ALBUM'

export type GameState = {
  screen: Screen
  coinInserted: boolean
  /** Id capsule đã mở, theo thứ tự mở. */
  openedIds: readonly string[]
  /** Capsule đã rơi vào khay, chưa mở. */
  trayId: string | null
  finaleDone: boolean
  /** Màn trước khi mở album từ PLAY; null khi album là đích cuối (sau finale). Không được lưu. */
  albumReturn: Screen | null
}

export type GameAction =
  | { type: 'UNLOCKED' }
  | { type: 'INSERT_COIN' }
  | { type: 'DROP_CAPSULE' }
  | { type: 'OPEN_CAPSULE' }
  | { type: 'FINALE_COMPLETE' }
  | { type: 'REPLAY_FINALE' }
  | { type: 'OPEN_ALBUM' }
  | { type: 'CLOSE_ALBUM' }
  | { type: 'RESET' }

/** Các hành động kết thúc ở điểm ổn định, cần lưu tiến trình (RESET thì xoá). */
export const PERSISTING_ACTIONS: readonly GameAction['type'][] = [
  'INSERT_COIN',
  'DROP_CAPSULE',
  'OPEN_CAPSULE',
  'FINALE_COMPLETE',
]

export function createInitialState(unlocked: boolean): GameState {
  return {
    screen: unlocked ? 'INTRO' : 'COUNTDOWN',
    coinInserted: false,
    openedIds: [],
    trayId: null,
    finaleDone: false,
    albumReturn: null,
  }
}

/** Dựng state từ tiến trình đã được parseProgress kiểm tra. Màn hình được suy ra. */
export function restoreState(content: GachaContent, saved: SavedProgress): GameState {
  const goldId = content.capsules.find((c) => c.tier === 'gold')?.id
  const goldOpened = goldId !== undefined && saved.openedIds.includes(goldId)
  let screen: Screen = 'INTRO'
  if (saved.finaleDone) screen = 'ALBUM'
  else if (goldOpened) screen = 'FINALE'
  else if (saved.coinInserted) screen = 'PLAY'
  return {
    screen,
    coinInserted: saved.coinInserted,
    openedIds: [...saved.openedIds],
    trayId: saved.trayId,
    finaleDone: saved.finaleDone,
    albumReturn: null,
  }
}

export function toSavedProgress(state: GameState): SavedProgress {
  return {
    v: PROGRESS_VERSION,
    coinInserted: state.coinInserted,
    openedIds: [...state.openedIds],
    trayId: state.trayId,
    finaleDone: state.finaleDone,
  }
}

function isFreshIntro(state: GameState): boolean {
  return (
    state.screen === 'INTRO' &&
    !state.coinInserted &&
    state.openedIds.length === 0 &&
    state.trayId === null &&
    !state.finaleDone &&
    state.albumReturn === null
  )
}

export function reduce(content: GachaContent, state: GameState, action: GameAction): GameState {
  const capsules = content.capsules
  switch (action.type) {
    case 'UNLOCKED':
      return state.screen === 'COUNTDOWN' ? { ...state, screen: 'INTRO' } : state

    case 'INSERT_COIN':
      return state.screen === 'INTRO' ? { ...state, screen: 'PLAY', coinInserted: true } : state

    case 'DROP_CAPSULE': {
      if (state.screen !== 'PLAY' || state.trayId !== null) return state
      // Capsule rơi luôn là capsule kế tiếp theo thứ tự; vì capsule vàng ở cuối nên nó chỉ
      // có thể rơi sau khi mọi capsule trước nó đã mở (BR-02).
      const next = capsules[state.openedIds.length]
      return next ? { ...state, trayId: next.id } : state
    }

    case 'OPEN_CAPSULE': {
      if (state.screen !== 'PLAY' || state.trayId === null) return state
      const tray = capsules.find((c) => c.id === state.trayId)
      if (!tray) return state
      return {
        ...state,
        screen: tray.tier === 'gold' ? 'FINALE' : 'PLAY',
        openedIds: [...state.openedIds, tray.id],
        trayId: null,
      }
    }

    case 'FINALE_COMPLETE':
      return state.screen === 'FINALE'
        ? { ...state, screen: 'ALBUM', finaleDone: true, albumReturn: null }
        : state

    case 'REPLAY_FINALE':
      // Chỉ xem lại được khi đã xong finale; album mở giữa chừng không được nhảy sang finale
      return state.screen === 'ALBUM' && state.finaleDone
        ? { ...state, screen: 'FINALE', albumReturn: null }
        : state

    case 'OPEN_ALBUM':
      return state.screen === 'PLAY' ? { ...state, screen: 'ALBUM', albumReturn: 'PLAY' } : state

    case 'CLOSE_ALBUM':
      return state.screen === 'ALBUM' && state.albumReturn !== null
        ? { ...state, screen: state.albumReturn, albumReturn: null }
        : state

    case 'RESET':
      // Không cho RESET vượt qua màn đếm ngược
      if (state.screen === 'COUNTDOWN') return state
      return isFreshIntro(state) ? state : createInitialState(true)

    default:
      return state
  }
}

// ---- Selector ----

export function getProgress(
  content: GachaContent,
  state: GameState,
): { opened: number; total: number } {
  return { opened: state.openedIds.length, total: content.capsules.length }
}

/** Capsule kế tiếp chưa rơi (không tính capsule đang nằm trong khay); null nếu đã hết. */
export function getNextCapsule(content: GachaContent, state: GameState): Capsule | null {
  const index = state.openedIds.length + (state.trayId === null ? 0 : 1)
  return content.capsules[index] ?? null
}

function goldIndexOf(content: GachaContent): number {
  return content.capsules.findIndex((c) => c.tier === 'gold')
}

/** Mọi capsule trước capsule vàng đã mở (FR-15, BR-02). */
export function isGoldAvailable(content: GachaContent, state: GameState): boolean {
  const goldIndex = goldIndexOf(content)
  return goldIndex >= 0 && state.openedIds.length >= goldIndex
}

/**
 * Số lần quay còn lại để chắc chắn ra capsule vàng, tính cả lần quay ra chính nó
 * (cho dòng pity). Bằng 0 khi capsule vàng đã rơi hoặc đã mở.
 */
export function getSpinsUntilGold(content: GachaContent, state: GameState): number {
  const goldIndex = goldIndexOf(content)
  if (goldIndex < 0) return 0
  const dropped = state.openedIds.length + (state.trayId === null ? 0 : 1)
  return Math.max(0, goldIndex + 1 - dropped)
}

export function canDrop(content: GachaContent, state: GameState): boolean {
  return (
    state.screen === 'PLAY' &&
    state.trayId === null &&
    state.openedIds.length < content.capsules.length
  )
}

export function canOpen(state: GameState): boolean {
  return state.screen === 'PLAY' && state.trayId !== null
}

export type AlbumSlot = { capsule: Capsule; opened: boolean }

/** Mỗi capsule một ô theo thứ tự cấu hình; ô chưa mở được UI vẽ thành bóng mờ. */
export function getAlbumSlots(content: GachaContent, state: GameState): AlbumSlot[] {
  const opened = new Set(state.openedIds)
  return content.capsules.map((capsule) => ({ capsule, opened: opened.has(capsule.id) }))
}
