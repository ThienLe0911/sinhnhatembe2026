import type { InviteContent } from './content'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const LINK = /^(https:\/\/|tel:|sms:)/

export interface InviteValidateResult {
  ok: boolean
  errors: string[]
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function isValidDate(date: string): boolean {
  if (!DATE.test(date)) return false
  const [y, m, d] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(y, m - 1, d))
  return (
    parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d
  )
}

function collectStrings(content: InviteContent): Array<[string, string]> {
  const out: Array<[string, string]> = [
    ['title', content.title],
    ['subtitle', content.subtitle],
    ['date', content.date],
    ['venue.name', content.venue.name],
    ['venue.address', content.venue.address],
    ['closing', content.closing],
    ['calendar.title', content.calendar.title],
    ['share.title', content.share.title],
    ['share.text', content.share.text],
  ]
  content.timeline.forEach((step, i) => out.push([`timeline[${i}].text`, step.text]))
  if (content.rsvp) out.push(['rsvp.label', content.rsvp.label])
  if (content.confidentialNote) out.push(['confidentialNote', content.confidentialNote])
  return out
}

/** Chế độ thường cho phép còn chỗ chờ; chế độ nghiêm ngặt (khi phát hành) thì không. */
export function validateInvite(
  content: InviteContent,
  options: { strict: boolean },
): InviteValidateResult {
  const errors: string[] = []

  if (!TIME.test(content.start)) errors.push(`start "${content.start}" phải có dạng HH:mm`)
  if (!TIME.test(content.end)) errors.push(`end "${content.end}" phải có dạng HH:mm`)
  if (
    TIME.test(content.start) &&
    TIME.test(content.end) &&
    minutes(content.start) >= minutes(content.end)
  ) {
    errors.push('giờ kết thúc phải sau giờ bắt đầu')
  }

  if (!content.venue.name.trim()) errors.push('venue.name đang trống')
  if (!content.venue.address.trim()) errors.push('venue.address đang trống')
  if (content.timeline.length === 0) errors.push('timeline đang trống')

  let previousEnd = -1
  content.timeline.forEach((step, i) => {
    const where = `timeline[${i}]`
    if (!TIME.test(step.from) || !TIME.test(step.to)) {
      errors.push(`${where}: giờ phải có dạng HH:mm`)
      return
    }
    if (minutes(step.from) >= minutes(step.to))
      errors.push(`${where}: giờ kết thúc phải sau giờ bắt đầu`)
    if (minutes(step.from) < previousEnd)
      errors.push(`${where}: các mốc phải theo thứ tự và không chồng nhau`)
    if (TIME.test(content.start) && minutes(step.from) < minutes(content.start)) {
      errors.push(`${where}: bắt đầu sớm hơn giờ tiệc`)
    }
    if (TIME.test(content.end) && minutes(step.to) > minutes(content.end)) {
      errors.push(`${where}: kết thúc muộn hơn giờ tiệc`)
    }
    if (!step.text.trim()) errors.push(`${where}: chữ đang trống`)
    previousEnd = minutes(step.to)
  })

  if (content.rsvp && !LINK.test(content.rsvp.href)) {
    errors.push('rsvp.href phải bắt đầu bằng https://, tel: hoặc sms:')
  }

  if (options.strict) {
    if (!isValidDate(content.date))
      errors.push(`date "${content.date}" phải là ngày YYYY-MM-DD hợp lệ`)
    for (const [path, value] of collectStrings(content)) {
      if (/[[\]]/.test(value)) errors.push(`${path}: còn chỗ chờ trong ngoặc vuông`)
    }
  }

  return { ok: errors.length === 0, errors }
}
