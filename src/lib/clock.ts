// Đồng hồ của app. Ở môi trường phát triển có thể giả lập giờ bằng ?now=<ISO> để thử màn đếm
// ngược; bản phát hành luôn dùng đồng hồ máy (nhánh giả lập bị loại khi build).
export function createClock(search: string, realNow: () => number = Date.now): () => number {
  if (!import.meta.env.DEV) return realNow
  const raw = new URLSearchParams(search).get('now')
  const target = raw ? Date.parse(raw) : Number.NaN
  if (Number.isNaN(target)) return realNow
  const offset = target - realNow()
  return () => realNow() + offset
}
