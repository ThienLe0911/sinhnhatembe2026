// Các nút hành động của trang mời: sao chép, chia sẻ, tải file lịch. Mỗi việc nhận "phụ thuộc" tiêm
// được để test; bản dùng thật luôn kiểm tra tính năng có tồn tại trước khi gọi, vì trình duyệt tích
// hợp của Zalo, Messenger, Facebook thường thiếu clipboard, chia sẻ hoặc tải file (FR-I11).

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export interface ShareData {
  title: string
  text: string
  url: string
}

export interface CopyDeps {
  writeText?: ((text: string) => Promise<void>) | null
  execCopy?: ((text: string) => boolean) | null
}

function execCopyFallback(text: string): boolean {
  if (typeof document === 'undefined') return false
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
  document.body.appendChild(area)
  try {
    area.select()
    area.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}

export function browserCopyDeps(): CopyDeps {
  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined
  return {
    writeText: clipboard?.writeText ? (text) => clipboard.writeText(text) : null,
    execCopy: execCopyFallback,
  }
}

/** Thử Clipboard API trước, không được thì dùng cách cũ; trả về có sao chép được hay không. */
export async function copyText(text: string, deps: CopyDeps = browserCopyDeps()): Promise<boolean> {
  if (deps.writeText) {
    try {
      await deps.writeText(text)
      return true
    } catch {
      // bị chặn quyền hoặc không có cử chỉ người dùng: thử cách cũ
    }
  }
  try {
    return deps.execCopy ? deps.execCopy(text) : false
  } catch {
    return false
  }
}

export function browserShare(): ((data: ShareData) => Promise<void>) | null {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return null
  return (data) => navigator.share(data)
}

const isAbort = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError'

/** Chia sẻ bằng hộp chia sẻ của hệ thống; không có thì sao chép link. */
export async function shareInvite(
  data: ShareData,
  deps: {
    share?: ((data: ShareData) => Promise<void>) | null
    copy: (text: string) => Promise<boolean>
  },
): Promise<ShareResult> {
  if (deps.share) {
    try {
      await deps.share(data)
      return 'shared'
    } catch (error) {
      // Người xem đóng hộp chia sẻ không phải là lỗi
      if (isAbort(error)) return 'cancelled'
    }
  }
  return (await deps.copy(data.url)) ? 'copied' : 'failed'
}

export interface DownloadDeps {
  document: Pick<Document, 'createElement' | 'body'>
  url: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>
}

/** Tải một file chữ về máy bằng đường liên kết tạm; trả về false nếu trình duyệt không cho. */
export function downloadTextFile(
  filename: string,
  mime: string,
  content: string,
  deps: DownloadDeps | null = typeof document === 'undefined' ? null : { document, url: URL },
): boolean {
  if (!deps) return false
  try {
    const blobUrl = deps.url.createObjectURL(new Blob([content], { type: mime }))
    const link = deps.document.createElement('a')
    link.href = blobUrl
    link.download = filename
    deps.document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => deps.url.revokeObjectURL(blobUrl), 4000)
    return true
  } catch {
    return false
  }
}
