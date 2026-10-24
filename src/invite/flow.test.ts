import { describe, expect, it } from 'vitest'
import { flowReducer, initialFlow, initialFlowFor, type FlowAction, type FlowState } from './flow'

const run = (actions: FlowAction[], from: FlowState = initialFlow) =>
  actions.reduce(flowReducer, from)

describe('flowReducer (FR-I14, BR-I08)', () => {
  it('bắt đầu ở Trang 1', () => {
    expect(initialFlow).toEqual({ step: 'intro', opened: false })
  })

  it('"Tiếp theo" sang Trang 2, chưa hé lộ', () => {
    expect(run(['next'])).toEqual({ step: 'reveal', opened: false })
  })

  it('chạm lần 1 hé lộ, chạm lần 2 sang thiệp mời', () => {
    expect(run(['next', 'tap'])).toEqual({ step: 'reveal', opened: true })
    expect(run(['next', 'tap', 'tap']).step).toBe('invite')
  })

  it('Trang 1 bỏ qua cú chạm của Trang 2, Trang 2 bỏ qua "Tiếp theo"', () => {
    expect(run(['tap'])).toEqual(initialFlow)
    expect(run(['next', 'next'])).toEqual({ step: 'reveal', opened: false })
  })

  it('"Bỏ qua" ở Trang 1 và Trang 2 tới thẳng thiệp mời', () => {
    expect(run(['skip']).step).toBe('invite')
    expect(run(['next', 'skip']).step).toBe('invite')
    expect(run(['next', 'tap', 'skip']).step).toBe('invite')
  })

  it('đã ở thiệp mời thì không đổi nữa', () => {
    const invite = run(['skip'])
    expect(run(['next', 'tap', 'skip'], invite)).toBe(invite)
  })
})

describe('initialFlowFor', () => {
  it('bản phát hành luôn bắt đầu ở Trang 1, kể cả có ?step', () => {
    expect(initialFlowFor('?step=invite', false)).toEqual(initialFlow)
  })

  it('khi phát triển, ?step mở thẳng bước đó', () => {
    expect(initialFlowFor('?step=reveal', true).step).toBe('reveal')
    expect(initialFlowFor('?step=invite', true).step).toBe('invite')
    expect(initialFlowFor('?step=lung-tung', true)).toEqual(initialFlow)
    expect(initialFlowFor('', true)).toEqual(initialFlow)
  })
})
