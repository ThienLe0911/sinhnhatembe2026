// Media chỉ tham chiếu bằng TÊN FILE logic nằm trong src/assets/media/ (ví dụ 'anhEmbe1.webp').
// Không import ảnh ở tầng nội dung để test chạy được trong node; phần render tự phân giải tên file.

export type Tier = 'normal' | 'silver' | 'gold'

export interface PhotoCard {
  kind: 'photo'
  // Bỏ trống = chưa có ảnh; chỉ được phép ở chế độ thường
  image?: string
  caption: string
}

export interface PhotoPairCard {
  kind: 'photoPair'
  // Hai ảnh lật qua lại; bỏ trống = chưa có ảnh
  images?: [string, string]
  caption: string
}

export interface VideoCard {
  kind: 'video'
  video?: string
  poster?: string
  caption: string
}

export interface VoucherCard {
  kind: 'voucher'
  text: string
}

export interface PromiseCard {
  kind: 'promise'
  promises: string[]
  // Slot voice note: có file thì hiện trình phát, chưa có thì hiện ảnh thay thế (FR-11)
  voice?: { src: string }
  fallbackImage?: string
}

export interface FinaleCard {
  kind: 'finale'
}

export type Card = PhotoCard | PhotoPairCard | VideoCard | VoucherCard | PromiseCard | FinaleCard

export interface Capsule {
  id: string
  tier: Tier
  title: string
  card: Card
}

export interface DropRate {
  label: string
  percent: number
}

export interface GachaContent {
  // Thời điểm tuyệt đối dạng ISO có múi giờ, ví dụ '2026-10-27T00:00:00+07:00' (BR-03)
  unlockAt: string
  birthYear: number
  turningYear: number
  machineName: string
  countdownCopy: { title: string; body: string }
  dropRates: DropRate[]
  letter: { paragraphs: string[]; signature: string }
  whisperLine: string
  music: { src?: string }
  // Thứ tự cố định (BR-01); capsule vàng duy nhất và ở cuối
  capsules: Capsule[]
}
