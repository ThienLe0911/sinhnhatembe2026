import type { Card } from '../content/types'
import { resolveMedia } from './media'

/** Tên các ảnh của một thẻ, để tải trước khi thẻ được mở. */
export function cardImageNames(card: Card): string[] {
  switch (card.kind) {
    case 'photo':
      return card.image ? [card.image] : []
    case 'photoPair':
      return card.images ? [...card.images] : []
    case 'video':
      return card.poster ? [card.poster] : []
    case 'promise':
      return card.fallbackImage ? [card.fallbackImage] : []
    default:
      return []
  }
}

// Capsule vừa rơi vào khay là đã tải ảnh của thẻ, nên lúc mở thẻ ảnh hiện ngay, không nhảy bố cục
export function preloadCardMedia(card: Card): void {
  if (typeof Image === 'undefined') return
  for (const name of cardImageNames(card)) {
    const url = resolveMedia(name)
    if (url) new Image().src = url
  }
}
