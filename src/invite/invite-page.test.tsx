/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { inviteContent, type InviteContent } from './content'
import { InvitePage } from './InvitePage'

const render = (content: InviteContent = inviteContent) =>
  renderToStaticMarkup(<InvitePage content={content} />)
const FILLED: InviteContent = { ...inviteContent, date: '2026-10-27' }

describe('InvitePage', () => {
  const html = render()

  it('hiển thị tiêu đề, giờ, địa điểm, lịch trình và lời kết đúng chữ', () => {
    expect(html).toContain('Mời bạn đến dự sinh nhật của em bé Minh Thư')
    expect(html).toContain('Sinh nhật lần thứ 22')
    expect(html).toContain('18h30')
    expect(html).toContain('Sushi Cô Bông')
    expect(html).toContain('186 Đ. Đặng Văn Ngữ, Phú Nhuận, Hồ Chí Minh 70000')
    expect(html).toContain('18h30 – 20h')
    expect(html).toContain('20h – 22h')
    expect(html).toContain('Dùng bữa tại Sushi Cô Bông')
    expect(html).toContain('Cà phê hoặc board game tùy theo thời tiết và lựa chọn của mọi người')
    expect(html).toContain('Hãy tham gia và cùng tạo kỉ niệm đáng nhớ với em bé Minh Thư nhé')
  })

  it('hai mốc lịch trình theo đúng thứ tự', () => {
    expect(html.indexOf('Dùng bữa')).toBeLessThan(html.indexOf('Cà phê hoặc board game'))
  })

  it('nút bản đồ là liên kết ngoài an toàn, đúng địa chỉ', () => {
    expect(html).toContain('https://www.google.com/maps/search/?api=1&amp;query=')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('Sao chép địa chỉ')
  })

  it('luôn có nút chia sẻ lời mời', () => {
    expect(html).toContain('Chia sẻ lời mời')
  })

  it('chưa có ngày thì ẩn khối thêm vào lịch', () => {
    const pending = render({ ...inviteContent, date: '[Ngày diễn ra buổi tiệc]' })
    expect(pending).not.toContain('Thêm vào lịch')
    expect(pending).not.toContain('calendar.google.com')
  })

  it('nội dung thật có ngày 25/10/2026 (Chủ nhật) và khối thêm vào lịch', () => {
    expect(html).toContain('Chủ nhật, 25/10/2026')
    expect(html).toContain('Thêm vào lịch')
    expect(html).toContain('dates=20261025T113000Z/20261025T150000Z')
  })

  it('có ngày hợp lệ thì hiện Google Calendar, file .ics và thứ trong tuần', () => {
    const filled = render(FILLED)
    expect(filled).toContain('Thêm vào lịch')
    expect(filled).toContain('calendar.google.com/calendar/render')
    expect(filled).toContain('dates=20261027T113000Z/20261027T150000Z')
    expect(filled).toContain('Tải file lịch (.ics)')
    expect(filled).toContain('Thứ ba, 27/10/2026')
  })

  it('chưa có kênh liên hệ thì không có nút tham dự', () => {
    expect(html).not.toContain('Mình sẽ tham dự')
  })

  it('có kênh liên hệ thì hiện nút tham dự đúng đường dẫn', () => {
    const withRsvp = render({
      ...FILLED,
      rsvp: { label: 'Mình sẽ tham dự', href: 'https://zalo.me/0900000000' },
    })
    expect(withRsvp).toContain('Mình sẽ tham dự')
    expect(withRsvp).toContain('href="https://zalo.me/0900000000"')
  })

  it('chỉ hiện dòng giữ bí mật khi được cấu hình', () => {
    expect(html).not.toContain('role="note"')
    const secret = render({ ...FILLED, confidentialNote: 'Giữ bí mật với em bé nhé' })
    expect(secret).toContain('Giữ bí mật với em bé nhé')
    expect(secret).toContain('role="note"')
  })

  it('có vùng thông báo cho trình đọc màn hình', () => {
    expect(html).toContain('role="status"')
  })
})

describe('cách ly mã nguồn (ADR-001)', () => {
  it('mã trang mời không import nội dung, trạng thái hay màn hình của site quà', () => {
    const dir = new URL('./', import.meta.url)
    const files = readdirSync(dir).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f))
    expect(files.length).toBeGreaterThan(3)
    const bad = /from\s+['"]\.\.\/(content|state|screens|dev)(\/|['"])/
    for (const file of files) {
      const source = readFileSync(new URL(file, dir), 'utf8')
      expect(bad.test(source), `${file} import thứ không được phép`).toBe(false)
    }
  })
})
