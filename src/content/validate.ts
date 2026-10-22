import type { Capsule, GachaContent } from './types'

export interface ValidateOptions {
  // Nghiêm ngặt dùng cho build phát hành: chặn placeholder và media/mp3 thiếu
  strict: boolean
  mediaExists?: (name: string) => boolean
  audioExists?: (name: string) => boolean
}

export interface ValidateResult {
  ok: boolean
  errors: string[]
}

const TIERS = ['normal', 'silver', 'gold']
const PERCENT_TOLERANCE = 1e-6

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function hasBracket(value: string): boolean {
  return value.includes('[') || value.includes(']')
}

export function validateContent(content: GachaContent, options: ValidateOptions): ValidateResult {
  const { strict, mediaExists, audioExists } = options
  const errors: string[] = []
  // Ghi nhận chuỗi chữ để quét ký hiệu placeholder ở chế độ nghiêm ngặt
  const texts: Array<{ path: string; value: string }> = []

  const requireText = (path: string, value: unknown) => {
    if (!isText(value)) {
      errors.push(`${path}: thiếu hoặc rỗng`)
      return
    }
    texts.push({ path, value })
  }

  // Trường media tuỳ chọn: bỏ trống chỉ được ở chế độ thường
  const checkMedia = (path: string, name: unknown, required: boolean) => {
    if (name === undefined || name === '') {
      if (strict && required) errors.push(`${path}: thiếu tên file media`)
      return
    }
    if (typeof name !== 'string') {
      errors.push(`${path}: tên file phải là chuỗi`)
      return
    }
    if (strict && mediaExists && !mediaExists(name)) {
      errors.push(`${path}: file media "${name}" không tồn tại`)
    }
  }

  const checkCapsule = (capsule: Capsule, index: number) => {
    const base = `capsules[${index}]`
    requireText(`${base}.title`, capsule.title)
    const card = capsule.card as Capsule['card'] | undefined
    if (!card || typeof card !== 'object') {
      errors.push(`${base}.card: thiếu`)
      return
    }
    const path = `${base}.card`

    if ((card.kind === 'finale') !== (capsule.tier === 'gold')) {
      errors.push(`${base}: dạng thẻ "finale" chỉ dành cho capsule vàng và ngược lại`)
    }

    switch (card.kind) {
      case 'photo':
        requireText(`${path}.caption`, card.caption)
        checkMedia(`${path}.image`, card.image, true)
        break
      case 'photoPair': {
        requireText(`${path}.caption`, card.caption)
        const images = card.images as unknown
        if (images !== undefined && (!Array.isArray(images) || images.length !== 2)) {
          errors.push(`${path}.images: cần đúng 2 ảnh`)
        } else if (images === undefined) {
          if (strict) errors.push(`${path}.images: thiếu 2 ảnh`)
        } else {
          checkMedia(`${path}.images[0]`, images[0], true)
          checkMedia(`${path}.images[1]`, images[1], true)
        }
        break
      }
      case 'video':
        requireText(`${path}.caption`, card.caption)
        checkMedia(`${path}.video`, card.video, true)
        checkMedia(`${path}.poster`, card.poster, true)
        break
      case 'voucher':
        requireText(`${path}.text`, card.text)
        break
      case 'promise': {
        if (!Array.isArray(card.promises) || card.promises.length === 0) {
          errors.push(`${path}.promises: cần ít nhất một lời hứa`)
        } else {
          card.promises.forEach((line, i) => requireText(`${path}.promises[${i}]`, line))
        }
        // Cần voice note hoặc ảnh thay thế (FR-11); chế độ thường cho phép thiếu cả hai
        const voiceSrc = card.voice?.src
        const hasVoice = isText(voiceSrc)
        const hasFallback = isText(card.fallbackImage)
        if (strict && !hasVoice && !hasFallback) {
          errors.push(`${path}: cần voice note (voice.src) hoặc ảnh thay thế (fallbackImage)`)
        }
        if (strict && hasVoice && audioExists && !audioExists(voiceSrc)) {
          errors.push(`${path}.voice.src: file âm thanh "${voiceSrc}" không tồn tại`)
        }
        checkMedia(`${path}.fallbackImage`, card.fallbackImage, false)
        break
      }
      case 'finale':
        break
      default:
        errors.push(`${path}.kind: dạng thẻ không hợp lệ`)
    }
  }

  if (strict && (!mediaExists || !audioExists)) {
    errors.push('Chế độ nghiêm ngặt cần mediaExists và audioExists')
  }

  // Cấu hình chung
  const unlockMs = Date.parse(content.unlockAt)
  if (!isText(content.unlockAt) || Number.isNaN(unlockMs)) {
    errors.push('unlockAt: không phải thời điểm ISO hợp lệ')
  } else if (!/(Z|[+-]\d{2}:\d{2})$/.test(content.unlockAt)) {
    errors.push('unlockAt: phải kèm múi giờ, ví dụ +07:00 (BR-03)')
  }
  if (!Number.isInteger(content.birthYear) || !Number.isInteger(content.turningYear)) {
    errors.push('birthYear/turningYear: phải là số nguyên')
  } else if (content.turningYear <= content.birthYear) {
    errors.push('turningYear: phải lớn hơn birthYear')
  }
  requireText('machineName', content.machineName)
  requireText('countdownCopy.title', content.countdownCopy?.title)
  requireText('countdownCopy.body', content.countdownCopy?.body)
  requireText('whisperLine', content.whisperLine)

  // Bảng tỉ lệ rơi
  if (!Array.isArray(content.dropRates) || content.dropRates.length === 0) {
    errors.push('dropRates: cần ít nhất một dòng')
  } else {
    let total = 0
    content.dropRates.forEach((rate, i) => {
      requireText(`dropRates[${i}].label`, rate.label)
      if (!Number.isFinite(rate.percent) || rate.percent < 0) {
        errors.push(`dropRates[${i}].percent: phải là số không âm`)
      } else {
        total += rate.percent
      }
    })
    if (Math.abs(total - 100) > PERCENT_TOLERANCE) {
      errors.push(`dropRates: tổng tỉ lệ phải bằng 100 (hiện là ${total})`)
    }
  }

  // Thư
  if (!Array.isArray(content.letter?.paragraphs) || content.letter.paragraphs.length === 0) {
    errors.push('letter.paragraphs: cần ít nhất một đoạn')
  } else {
    content.letter.paragraphs.forEach((p, i) => requireText(`letter.paragraphs[${i}]`, p))
  }
  requireText('letter.signature', content.letter?.signature)

  // Nhạc nền: chưa có thì chỉ chặn ở chế độ nghiêm ngặt
  const musicSrc = content.music?.src
  if (strict) {
    if (!isText(musicSrc)) {
      errors.push('music.src: thiếu file nhạc nền')
    } else if (audioExists && !audioExists(musicSrc)) {
      errors.push(`music.src: file âm thanh "${musicSrc}" không tồn tại`)
    }
  }

  // Capsule: số lượng lấy từ mảng, không cố định
  if (!Array.isArray(content.capsules) || content.capsules.length === 0) {
    errors.push('capsules: cần ít nhất một capsule')
  } else {
    const { capsules } = content
    const seen = new Set<string>()
    capsules.forEach((capsule, i) => {
      if (!isText(capsule.id)) {
        errors.push(`capsules[${i}].id: thiếu hoặc rỗng`)
      } else if (seen.has(capsule.id)) {
        errors.push(`capsules[${i}].id: "${capsule.id}" bị trùng`)
      } else {
        seen.add(capsule.id)
      }
      if (!TIERS.includes(capsule.tier)) {
        errors.push(`capsules[${i}].tier: hạng không hợp lệ`)
      }
      checkCapsule(capsule, i)
    })

    const goldIndexes = capsules.flatMap((c, i) => (c.tier === 'gold' ? [i] : []))
    if (goldIndexes.length === 0) {
      errors.push('capsules: thiếu capsule vàng')
    } else if (goldIndexes.length > 1) {
      errors.push(`capsules: có ${goldIndexes.length} capsule vàng, chỉ được đúng 1`)
    } else if (goldIndexes[0] !== capsules.length - 1) {
      errors.push(`capsules[${goldIndexes[0]}]: capsule vàng phải ở cuối danh sách`)
    }
  }

  if (strict) {
    for (const { path, value } of texts) {
      if (hasBracket(value)) errors.push(`${path}: còn ký hiệu [ hoặc ] chưa điền`)
    }
  }

  return { ok: errors.length === 0, errors }
}
