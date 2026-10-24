// Luồng ba bước của trang mời (FR-I14): giới thiệu → hé lộ → thiệp mời. Hàm thuần, có test.
export type FlowStep = 'intro' | 'reveal' | 'invite'

export interface FlowState {
  step: FlowStep
  /** Ở Trang 2: đã chạm icon bí mật lần 1 chưa. */
  opened: boolean
}

export type FlowAction = 'next' | 'tap' | 'skip'

export const initialFlow: FlowState = { step: 'intro', opened: false }

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  if (state.step === 'invite') return state
  if (action === 'skip') return { step: 'invite', opened: state.opened }
  if (state.step === 'intro') {
    return action === 'next' ? { step: 'reveal', opened: false } : state
  }
  // Trang 2: chạm lần 1 hé lộ, chạm lần 2 sang thiệp mời
  if (action === 'tap') {
    return state.opened ? { step: 'invite', opened: true } : { step: 'reveal', opened: true }
  }
  return state
}

/**
 * Khi phát triển, ?step=reveal hoặc ?step=invite mở thẳng bước đó để xem và thử.
 * Bản phát hành luôn bắt đầu ở Trang 1 (BR-I08).
 */
export function initialFlowFor(search: string, dev: boolean): FlowState {
  if (!dev) return initialFlow
  const step = new URLSearchParams(search).get('step')
  if (step === 'reveal') return { step: 'reveal', opened: false }
  if (step === 'invite') return { step: 'invite', opened: false }
  return initialFlow
}
