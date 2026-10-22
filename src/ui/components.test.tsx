/// <reference types="node" />
import { statSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Capsule } from './Capsule'
import { GachaMachine } from './GachaMachine'
import { Mascot, type MascotState } from './Mascot'

const states: MascotState[] = ['idle', 'happy', 'surprised', 'sleepy', 'celebrate']

const idsOf = (html: string) => [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])

describe('Mascot', () => {
  it.each(states)('hiển thị trạng thái %s', (state) => {
    const html = renderToStaticMarkup(<Mascot state={state} />)
    expect(html).toContain(`data-state="${state}"`)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label=')
  })

  it('mỗi trạng thái cho hình khác nhau', () => {
    const outputs = states.map((state) => renderToStaticMarkup(<Mascot state={state} />))
    expect(new Set(outputs).size).toBe(states.length)
  })

  it('vòng bạc chỉ lấp lánh khi sparkle bật', () => {
    const off = renderToStaticMarkup(<Mascot />)
    const on = renderToStaticMarkup(<Mascot sparkle />)
    expect(on.length).toBeGreaterThan(off.length)
  })

  it('hai linh vật cùng trang không trùng id', () => {
    const a = idsOf(renderToStaticMarkup(<Mascot />))
    const b = idsOf(renderToStaticMarkup(<Mascot state="happy" />))
    expect(a.length).toBeGreaterThan(0)
    // Cùng một cây React thì useId khác nhau; khi render riêng lẻ chỉ cần id có tiền tố hợp lệ
    expect(a.every((id) => /^[\w-]+$/.test(id))).toBe(true)
    expect(b.every((id) => /^[\w-]+$/.test(id))).toBe(true)
    const both = idsOf(
      renderToStaticMarkup(
        <>
          <Mascot />
          <Mascot />
        </>,
      ),
    )
    expect(new Set(both).size).toBe(both.length)
  })

  it('mã nguồn nhỏ hơn 30KB', () => {
    expect(statSync(new URL('./Mascot.tsx', import.meta.url)).size).toBeLessThan(30 * 1024)
  })
})

describe('Capsule', () => {
  it.each(['normal', 'silver', 'gold'] as const)('hiển thị hạng %s', (tier) => {
    const html = renderToStaticMarkup(<Capsule tier={tier} />)
    expect(html).toContain('data-open="false"')
  })

  it('bật nắp đánh dấu open', () => {
    expect(renderToStaticMarkup(<Capsule tier="gold" open />)).toContain('data-open="true"')
  })

  it('nhận kích thước qua biến CSS', () => {
    expect(renderToStaticMarkup(<Capsule tier="normal" size="5rem" />)).toContain(
      '--capsule-size:5rem',
    )
  })
})

describe('GachaMachine', () => {
  it('đặt núm theo góc truyền vào', () => {
    const html = renderToStaticMarkup(<GachaMachine knobAngle={135} />)
    expect(html).toContain('rotate(135deg)')
  })

  it('chứa linh vật và khay ở đúng chỗ', () => {
    const html = renderToStaticMarkup(
      <GachaMachine mascot={<p>linh-vat</p>} tray={<p>capsule-trong-khay</p>} />,
    )
    expect(html).toContain('linh-vat')
    expect(html).toContain('capsule-trong-khay')
    expect(html).toContain('viewBox="0 0 360 720"')
  })

  it('nhận thuộc tính cho núm để gắn cử chỉ', () => {
    const html = renderToStaticMarkup(
      <GachaMachine knobProps={{ role: 'slider', 'aria-label': 'Núm xoay' }} />,
    )
    expect(html).toContain('role="slider"')
    expect(html).toContain('aria-label="Núm xoay"')
  })

  it('hai máy cùng trang không trùng id', () => {
    const ids = idsOf(
      renderToStaticMarkup(
        <>
          <GachaMachine />
          <GachaMachine />
        </>,
      ),
    )
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
