// Hiệu ứng máy gõ chữ cho bức thư (FR-20). Phần tính toán thuần: biết đã trôi qua bao lâu thì
// mỗi đoạn hiện được bao nhiêu ký tự, để test được mà không cần đồng hồ thật.

export interface TypewriterOptions {
  /** Thời gian gõ mỗi ký tự. */
  charMs: number
  /** Nghỉ giữa hai đoạn. */
  paragraphPauseMs: number
}

export const DEFAULT_TYPEWRITER: TypewriterOptions = { charMs: 38, paragraphPauseMs: 650 }

/** Tách theo "ký tự người đọc thấy" để không chặt đôi chữ có dấu tiếng Việt. */
export function splitGraphemes(text: string): string[] {
  const normalized = text.normalize('NFC')
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' })
    return Array.from(segmenter.segment(normalized), (s) => s.segment)
  }
  return Array.from(normalized)
}

export interface TypewriterFrame {
  /** Số ký tự đang hiện của từng đoạn. */
  counts: number[]
  /** Chỉ số đoạn đang được gõ (hoặc đoạn kế tiếp khi đang nghỉ); -1 khi chưa có đoạn nào. */
  activeIndex: number
  done: boolean
}

export function totalDuration(
  lengths: readonly number[],
  options: TypewriterOptions = DEFAULT_TYPEWRITER,
): number {
  const typing = lengths.reduce((sum, length) => sum + length * options.charMs, 0)
  const pauses = Math.max(0, lengths.length - 1) * options.paragraphPauseMs
  return typing + pauses
}

export function visibleCounts(
  lengths: readonly number[],
  elapsedMs: number,
  options: TypewriterOptions = DEFAULT_TYPEWRITER,
): TypewriterFrame {
  const counts = lengths.map(() => 0)
  if (lengths.length === 0) return { counts, activeIndex: -1, done: true }

  let t = Math.max(0, elapsedMs)
  for (let i = 0; i < lengths.length; i++) {
    const duration = lengths[i] * options.charMs
    if (t < duration) {
      counts[i] = Math.floor(t / options.charMs)
      return { counts, activeIndex: i, done: false }
    }
    counts[i] = lengths[i]
    t -= duration
    if (i === lengths.length - 1) break
    if (t < options.paragraphPauseMs) return { counts, activeIndex: i + 1, done: false }
    t -= options.paragraphPauseMs
  }
  return { counts, activeIndex: lengths.length - 1, done: true }
}

/** Hiện toàn bộ ngay (khi người đọc chạm để đọc nhanh). */
export function allVisible(lengths: readonly number[]): TypewriterFrame {
  return { counts: [...lengths], activeIndex: lengths.length - 1, done: true }
}
