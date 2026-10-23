import { describe, expect, it } from 'vitest'
import { createKnobTracker, normalizeDelta, pointerAngle } from './knob'

describe('pointerAngle', () => {
  it('tính góc theo chiều kim đồng hồ (trục y hướng xuống)', () => {
    expect(pointerAngle(0, 0, 10, 0)).toBeCloseTo(0)
    expect(pointerAngle(0, 0, 0, 10)).toBeCloseTo(90)
    expect(pointerAngle(0, 0, -10, 0)).toBeCloseTo(180)
    expect(pointerAngle(0, 0, 0, -10)).toBeCloseTo(-90)
  })
})

describe('normalizeDelta', () => {
  it('đưa về (-180, 180]', () => {
    expect(normalizeDelta(10)).toBe(10)
    expect(normalizeDelta(190)).toBe(-170)
    expect(normalizeDelta(-190)).toBe(170)
    expect(normalizeDelta(360)).toBe(0)
    expect(normalizeDelta(180)).toBe(180)
  })
})

describe('createKnobTracker', () => {
  it('cộng dồn góc thuận chiều và báo tiến độ', () => {
    const t = createKnobTracker(300)
    t.start(0)
    const a = t.move(60)
    expect(a.total).toBe(60)
    expect(a.progress).toBeCloseTo(0.2)
    expect(a.done).toBe(false)
  })

  it('vượt mốc ±180 vẫn cộng đúng', () => {
    const t = createKnobTracker(300)
    t.start(170)
    expect(t.move(-170).total).toBe(20)
  })

  it('xoay ngược làm giảm và không âm', () => {
    const t = createKnobTracker(300)
    t.start(0)
    t.move(40)
    expect(t.move(10).total).toBe(10)
    expect(t.move(-60).total).toBe(0)
  })

  it('đủ ngưỡng thì done và dừng cộng thêm', () => {
    const t = createKnobTracker(300)
    t.start(0)
    let angle = 0
    let result = t.move(angle)
    for (let i = 0; i < 12; i++) {
      angle += 30
      result = t.move(angle)
    }
    expect(result.done).toBe(true)
    expect(result.progress).toBe(1)
    const after = t.move(angle + 90)
    expect(after.total).toBe(result.total)
  })

  it('chưa start thì move không làm gì; reset đưa về 0', () => {
    const t = createKnobTracker(300)
    expect(t.move(50).total).toBe(0)
    t.start(0)
    t.move(90)
    t.reset()
    expect(t.move(10).total).toBe(0)
  })
})
