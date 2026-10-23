import { describe, expect, it } from 'vitest'
import { createClock } from './clock'
import { UNLOCK_AT_MS } from './time'
import { content } from '../content/content'

describe('createClock', () => {
  it('không có ?now thì dùng đồng hồ thật', () => {
    expect(createClock('', () => 1234)()).toBe(1234)
    expect(createClock('?preview', () => 1234)()).toBe(1234)
  })

  it('?now không hợp lệ thì bỏ qua', () => {
    expect(createClock('?now=khong-phai-ngay', () => 5000)()).toBe(5000)
  })

  it('?now giả lập giờ và vẫn chạy tiếp theo đồng hồ thật', () => {
    let real = 1_000_000
    const clock = createClock('?now=2026-10-26T16:59:50Z', () => real)
    expect(clock()).toBe(Date.parse('2026-10-26T16:59:50Z'))
    real += 4000
    expect(clock()).toBe(Date.parse('2026-10-26T16:59:54Z'))
  })
})

describe('mốc mở khoá', () => {
  it('nội dung và thư viện thời gian dùng cùng một mốc', () => {
    expect(Date.parse(content.unlockAt)).toBe(UNLOCK_AT_MS)
  })
})
