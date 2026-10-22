/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Đọc thẳng file CSS: vitest không nạp nội dung CSS qua ?raw nên dùng fs.
const tokensCss = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

function parseColors(css: string): Map<string, string> {
  const colors = new Map<string, string>()
  for (const match of css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    colors.set(match[1], match[2].toLowerCase())
  }
  return colors
}

function channel(value: number): number {
  const s = value / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  )
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const colors = parseColors(tokensCss)

// [chữ hoặc thành phần, nền, tỉ lệ tối thiểu]: 4.5 cho chữ thường, 3 cho thành phần giao diện (WCAG AA)
const pairs: Array<[string, string, number]> = [
  ['color-ink', 'color-bg', 4.5],
  ['color-ink', 'color-bg-deep', 4.5],
  ['color-ink', 'color-surface', 4.5],
  ['color-ink', 'color-peach', 4.5],
  ['color-ink', 'color-lavender', 4.5],
  ['color-ink', 'color-matcha', 4.5],
  ['color-ink', 'color-butter', 4.5],
  ['color-ink', 'color-gold-1', 4.5],
  ['color-ink', 'color-silver-1', 4.5],
  ['color-ink-muted', 'color-bg', 4.5],
  ['color-ink-muted', 'color-surface', 4.5],
  ['color-ink-inverse', 'color-matcha-ink', 4.5],
  ['color-matcha-ink', 'color-matcha', 4.5],
  ['color-focus', 'color-bg', 3],
]

describe('độ tương phản của token màu', () => {
  it('đọc được các màu từ tokens.css', () => {
    expect(colors.size).toBeGreaterThan(15)
  })

  it.each(pairs)('%s trên %s đạt tối thiểu %s:1', (fg, bg, min) => {
    const a = colors.get(fg)
    const b = colors.get(bg)
    expect(a, `thiếu token ${fg}`).toBeDefined()
    expect(b, `thiếu token ${bg}`).toBeDefined()
    expect(contrast(a!, b!)).toBeGreaterThanOrEqual(min)
  })
})
