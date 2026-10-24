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

/** Trang 1: linh vật ở giữa, các bong bóng giới thiệu bao quanh (FR-I15). */
export interface InviteIntro {
  heading: string
  bubbles: string[]
  next: string
  skip: string
}

/** Trang 2: câu dẫn, icon bí mật, lời hé lộ của Thư (FR-I16). */
export interface InviteReveal {
  lead: string
  iconHint: string
  /** Nhãn cho trình đọc màn hình của icon bí mật khi chưa mở. */
  iconLabel: string
  line: string
  nextHint: string
  /** Nhãn cho trình đọc màn hình của nút sau khi đã hé lộ. */
  nextLabel: string
  skip: string
}

export interface InviteContent {
  /** Tuổi của Thư: nguồn duy nhất, mọi chỗ ghi tuổi phải khớp (BR-I09). */
  age: number
  intro: InviteIntro
  reveal: InviteReveal
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

const AGE = 22

export const inviteContent: InviteContent = {
  age: AGE,
  intro: {
    heading: 'Xin giới thiệu: em bé Minh Thư',
    bubbles: [
      `${AGE} tuổi`,
      'Đẹp gái',
      'Công tác tại Shopee',
      'Thích cầu lông và thể thao',
      'Vui vẻ, hoạt bát',
      'Đôi khi hơi ngơ xíu hoy',
    ],
    next: 'Tiếp theo',
    skip: 'Bỏ qua',
  },
  reveal: {
    lead: 'Và sắp tới sẽ là một sự kiện trọng đại',
    iconHint: 'Chạm vào biểu tượng bí mật',
    iconLabel: 'Biểu tượng bí mật, chạm để mở',
    line: 'Là sinh nhật của mình đó',
    nextHint: 'Chạm để xem lời mời',
    nextLabel: 'Xem lời mời',
    skip: 'Bỏ qua',
  },
  title: 'Mời bạn đến dự sinh nhật của em bé Minh Thư',
  subtitle: `Sinh nhật lần thứ ${AGE}`,
  date: '2026-10-25',
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
  calendar: { title: `Sinh nhật em bé Minh Thư (${AGE} tuổi)` },
  share: {
    title: 'Lời mời sinh nhật em bé Minh Thư',
    text: `Mời bạn đến dự sinh nhật lần thứ ${AGE} của em bé Minh Thư nhé!`,
  },
}
