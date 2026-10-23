import { motionValue } from 'motion/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { content, getCandleDigits } from '../content/content'
import type { Capsule } from '../content/types'
import { Cake } from '../ui/Cake'
import { MemoryCard } from './MemoryCard'

const byId = (id: string): Capsule => {
  const capsule = content.capsules.find((c) => c.id === id)
  if (!capsule) throw new Error(`thiếu capsule ${id}`)
  return capsule
}

const render = (capsule: Capsule) =>
  renderToStaticMarkup(<MemoryCard capsule={capsule} onClose={() => {}} />)

describe('MemoryCard', () => {
  it('thẻ ảnh hiện ảnh và caption', () => {
    const html = render(byId('dang-chong-cam'))
    expect(html).toContain('role="dialog"')
    expect(html).toContain('anhEmbe1')
    expect(html).toContain('Cất vào album')
  })

  it('thẻ hai ảnh có đủ hai mặt và nút lật', () => {
    const html = render(byId('ky-niem-3-nam'))
    expect(html.match(/<img/g)).toHaveLength(2)
    expect(html).toContain('aria-label="Lật ảnh"')
  })

  it('thẻ voucher hạng Bạc có lớp ánh kim và đúng lời', () => {
    const capsule = byId('the-mien-la')
    const html = render(capsule)
    expect(capsule.tier).toBe('silver')
    expect(html).toContain('Bạc')
    expect(html).toContain('aria-hidden="true"')
    if (capsule.card.kind === 'voucher') expect(html).toContain('Dùng khi em bé ra trễ')
  })

  it('thẻ thường không có lớp ánh kim', () => {
    const normal = render(byId('dang-chong-cam'))
    const silver = render(byId('the-mien-la'))
    expect(silver.length).toBeGreaterThan(0)
    expect(normal).not.toContain('--mx')
    expect(silver).toContain('--mx')
  })

  it('lời hứa liệt kê từng lời; chưa có voice note thì không có trình phát', () => {
    const capsule = byId('loi-hua')
    const html = render(capsule)
    if (capsule.card.kind === 'promise') {
      for (const promise of capsule.card.promises) expect(html).toContain(promise.slice(0, 12))
    }
    expect(html).not.toContain('<audio')
  })

  it('ảnh chưa có thì hiện chỗ giữ chỗ, không lỗi', () => {
    const html = render(byId('lan-dau-gap-nhau'))
    expect(html).toContain('chờ được bổ sung')
  })
})

describe('Cake', () => {
  const digits = getCandleDigits()
  const level = motionValue(0)

  it('có nến số đúng với tuổi và mô tả cho trình đọc màn hình', () => {
    const html = renderToStaticMarkup(<Cake digits={digits} level={level} lit decorated={false} />)
    expect(html).toContain(`số ${digits.join(' ')}`)
    expect(html.match(/>2</g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('khi nến sáng có ngọn lửa, khi tắt thì không', () => {
    const lit = renderToStaticMarkup(<Cake digits={digits} level={level} lit decorated={false} />)
    const out = renderToStaticMarkup(
      <Cake digits={digits} level={level} lit={false} decorated={false} />,
    )
    expect(lit).toContain('#f6a85a')
    expect(out).not.toContain('#f6a85a')
  })

  it('chỉ trang trí cờ, kem và dâu sau khi thổi nến', () => {
    const plain = renderToStaticMarkup(<Cake digits={digits} level={level} lit decorated={false} />)
    const done = renderToStaticMarkup(<Cake digits={digits} level={level} lit={false} decorated />)
    expect(plain).not.toContain('M -11 0 L 11 0 L 0 26 Z')
    expect(done.match(/M -11 0 L 11 0 L 0 26 Z/g)).toHaveLength(7)
  })
})
