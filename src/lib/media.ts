// Phân giải TÊN FILE logic trong nội dung (ví dụ 'anhEmbe1.webp') ra URL thật do Vite băm tên.
// Chưa có file hoặc chưa điền tên thì trả undefined để giao diện hiện chỗ giữ chỗ, không lỗi.
const mediaFiles = import.meta.glob('../assets/media/*.{webp,jpg,jpeg,png,mp4}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const audioFiles = import.meta.glob('../assets/audio/*.{mp3,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function indexByName(files: Record<string, string>): Map<string, string> {
  const byName = new Map<string, string>()
  for (const [path, url] of Object.entries(files)) {
    byName.set(path.slice(path.lastIndexOf('/') + 1), url)
  }
  return byName
}

const mediaByName = indexByName(mediaFiles)
const audioByName = indexByName(audioFiles)

export function resolveMedia(name?: string): string | undefined {
  return name ? mediaByName.get(name) : undefined
}

export function resolveAudio(name?: string): string | undefined {
  return name ? audioByName.get(name) : undefined
}

export function mediaExists(name: string): boolean {
  return mediaByName.has(name)
}

export function audioExists(name: string): boolean {
  return audioByName.has(name)
}
