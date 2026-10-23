import { describe, expect, it } from 'vitest'
import { content } from '../content/content'
import { cardImageNames, preloadCardMedia } from './preload'

describe('cardImageNames', () => {
  it('lấy đúng ảnh theo từng loại thẻ', () => {
    expect(cardImageNames({ kind: 'photo', image: 'a.webp', caption: '' })).toEqual(['a.webp'])
    expect(cardImageNames({ kind: 'photo', caption: '' })).toEqual([])
    expect(
      cardImageNames({ kind: 'photoPair', images: ['a.webp', 'b.webp'], caption: '' }),
    ).toEqual(['a.webp', 'b.webp'])
    expect(
      cardImageNames({ kind: 'video', video: 'v.mp4', poster: 'p.webp', caption: '' }),
    ).toEqual(['p.webp'])
    expect(cardImageNames({ kind: 'promise', promises: [], fallbackImage: 'f.webp' })).toEqual([
      'f.webp',
    ])
    expect(cardImageNames({ kind: 'voucher', text: 'x' })).toEqual([])
    expect(cardImageNames({ kind: 'finale' })).toEqual([])
  })

  it('không ném lỗi ở môi trường không có Image', () => {
    for (const capsule of content.capsules) {
      expect(() => preloadCardMedia(capsule.card)).not.toThrow()
    }
  })
})
