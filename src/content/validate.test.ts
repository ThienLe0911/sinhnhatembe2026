import { describe, expect, it } from 'vitest'
import { content, getAge, getCandleDigits } from './content'
import type { Capsule, GachaContent } from './types'
import { validateContent } from './validate'

const normal = { strict: false } as const
const allExist = {
  strict: true,
  mediaExists: () => true,
  audioExists: () => true,
} as const

// Bản sao sâu để mỗi test tự sửa mà không ảnh hưởng cấu hình thật
function make(mutate?: (draft: GachaContent) => void): GachaContent {
  const draft = structuredClone(content)
  mutate?.(draft)
  return draft
}

// Cấu hình đã điền đủ: không còn ngoặc vuông, có đủ media, voice note và nhạc
function makeComplete(mutate?: (draft: GachaContent) => void): GachaContent {
  return make((draft) => {
    draft.letter.paragraphs = draft.letter.paragraphs.map((p) => p.replace(/[[\]]/g, ''))
    for (const capsule of draft.capsules) {
      const { card } = capsule
      if (card.kind === 'photo') {
        card.image ??= 'a.webp'
        card.caption = card.caption.replace(/[[\]]/g, '')
      } else if (card.kind === 'photoPair') {
        card.caption = card.caption.replace(/[[\]]/g, '')
      } else if (card.kind === 'promise') {
        card.promises = ['Anh ăn cá giúp em bé.']
        card.voice = { src: 'voice.mp3' }
      }
    }
    draft.music = { src: 'nhac.mp3' }
    mutate?.(draft)
  })
}

function errorsOf(draft: GachaContent, options = normal as Parameters<typeof validateContent>[1]) {
  return validateContent(draft, options).errors
}

function firstOfTier(draft: GachaContent, tier: Capsule['tier']): Capsule {
  const found = draft.capsules.find((c) => c.tier === tier)
  if (!found) throw new Error('thiếu capsule trong dữ liệu mẫu')
  return found
}

