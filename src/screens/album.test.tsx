import { describe, expect, it } from 'vitest'
import { content } from '../content/content'
import { createInitialState, getAlbumSlots, reduce, type GameState } from '../state/game'
import { previewText } from './Album'

const play = (state: GameState, ...types: Parameters<typeof reduce>[2]['type'][]) =>
  types.reduce((s, type) => reduce(content, s, { type }), state)

describe('previewText', () => {
  it('voucher lấy lời, lời hứa lấy câu đầu, thẻ ảnh không có chữ xem trước', () => {
    expect(previewText({ kind: 'voucher', text: 'Một ly matcha' })).toBe('Một ly matcha')
    expect(previewText({ kind: 'promise', promises: ['Ăn cá giúp', 'Hai'] })).toBe('Ăn cá giúp')
    expect(previewText({ kind: 'promise', promises: [] })).toBe('')
    expect(previewText({ kind: 'photo', caption: 'x' })).toBe('')
    expect(previewText({ kind: 'finale' })).toBe('')
  })
})

describe('luồng album', () => {
  const started = play(createInitialState(true), 'INSERT_COIN')

  it('album mở giữa chừng quay lại được, và chỉ mở từ màn chơi', () => {
    const inAlbum = play(started, 'OPEN_ALBUM')
    expect(inAlbum.screen).toBe('ALBUM')
    expect(inAlbum.finaleDone).toBe(false)
    expect(play(inAlbum, 'CLOSE_ALBUM').screen).toBe('PLAY')
  })

  it('chưa xong finale thì không xem lại màn thổi nến được', () => {
    const inAlbum = play(started, 'OPEN_ALBUM')
    expect(play(inAlbum, 'REPLAY_FINALE').screen).toBe('ALBUM')
  })

  it('mỗi capsule có một ô trong album, thẻ đã mở đánh dấu opened', () => {
    const afterOne = play(started, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    const slots = getAlbumSlots(content, afterOne)
    expect(slots).toHaveLength(content.capsules.length)
    expect(slots.filter((s) => s.opened)).toHaveLength(1)
    expect(slots[0].opened).toBe(true)
    expect(slots[0].capsule.id).toBe(content.capsules[0].id)
  })

  it('sau finale: xem lại thổi nến giữ nguyên tiến trình, chơi lại thì về đầu', () => {
    let state = started
    for (let i = 0; i < content.capsules.length; i++) {
      state = play(state, 'DROP_CAPSULE', 'OPEN_CAPSULE')
    }
    expect(state.screen).toBe('FINALE')
    state = play(state, 'FINALE_COMPLETE')
    expect(state.screen).toBe('ALBUM')
    expect(state.finaleDone).toBe(true)

    const replay = play(state, 'REPLAY_FINALE')
    expect(replay.screen).toBe('FINALE')
    expect(replay.openedIds).toHaveLength(content.capsules.length)
    expect(replay.finaleDone).toBe(true)

    const reset = play(state, 'RESET')
    expect(reset.screen).toBe('INTRO')
    expect(reset.openedIds).toHaveLength(0)
    expect(reset.finaleDone).toBe(false)
  })
})
