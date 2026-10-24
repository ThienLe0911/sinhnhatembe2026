// Toàn bộ nội dung của trang mời nằm ở đây (FR-I10). Các dòng do chủ dự án cung cấp được dùng
// nguyên văn (BR-I01). Chỗ trong [ngoặc vuông] là chỗ chờ thông tin; chế độ nghiêm ngặt chặn
// phát hành cho tới khi hết ngoặc.
export type InviteIcon = 'sushi' | 'cup' | 'dice'

export interface InviteStep {
  /** Giờ bắt đầu và kết thúc, dạng HH:mm theo giờ Việt Nam. */
  from: string
  to: string
  text: string
  icons: InviteIcon[]
}

export interface InviteContent {
  title: string
  subtitle: string
  /** Ngày diễn ra, dạng YYYY-MM-DD. Còn ngoặc vuông nghĩa là chưa có ngày. */
  date: string
  start: string
  end: string
  venue: { name: string; address: string }
  timeline: InviteStep[]
  closing: string
  /** Chỉ hiện nút "Mình sẽ tham dự" khi có đường dẫn liên hệ (https:, tel: hoặc sms:). */
  rsvp?: { label: string; href: string }
  /** Dòng nhắc giữ bí mật, chỉ điền nếu buổi tiệc là bất ngờ với Thư. */
  confidentialNote?: string
  calendar: { title: string }
  share: { title: string; text: string }
}

export const inviteContent: InviteContent = {
  title: 'Mời bạn đến dự sinh nhật của em bé Minh Thư',
  subtitle: 'Sinh nhật lần thứ 22',
  date: '[Ngày diễn ra buổi tiệc]',
  start: '18:30',
  end: '22:00',
  venue: {
    name: 'Sushi Cô Bông',
    address: '186 Đ. Đặng Văn Ngữ, Phú Nhuận, Hồ Chí Minh 70000',
  },
  timeline: [
    { from: '18:30', to: '20:00', text: 'Dùng bữa tại Sushi Cô Bông', icons: ['sushi'] },
    {
      from: '20:00',
      to: '22:00',
      text: 'Cà phê hoặc board game tùy theo thời tiết và lựa chọn của mọi người',
      icons: ['cup', 'dice'],
    },
  ],
  closing: 'Hãy tham gia và cùng tạo kỉ niệm đáng nhớ với em bé Minh Thư nhé',
  calendar: { title: 'Sinh nhật em bé Minh Thư (22 tuổi)' },
  share: {
    title: 'Lời mời sinh nhật em bé Minh Thư',
    text: 'Mời bạn đến dự sinh nhật lần thứ 22 của em bé Minh Thư nhé!',
  },
}
