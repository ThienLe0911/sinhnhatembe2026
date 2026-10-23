import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

type MatchMedia = (query: string) => { matches: boolean }

/**
 * Đọc ưu tiên "Giảm chuyển động": cài đặt của hệ điều hành, hoặc ?reduce khi đang phát triển
 * để thử mà không phải đổi cài đặt máy (AC-14).
 */
export function readReducedMotion(
  matchMedia: MatchMedia | undefined,
  search: string,
  dev: boolean = import.meta.env.DEV,
): boolean {
  if (dev && new URLSearchParams(search).has('reduce')) return true
  return matchMedia?.(QUERY).matches ?? false
}

function current(): boolean {
  if (typeof window === 'undefined') return false
  return readReducedMotion(window.matchMedia?.bind(window), window.location.search)
}

function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia(QUERY)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

export function useReducedMotionPref(): boolean {
  return useSyncExternalStore(subscribe, current, () => false)
}

/** Ghi lên <html> để CSS và JS dùng chung một nguồn. */
export function syncReducedMotionAttribute(): () => void {
  const apply = () => {
    document.documentElement.dataset.reducedMotion = String(current())
  }
  apply()
  return subscribe(apply)
}
