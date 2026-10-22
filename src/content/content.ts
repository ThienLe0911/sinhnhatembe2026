// Toàn bộ lời, capsule, thư và cấu hình của site nằm ở đây (FR-13).
// Chỗ trong [ngoặc vuông] là chỗ chủ dự án cần điền; chế độ nghiêm ngặt sẽ chặn bản phát hành
// cho tới khi các ngoặc này biến mất.
import type { GachaContent } from './types'

export const content: GachaContent = {
  unlockAt: '2026-10-27T00:00:00+07:00',
  birthYear: 2004,
  turningYear: 2026,
  machineName: 'Em Bé Gacha, phiên bản giới hạn 22',
  countdownCopy: {
    title: 'Em bé ơi, đợi anh Thúi xíu nha',
    body: 'Từ trước tới giờ toàn anh Thúi đợi em bé. Lần này đến lượt em bé đợi anh Thúi đó.',
  },
  dropRates: [
    { label: 'Matcha', percent: 40 },
    { label: 'Anh Thúi', percent: 40 },
    { label: 'Ảnh em bé ngủ gật', percent: 20 },
    { label: 'Cá', percent: 0 },
  ],
  letter: {
    paragraphs: [
      'Gửi em bé,',
      'Chúc mừng sinh nhật 22 tuổi của bae!',
      'Anh vẫn nhớ ngày đầu mình gặp nhau. Em đi bưng mâm quả trong đám hỏi của chị họ anh, còn anh đứng đó và biết ngay: người này phải là của mình.',
      '[Hơn ba năm] rồi, mà anh vẫn thấy mình may mắn như ngày hôm ấy.',
      '[Thêm 1 đến 2 câu về một kỷ niệm riêng của hai đứa, nếu bạn muốn.]',
      'Cảm ơn em bé đã dạy anh biết chờ. Những buổi đón em tan làm, anh đứng đợi rất lâu, lâu đến mức anh tập sẵn cả bài la. Vậy mà mỗi lần em xuất hiện, anh quên sạch, chỉ còn vui và muốn thương em thêm. Nên tấm thẻ Miễn La kia, anh để em dùng cả đời nhé.',
      'Anh nhớ hết những điều nhỏ xíu về em: ly matcha em hay gọi, mấy món trang sức bạc em thích đeo, miếng cá em nhất quyết không ăn (anh ăn giúp), và những đêm em thức khuya hơn cả mặt trăng. Anh không muốn đổi điều nào, anh chỉ muốn ở cạnh để chăm em.',
      'Tuổi 22, anh mong em ngủ sớm hơn một xíu, cười nhiều hơn một xíu, và luôn nhớ rằng cuối ngày vẫn có một người đứng chờ em.',
      'Thương em bé nhiều nhiều,',
    ],
    signature: 'Anh Thúi của em bé',
  },
  whisperLine: 'Coi chừng… anh ta còn giấu gì đó.',
  // Chưa có mp3; điền tên file trong src/assets/audio/ khi có
  music: {},
  capsules: [
    {
      id: 'lan-dau-gap-nhau',
      tier: 'normal',
      title: 'Lần đầu mình gặp nhau',
      // Chưa có ảnh
      card: {
        kind: 'photo',
        caption:
          'Hôm em bưng mâm quả, anh đứng đó và biết ngay: người này phải là của mình. [Caption do chủ dự án viết]',
      },
    },
    {
      id: 'dang-chong-cam',
      tier: 'normal',
      title: 'Dáng chống cằm',
      card: { kind: 'photo', image: 'anhEmbe1.webp', caption: '[Caption do chủ dự án viết]' },
    },
    {
      id: 'the-mien-la',
      tier: 'silver',
      title: 'Thẻ Miễn La',
      card: {
        kind: 'voucher',
        text: 'Dùng khi em bé ra trễ lúc anh đón. Hiệu lực vô thời hạn, vì anh chưa bao giờ la được.',
      },
    },
    {
      id: 'ky-niem-3-nam',
      tier: 'normal',
      title: 'Kỷ niệm 3 năm',
      card: {
        kind: 'photoPair',
        images: ['anhAnni3year.webp', 'anhAnni3year2.webp'],
        caption: '[Caption do chủ dự án viết]',
      },
    },
    {
      id: 'cu-dem',
      tier: 'normal',
      title: 'Cú đêm',
      // Chưa có ảnh hoặc video
      card: { kind: 'photo', caption: '[Caption do chủ dự án viết]' },
    },
    {
      id: 'voucher-matcha',
      tier: 'silver',
      title: 'Voucher matcha',
      card: {
        kind: 'voucher',
        text: '1 ly matcha anh Thúi bao, không cần hỏi uống gì.',
      },
    },
    {
      id: 'loi-hua',
      tier: 'silver',
      title: 'Lời hứa của anh Thúi',
      // Chưa có voice note (voice) và chưa có ảnh thay thế (fallbackImage)
      card: {
        kind: 'promise',
        promises: ['Anh ăn cá giúp em bé.', '[Thêm lời hứa do chủ dự án viết]'],
      },
    },
    {
      id: 'capsule-vang',
      tier: 'gold',
      title: 'Capsule vàng',
      card: { kind: 'finale' },
    },
  ],
}

// Tuổi suy ra từ cấu hình (BR-05): 2026 - 2004 = 22
export function getAge(source: Pick<GachaContent, 'birthYear' | 'turningYear'> = content): number {
  return source.turningYear - source.birthYear
}

// Các chữ số của tuổi, mỗi chữ số một nến số: 22 -> [2, 2]
export function getCandleDigits(age: number = getAge()): number[] {
  return String(age)
    .split('')
    .map((digit) => Number(digit))
}
