import { describe, expect, it } from 'vitest'
import { inviteContent, type InviteContent } from './content'
import { isValidDate, validateInvite } from './validate'

const withDate = (date: string): InviteContent => ({ ...inviteContent, date })
const FILLED = withDate('2026-10-27')

describe('nội dung trang mời (nguyên văn của chủ dự án)', () => {
  it('giữ đúng chữ của chủ dự án', () => {
    expect(inviteContent.venue.name).toBe('Sushi Cô Bông')
    expect(inviteContent.start).toBe('18:30')
    expect(inviteContent.timeline.map((s) => s.text)).toEqual([
      'Dùng bữa tại Sushi Cô Bông',
      'Cà phê hoặc board game tùy theo thời tiết và lựa chọn của mọi người',
    ])
    expect(inviteContent.closing).toBe(
      'Hãy tham gia và cùng tạo kỉ niệm đáng nhớ với em bé Minh Thư nhé',
    )
  })

  it('hai mốc đúng thứ tự và đúng giờ', () => {
    expect(inviteContent.timeline.map((s) => [s.from, s.to])).toEqual([
      ['18:30', '20:00'],
      ['20:00', '22:00'],
    ])
  })

  it('không nhắc tới quà hay bất ngờ (BR-I06) và không chứa số điện thoại (BR-I07)', () => {
    const text = JSON.stringify(inviteContent).toLowerCase()
    expect(text).not.toMatch(/quà|bất ngờ|capsule|gacha/)
    expect(text).not.toMatch(/\d{9,}/)
  })
})

describe('validateInvite', () => {
  it('chế độ thường cho qua khi còn chờ ngày', () => {
    expect(validateInvite(inviteContent, { strict: false }).ok).toBe(true)
  })

  it('chế độ nghiêm ngặt chặn khi chưa có ngày hoặc còn ngoặc vuông', () => {
    const result = validateInvite(inviteContent, { strict: true })
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toContain('date')
  })

  it('có ngày hợp lệ thì chế độ nghiêm ngặt qua', () => {
    expect(validateInvite(FILLED, { strict: true })).toEqual({ ok: true, errors: [] })
  })

  it('ngày không tồn tại bị từ chối', () => {
    expect(isValidDate('2026-10-27')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('27/10/2026')).toBe(false)
    expect(validateInvite(withDate('2026-13-01'), { strict: true }).ok).toBe(false)
  })

  it('chữ còn ngoặc vuông ở trường khác cũng bị chặn khi nghiêm ngặt', () => {
    const result = validateInvite({ ...FILLED, closing: 'Hãy đến [chờ chữ]' }, { strict: true })
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toContain('closing')
  })

  it('giờ sai định dạng, kết thúc trước bắt đầu, mốc chồng nhau hoặc nằm ngoài giờ tiệc đều bị từ chối', () => {
    expect(validateInvite({ ...FILLED, start: '6pm' }, { strict: false }).ok).toBe(false)
    expect(validateInvite({ ...FILLED, start: '23:00', end: '22:00' }, { strict: false }).ok).toBe(
      false,
    )
    const overlapping = {
      ...FILLED,
      timeline: [
        { from: '18:30', to: '21:00', text: 'a', icons: [] },
        { from: '20:00', to: '22:00', text: 'b', icons: [] },
      ],
    }
    expect(validateInvite(overlapping, { strict: false }).ok).toBe(false)
    const outside = { ...FILLED, timeline: [{ from: '18:00', to: '22:00', text: 'a', icons: [] }] }
    expect(validateInvite(outside, { strict: false }).errors.join(' ')).toContain('sớm hơn')
    const late = { ...FILLED, timeline: [{ from: '18:30', to: '23:00', text: 'a', icons: [] }] }
    expect(validateInvite(late, { strict: false }).errors.join(' ')).toContain('muộn hơn')
  })

  it('thiếu địa điểm hoặc lịch trình thì lỗi', () => {
    expect(
      validateInvite({ ...FILLED, venue: { name: '', address: 'x' } }, { strict: false }).ok,
    ).toBe(false)
    expect(validateInvite({ ...FILLED, timeline: [] }, { strict: false }).ok).toBe(false)
  })

  it('đường dẫn RSVP chỉ nhận https, tel hoặc sms', () => {
    const ok = (href: string) =>
      validateInvite({ ...FILLED, rsvp: { label: 'Mình sẽ tham dự', href } }, { strict: true }).ok
    expect(ok('https://zalo.me/0900000000')).toBe(true)
    expect(ok('tel:+84900000000')).toBe(true)
    expect(ok('sms:+84900000000')).toBe(true)
    expect(ok('javascript:alert(1)')).toBe(false)
    expect(ok('http://zalo.me/x')).toBe(false)
  })
})
