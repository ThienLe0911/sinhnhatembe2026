import { describe, expect, it } from 'vitest'
import { readReducedMotion } from './reduced-motion'

const media = (matches: boolean) => () => ({ matches })

describe('readReducedMotion', () => {
  it('theo cài đặt của hệ điều hành', () => {
    expect(readReducedMotion(media(true), '', false)).toBe(true)
    expect(readReducedMotion(media(false), '', false)).toBe(false)
  })

  it('không có matchMedia thì coi như không giảm chuyển động', () => {
    expect(readReducedMotion(undefined, '', false)).toBe(false)
  })

  it('?reduce chỉ có tác dụng ở môi trường phát triển', () => {
    expect(readReducedMotion(media(false), '?reduce', true)).toBe(true)
    expect(readReducedMotion(media(false), '?preview&reduce=1', true)).toBe(true)
    expect(readReducedMotion(media(false), '?reduce', false)).toBe(false)
  })
})
