import { describe, expect, it } from 'vitest'
import {
  buildIcs,
  describeEvent,
  escapeIcsText,
  foldLine,
  formatClock,
  formatDate,
  formatTimeRange,
  googleCalendarUrl,
  mapsUrl,
  utcStamp,
} from './calendar'
import { inviteContent, type InviteContent } from './content'

const content: InviteContent = { ...inviteContent, date: '2026-10-27' }
const NOW = new Date('2026-10-24T05:06:07Z')
const bytes = (s: string) => new TextEncoder().encode(s).length

describe('định dạng giờ và ngày', () => {
  it('formatClock bỏ phút khi tròn giờ', () => {
    expect(formatClock('18:30')).toBe('18h30')
    expect(formatClock('20:00')).toBe('20h')
    expect(formatClock('22:00')).toBe('22h')
    expect(formatClock('09:05')).toBe('9h05')
  })

  it('formatTimeRange nối hai mốc', () => {
    expect(formatTimeRange('18:30', '20:00')).toBe('18h30 – 20h')
  })

  it('formatDate ghi đúng thứ của ngày 27/10/2026 (thứ ba), không phụ thuộc múi giờ máy', () => {
    expect(formatDate('2026-10-27')).toBe('Thứ ba, 27/10/2026')
    expect(formatDate('2026-11-01')).toBe('Chủ nhật, 01/11/2026')
    expect(formatDate('[Ngày diễn ra buổi tiệc]')).toBe('[Ngày diễn ra buổi tiệc]')
  })
})

describe('liên kết bản đồ', () => {
  it('tìm theo tên quán và địa chỉ đã mã hoá', () => {
    const url = mapsUrl(content.venue)
    expect(url.startsWith('https://www.google.com/maps/search/?api=1&query=')).toBe(true)
    const query = decodeURIComponent(url.split('query=')[1])
    expect(query).toBe(`${content.venue.name}, ${content.venue.address}`)
  })
})

describe('mốc thời gian UTC', () => {
  it('18h30 giờ Việt Nam là 11h30 UTC, 22h là 15h UTC', () => {
    expect(utcStamp('2026-10-27', '18:30')).toBe('20261027T113000Z')
    expect(utcStamp('2026-10-27', '22:00')).toBe('20261027T150000Z')
  })

  it('giờ sớm hơn 7 giờ lùi sang ngày hôm trước', () => {
    expect(utcStamp('2026-10-27', '06:30')).toBe('20261026T233000Z')
  })
})

describe('Google Calendar', () => {
  it('có khoảng 18h30 đến 22h giờ Việt Nam, tiêu đề, địa điểm và mô tả', () => {
    const url = googleCalendarUrl(content)
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('dates=20261027T113000Z/20261027T150000Z')
    expect(decodeURIComponent(url.split('&text=')[1].split('&')[0])).toBe(content.calendar.title)
    expect(decodeURIComponent(url.split('&location=')[1])).toContain('Sushi Cô Bông')
    expect(decodeURIComponent(url.split('&details=')[1].split('&')[0])).toBe(describeEvent(content))
  })

  it('mô tả liệt kê từng mốc và lời kết', () => {
    const text = describeEvent(content)
    expect(text).toContain('18h30 – 20h: Dùng bữa tại Sushi Cô Bông')
    expect(text).toContain('20h – 22h: Cà phê hoặc board game')
    expect(text.endsWith(content.closing)).toBe(true)
  })
})

describe('file .ics', () => {
  const ics = buildIcs(content, NOW)
  const lines = ics.split('\r\n')

  it('có khung VCALENDAR và VEVENT, kết thúc bằng CRLF', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines).toContain('BEGIN:VEVENT')
    expect(lines).toContain('END:VEVENT')
    expect(lines).toContain('END:VCALENDAR')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics).not.toMatch(/[^\r]\n/)
  })

  it('giờ đúng: 18h30 và 22h giờ Việt Nam', () => {
    expect(lines).toContain('DTSTART:20261027T113000Z')
    expect(lines).toContain('DTEND:20261027T150000Z')
    expect(lines).toContain('DTSTAMP:20261024T050607Z')
    expect(lines).toContain('UID:moi-2026-10-27@em-be-gacha')
  })

  it('không dòng nào dài quá 75 octet kể cả tiếng Việt có dấu', () => {
    for (const line of lines) expect(bytes(line)).toBeLessThanOrEqual(75)
  })

  it('gập dòng rồi nối lại thì ra đúng nội dung gốc', () => {
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('SUMMARY:Sinh nhật em bé Minh Thư (22 tuổi)')
    expect(unfolded).toContain('LOCATION:Sushi Cô Bông\\, 186 Đ. Đặng Văn Ngữ\\, Phú Nhuận')
    expect(unfolded).toContain('Dùng bữa tại Sushi Cô Bông\\n')
  })
})

describe('escapeIcsText và foldLine', () => {
  it('thoát dấu phẩy, chấm phẩy, gạch chéo ngược và xuống dòng', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
  })

  it('dòng ngắn giữ nguyên', () => {
    expect(foldLine('ngắn')).toEqual(['ngắn'])
  })

  it('dòng dài được gập, dòng nối tiếp bắt đầu bằng dấu cách và không chặt đôi chữ có dấu', () => {
    const long = 'ệ'.repeat(120)
    const parts = foldLine(long)
    expect(parts.length).toBeGreaterThan(1)
    expect(parts.slice(1).every((p) => p.startsWith(' '))).toBe(true)
    for (const p of parts) expect(bytes(p)).toBeLessThanOrEqual(75)
    expect(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join('')).toBe(long)
  })
})
