// Công cụ dùng chung cho test của src/state (không được import từ mã chạy thật).
import { content as realContent } from '../content/content'
import type { Capsule, GachaContent } from '../content/types'
import type { ProgressStorage } from './progress-storage'

/** Nội dung có đúng n capsule: n-1 capsule thường/bạc xen kẽ, capsule vàng ở cuối. */
export function makeContent(n: number): GachaContent {
  const capsules: Capsule[] = []
  for (let i = 0; i < n - 1; i++) {
    capsules.push({
      id: `c${i + 1}`,
      tier: i % 2 === 0 ? 'normal' : 'silver',
      title: `Thẻ ${i + 1}`,
      card: { kind: 'voucher', text: `Voucher ${i + 1}` },
    })
  }
  capsules.push({ id: 'gold', tier: 'gold', title: 'Vàng', card: { kind: 'finale' } })
  return { ...realContent, capsules }
}

export type FakeStorage = ProgressStorage & { data: Map<string, string> }

export function makeStorage(initial: Record<string, string> = {}): FakeStorage {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

/** Storage ném lỗi ở mọi thao tác (ví dụ localStorage bị chặn). */
export function makeThrowingStorage(): ProgressStorage {
  const fail = (): never => {
    throw new Error('storage bị chặn')
  }
  return { getItem: fail, setItem: fail, removeItem: fail }
}
