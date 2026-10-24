// Hàm thuần cho trang mời: định dạng giờ, liên kết bản đồ, liên kết Google Calendar và nội dung
// file .ics. Mọi giờ đều là giờ Việt Nam (UTC+7) và được đổi sang UTC khi đưa vào lịch.
import type { InviteContent } from './content'
import { isValidDate } from './validate'

const VN_OFFSET_HOURS = 7
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

/** "18:30" thành "18h30", "20:00" thành "20h". */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

export function formatTimeRange(from: string, to: string): string {
  return `${formatClock(from)} – ${formatClock(to)}`
}

/** "2026-10-27" thành "Thứ ba, 27/10/2026"; không dùng Intl để chạy đồng nhất trong mọi trình duyệt. */
export function formatDate(date: string): string {
  if (!isValidDate(date)) return date
  const [y, m, d] = date.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${weekday}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function mapsUrl(venue: InviteContent['venue']): string {
  const query = encodeURIComponent(`${venue.name}, ${venue.address}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

/** Giờ Việt Nam sang dấu thời gian UTC dạng 20261027T113000Z. */
export function utcStamp(date: string, hhmm: string): string {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = hhmm.split(':').map(Number)
  const iso = new Date(Date.UTC(y, mo - 1, d, h - VN_OFFSET_HOURS, mi)).toISOString()
  return `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}T${iso.slice(11, 13)}${iso.slice(14, 16)}00Z`
}

/** Phần mô tả sự kiện: lịch trình và lời kết, mỗi dòng một mốc. */
export function describeEvent(content: InviteContent): string {
  const steps = content.timeline.map((s) => `${formatTimeRange(s.from, s.to)}: ${s.text}`)
  return [...steps, '', content.closing].join('\n')
}

export function googleCalendarUrl(content: InviteContent): string {
  const dates = `${utcStamp(content.date, content.start)}/${utcStamp(content.date, content.end)}`
  const location = `${content.venue.name}, ${content.venue.address}`
  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(content.calendar.title)}` +
    `&dates=${dates}` +
    `&details=${encodeURIComponent(describeEvent(content))}` +
    `&location=${encodeURIComponent(location)}`
  )
}

/** Thoát ký tự theo RFC 5545. */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

const encoder = new TextEncoder()
const byteLength = (s: string) => encoder.encode(s).length

/** Gập dòng ở 75 octet (tính theo UTF-8, không chặt đôi ký tự); dòng nối tiếp bắt đầu bằng một dấu cách. */
export function foldLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let used = 0
  for (const char of line) {
    const size = byteLength(char)
    const limit = out.length === 0 ? 75 : 74 // dòng nối tiếp đã mất 1 octet cho dấu cách
    if (used + size > limit) {
      out.push(current)
      current = ''
      used = 0
    }
    current += char
    used += size
  }
  out.push(current)
  return out.map((part, i) => (i === 0 ? part : ` ${part}`))
}

export function buildIcs(content: InviteContent, now: Date): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
  const location = `${content.venue.name}, ${content.venue.address}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//em-be-gacha//moi//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:moi-${content.date}@em-be-gacha`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${utcStamp(content.date, content.start)}`,
    `DTEND:${utcStamp(content.date, content.end)}`,
    `SUMMARY:${escapeIcsText(content.calendar.title)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `DESCRIPTION:${escapeIcsText(describeEvent(content))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.flatMap(foldLine).join('\r\n') + '\r\n'
}
