import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { inviteContent } from './content'
import { initialFlow, type FlowState } from './flow'
import { InviteFlow } from './InviteFlow'

const render = (initial: FlowState) =>
  renderToStaticMarkup(<InviteFlow content={inviteContent} initial={initial} />)

const intro = render(initialFlow)
const sealed = render({ step: 'reveal', opened: false })
const opened = render({ step: 'reveal', opened: true })
const invite = render({ step: 'invite', opened: false })

const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

describe('Trang 1, giới thiệu (AC-I14)', () => {
  it('có tiêu đề, linh vật, đủ 6 bong bóng đúng chữ và đúng thứ tự', () => {
    expect(intro).toContain('Xin giới thiệu: em bé Minh Thư')
    expect(intro).toContain('Em bé Minh Thư')
    expect(intro.match(/<li[ >]/g)?.length).toBe(6)
    let last = -1
    for (const bubble of inviteContent.intro.bubbles) {
      const at = intro.indexOf(`>${bubble}<`)
      expect(at, bubble).toBeGreaterThan(last)
      last = at
    }
  })

  it('có nút Tiếp theo và Bỏ qua là nút thật (AC-I20)', () => {
    expect(intro).toMatch(/<button[^>]*>Tiếp theo<\/button>/)
    expect(intro).toMatch(/<button[^>]*>Bỏ qua<\/button>/)
  })

  it('chưa hiện nội dung của các bước sau', () => {
    expect(intro).not.toContain('Và sắp tới')
    expect(intro).not.toContain('Sushi Cô Bông')
  })
})

describe('Trang 2, hé lộ (AC-I15, AC-I16)', () => {
  it('chưa chạm: có câu dẫn, icon bí mật có nhãn, chưa có lời hé lộ', () => {
    expect(sealed).toContain('Và sắp tới sẽ là một sự kiện trọng đại')
    expect(sealed).toContain('aria-label="Biểu tượng bí mật, chạm để mở"')
    expect(sealed).toContain('Chạm vào biểu tượng bí mật')
    expect(sealed).not.toContain('Là sinh nhật của mình đó')
  })

  it('vùng thông báo luôn có sẵn để trình đọc màn hình đọc lời hé lộ (AC-I20)', () => {
    expect(sealed).toContain('role="status"')
    expect(opened).toContain('role="status"')
  })

  it('chạm lần 1: hiện lời của Thư, nút đổi thành "Xem lời mời"', () => {
    expect(opened).toContain('Là sinh nhật của mình đó')
    expect(opened).toContain('aria-label="Xem lời mời"')
    expect(opened).toContain('Chạm để xem lời mời')
    expect(opened).not.toContain('Biểu tượng bí mật, chạm để mở')
  })

  it('có nút Bỏ qua ở cả hai trạng thái', () => {
    expect(sealed).toMatch(/<button[^>]*>Bỏ qua<\/button>/)
    expect(opened).toMatch(/<button[^>]*>Bỏ qua<\/button>/)
  })
})

describe('bước cuối là trang mời v1, không đổi (AC-I18)', () => {
  it('vẫn đủ ngày, giờ, địa điểm, lịch trình và lời kết', () => {
    expect(invite).toContain('Mời bạn đến dự sinh nhật của em bé Minh Thư')
    expect(invite).toContain('Chủ nhật, 25/10/2026')
    expect(invite).toContain('Sushi Cô Bông')
    expect(invite).toContain('18h30 – 20h')
    expect(invite).toContain('Hãy tham gia và cùng tạo kỉ niệm đáng nhớ với em bé Minh Thư nhé')
    expect(invite).toContain('Chia sẻ lời mời')
  })

  it('không còn nút của hai trang dẫn', () => {
    expect(invite).not.toContain('Tiếp theo')
    expect(invite).not.toContain('Biểu tượng bí mật')
  })
})

describe('hai trang dẫn không nhắc tới quà hay bất ngờ (AC-I22, BR-I10)', () => {
  it('chữ hiển thị không có "quà", "bất ngờ"', () => {
    for (const html of [intro, sealed, opened]) {
      expect(textOf(html).toLowerCase()).not.toMatch(/quà|bất ngờ/)
    }
  })

  it('icon bí mật không phải hộp quà', () => {
    expect(sealed.toLowerCase()).not.toMatch(/gift|hộp quà/)
  })
})