describe('cấu hình thật của dự án', () => {
  it('qua chế độ thường', () => {
    const result = validateContent(content, normal)
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('bị từ chối ở chế độ nghiêm ngặt vì còn placeholder và thiếu media, mp3', () => {
    const result = validateContent(content, allExist)
    expect(result.ok).toBe(false)
    const joined = result.errors.join('\n')
    expect(joined).toContain('còn ký hiệu [ hoặc ]')
    expect(joined).toContain('music.src')
    expect(joined).toContain('thiếu tên file media')
  })

  it('có 8 capsule đúng thứ tự hạng và vàng ở cuối', () => {
    expect(content.capsules.map((c) => c.tier)).toEqual([
      'normal',
      'normal',
      'silver',
      'normal',
      'normal',
      'silver',
      'silver',
      'gold',
    ])
    expect(content.capsules.at(-1)?.card.kind).toBe('finale')
  })

  it('tuổi là 22 và có hai nến số 2, 2', () => {
    expect(getAge()).toBe(22)
    expect(getCandleDigits()).toEqual([2, 2])
  })
})

describe('bị từ chối ở cả hai chế độ', () => {
  const modes = [
    ['thường', normal],
    ['nghiêm ngặt', allExist],
  ] as const

  describe.each(modes)('chế độ %s', (_name, options) => {
    // Bản đủ nội dung để chỉ còn lỗi cần kiểm tra
    const base = (mutate: (d: GachaContent) => void) => makeComplete(mutate)

    it('không có capsule vàng', () => {
      const draft = base((d) => {
        d.capsules.pop()
      })
      expect(errorsOf(draft, options).join('\n')).toContain('thiếu capsule vàng')
    })

    it('có nhiều hơn một capsule vàng', () => {
      const draft = base((d) => {
        d.capsules.push({ ...structuredClone(d.capsules[7]), id: 'vang-2' })
      })
      expect(errorsOf(draft, options).join('\n')).toContain('chỉ được đúng 1')
    })

    it('capsule vàng không ở cuối', () => {
      const draft = base((d) => {
        d.capsules.reverse()
      })
      expect(errorsOf(draft, options).join('\n')).toContain('phải ở cuối')
    })

    it('id trùng', () => {
      const draft = base((d) => {
        d.capsules[1].id = d.capsules[0].id
      })
      expect(errorsOf(draft, options).join('\n')).toContain('bị trùng')
    })

    it('tổng tỉ lệ rơi khác 100', () => {
      const draft = base((d) => {
        d.dropRates[0].percent = 41
      })
      expect(errorsOf(draft, options).join('\n')).toContain('tổng tỉ lệ phải bằng 100')
    })

    it('thiếu caption của thẻ ảnh', () => {
      const draft = base((d) => {
        const card = firstOfTier(d, 'normal').card
        if (card.kind === 'photo') card.caption = ''
      })
      expect(errorsOf(draft, options).join('\n')).toContain('capsules[0].card.caption')
    })

    it('thiếu lời của voucher', () => {
      const draft = base((d) => {
        const card = firstOfTier(d, 'silver').card
        if (card.kind === 'voucher') card.text = ''
      })
      expect(errorsOf(draft, options).join('\n')).toContain('capsules[2].card.text')
    })

    it('lời hứa không có câu nào', () => {
      const draft = base((d) => {
        const card = d.capsules[6].card
        if (card.kind === 'promise') card.promises = []
      })
      expect(errorsOf(draft, options).join('\n')).toContain('cần ít nhất một lời hứa')
    })

    it('thẻ hai ảnh không đủ 2 ảnh', () => {
      const draft = base((d) => {
        const card = d.capsules[3].card
        if (card.kind === 'photoPair') card.images = ['a.webp'] as unknown as [string, string]
      })
      expect(errorsOf(draft, options).join('\n')).toContain('cần đúng 2 ảnh')
    })

    it('capsule vàng không phải dạng finale', () => {
      const draft = base((d) => {
        d.capsules[7].card = { kind: 'voucher', text: 'x' }
      })
      expect(errorsOf(draft, options).join('\n')).toContain('"finale"')
    })

    it('thiếu card hoặc dạng thẻ lạ', () => {
      const missing = base((d) => {
        delete (d.capsules[0] as Partial<Capsule>).card
      })
      expect(errorsOf(missing, options).join('\n')).toContain('capsules[0].card: thiếu')
      const unknown = base((d) => {
        d.capsules[0].card = { kind: 'lạ' } as unknown as Capsule['card']
      })
      expect(errorsOf(unknown, options).join('\n')).toContain('dạng thẻ không hợp lệ')
    })

    it('mốc mở khoá không có múi giờ', () => {
      const draft = base((d) => {
        d.unlockAt = '2026-10-27T00:00:00'
      })
      expect(errorsOf(draft, options).join('\n')).toContain('unlockAt')
    })

    it('thư rỗng hoặc thiếu chữ ký', () => {
      const draft = base((d) => {
        d.letter.paragraphs = []
        d.letter.signature = ''
      })
      const joined = errorsOf(draft, options).join('\n')
      expect(joined).toContain('letter.paragraphs')
      expect(joined).toContain('letter.signature')
    })
  })

  it('số capsule lấy từ mảng, thêm thẻ vẫn hợp lệ', () => {
    const draft = makeComplete((d) => {
      const extra: Capsule = {
        id: 'the-moi',
        tier: 'normal',
        title: 'Thẻ mới',
        card: { kind: 'voucher', text: 'Một lời mới.' },
      }
      d.capsules.splice(1, 0, extra, { ...extra, id: 'the-moi-2' })
    })
    expect(draft.capsules).toHaveLength(10)
    expect(validateContent(draft, allExist)).toEqual({ ok: true, errors: [] })
  })
})

describe('chỉ bị từ chối ở chế độ nghiêm ngặt', () => {
  it('cấu hình đã điền đủ qua cả hai chế độ', () => {
    const draft = makeComplete()
    expect(validateContent(draft, normal).ok).toBe(true)
    expect(validateContent(draft, allExist)).toEqual({ ok: true, errors: [] })
  })

  it('tên media không tồn tại', () => {
    const draft = makeComplete()
    const options = { ...allExist, mediaExists: (name: string) => name !== 'anhEmbe1.webp' }
    expect(validateContent(draft, normal).ok).toBe(true)
    const result = validateContent(draft, options)
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('"anhEmbe1.webp" không tồn tại')
  })

  it('còn [ trong thư', () => {
    const draft = makeComplete((d) => {
      d.letter.paragraphs[2] = 'Còn [chỗ trống'
    })
    expect(validateContent(draft, normal).ok).toBe(true)
    expect(errorsOf(draft, allExist).join('\n')).toContain('letter.paragraphs[2]')
  })

  it('còn ] trong caption', () => {
    const draft = makeComplete((d) => {
      const card = d.capsules[1].card
      if (card.kind === 'photo') card.caption = 'Chỗ trống]'
    })
    expect(validateContent(draft, normal).ok).toBe(true)
    expect(errorsOf(draft, allExist).join('\n')).toContain('capsules[1].card.caption')
  })

  it('còn ngoặc trong lời voucher và lời hứa', () => {
    const draft = makeComplete((d) => {
      const voucher = d.capsules[2].card
      if (voucher.kind === 'voucher') voucher.text = '[lời]'
      const promise = d.capsules[6].card
      if (promise.kind === 'promise') promise.promises = ['[hứa]']
    })
    expect(validateContent(draft, normal).ok).toBe(true)
    const joined = errorsOf(draft, allExist).join('\n')
    expect(joined).toContain('capsules[2].card.text')
    expect(joined).toContain('capsules[6].card.promises[0]')
  })

  it('music.src thiếu', () => {
    const draft = makeComplete((d) => {
      d.music = {}
    })
    expect(validateContent(draft, normal).ok).toBe(true)
    expect(errorsOf(draft, allExist).join('\n')).toContain('music.src: thiếu')
  })

  it('music.src không tồn tại theo audioExists', () => {
    const draft = makeComplete()
    const options = { ...allExist, audioExists: () => false }
    expect(validateContent(draft, normal).ok).toBe(true)
    expect(errorsOf(draft, options).join('\n')).toContain('"nhac.mp3" không tồn tại')
  })

  it('thẻ ảnh thiếu ảnh', () => {
    const draft = makeComplete((d) => {
      const card = d.capsules[0].card
      if (card.kind === 'photo') delete card.image
    })
    expect(validateContent(draft, normal).ok).toBe(true)
    expect(errorsOf(draft, allExist).join('\n')).toContain('capsules[0].card.image')
  })

  it('thẻ hai ảnh thiếu ảnh', () => {
    const draft = makeComplete((d) => {
      const card = d.capsules[3].card
      if (card.kind === 'photoPair') delete card.images
    })
    expect(validateContent(draft, normal).ok).toBe(true)
    expect(errorsOf(draft, allExist).join('\n')).toContain('capsules[3].card.images')
  })

  it('thẻ video thiếu video hoặc poster', () => {
    const draft = makeComplete((d) => {
      d.capsules[4].card = { kind: 'video', caption: 'Cú đêm' }
    })
    expect(validateContent(draft, normal).ok).toBe(true)
    const joined = errorsOf(draft, allExist).join('\n')
    expect(joined).toContain('capsules[4].card.video')
    expect(joined).toContain('capsules[4].card.poster')
  })

  it('lời hứa thiếu cả voice note lẫn ảnh thay thế', () => {
    const draft = makeComplete((d) => {
      const card = d.capsules[6].card
      if (card.kind === 'promise') delete card.voice
    })
    expect(validateContent(draft, normal).ok).toBe(true)
    expect(errorsOf(draft, allExist).join('\n')).toContain('voice.src')
  })

  it('lời hứa dùng ảnh thay thế thì qua, nhưng ảnh phải tồn tại', () => {
    const draft = makeComplete((d) => {
      const card = d.capsules[6].card
      if (card.kind === 'promise') {
        delete card.voice
        card.fallbackImage = 'thay-the.webp'
      }
    })
    expect(validateContent(draft, allExist).ok).toBe(true)
    const result = validateContent(draft, { ...allExist, mediaExists: () => false })
    expect(result.errors.join('\n')).toContain('"thay-the.webp" không tồn tại')
  })

  it('voice note không tồn tại theo audioExists', () => {
    const draft = makeComplete()
    const options = { ...allExist, audioExists: (name: string) => name !== 'voice.mp3' }
    expect(errorsOf(draft, options).join('\n')).toContain('"voice.mp3" không tồn tại')
  })

  it('chế độ nghiêm ngặt thiếu hàm kiểm tra tồn tại thì báo lỗi', () => {
    const draft = makeComplete()
    expect(validateContent(draft, { strict: true }).ok).toBe(false)
  })
})
