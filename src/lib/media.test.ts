import { describe, expect, it } from 'vitest'
import { content } from '../content/content'
import { audioExists, mediaExists, resolveAudio, resolveMedia } from './media'

describe('resolveMedia', () => {
  it('phân giải tên file có thật ra URL', () => {
    const url = resolveMedia('anhEmbe1.webp')
    expect(url).toBeTruthy()
    expect(url).toContain('anhEmbe1')
  })

  it('tên không có, rỗng hoặc undefined thì trả undefined', () => {
    expect(resolveMedia('khong-co.webp')).toBeUndefined()
    expect(resolveMedia('')).toBeUndefined()
    expect(resolveMedia(undefined)).toBeUndefined()
  })

  it('mediaExists và audioExists khớp với resolver', () => {
    expect(mediaExists('anhEmbe1.webp')).toBe(true)
    expect(mediaExists('khong-co.webp')).toBe(false)
    expect(audioExists('khong-co.mp3')).toBe(false)
    expect(resolveAudio('khong-co.mp3')).toBeUndefined()
  })

  it('mọi ảnh đã điền trong nội dung đều tồn tại', () => {
    const names: string[] = []
    for (const capsule of content.capsules) {
      const card = capsule.card
      if (card.kind === 'photo' && card.image) names.push(card.image)
      if (card.kind === 'photoPair' && card.images) names.push(...card.images)
      if (card.kind === 'video')
        names.push(...[card.video, card.poster].filter((n): n is string => !!n))
      if (card.kind === 'promise' && card.fallbackImage) names.push(card.fallbackImage)
    }
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) expect(mediaExists(name), name).toBe(true)
  })
})
