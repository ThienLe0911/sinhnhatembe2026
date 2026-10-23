import { describe, expect, it } from 'vitest'
import { content } from '../content/content'
import { createInitialState, getSpinsUntilGold, reduce } from '../state/game'
import { pityText } from './pity'

describe('pityText', () => {
  it('ẩn khi capsule vàng đã rơi hoặc đã mở', () => {
    expect(pityText(0)).toBe('')
    expect(pityText(-1)).toBe('')
  })

  it('lần quay cuối trước vàng nói rõ chắc chắn ra vàng', () => {
    expect(pityText(1)).toContain('chắc chắn ra capsule vàng')
  })

  it('còn nhiều lần thì nêu đúng số lần', () => {
    expect(pityText(8)).toBe('Còn 8 lần quay nữa là chắc chắn có capsule vàng')
  })

  it('khớp với số lần quay thật của luồng chơi', () => {
    let state = createInitialState(true)
    state = reduce(content, state, { type: 'INSERT_COIN' })
    expect(getSpinsUntilGold(content, state)).toBe(content.capsules.length)
    state = reduce(content, state, { type: 'DROP_CAPSULE' })
    expect(getSpinsUntilGold(content, state)).toBe(content.capsules.length - 1)
  })
})
