// Kiểm tra cách ly (BR-I03, AC-I09, ADR-001): sau `npm run build`, mọi file mà trang mời `/moi/`
// tải về không được chứa nội dung riêng của site quà (thư, caption, ảnh, khoá lưu tiến trình...).
// Chạy: npm run build && npm run check:invite
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const entry = join(dist, 'moi', 'index.html')

if (!existsSync(entry)) {
  console.error('Chưa có dist/moi/index.html: hãy chạy `npm run build` trước.')
  process.exit(2)
}

const { content } = await import(join(root, 'src', 'content', 'content.ts'))

const MIN_LENGTH = 12
const SNIPPET = 36
const forbidden = new Set(['gacha:progress', 'gacha:audio', '.webp'])

function addText(text) {
  // Bỏ phần chỗ chờ trong ngoặc vuông; lấy đoạn đầu đủ dài để khó trùng ngẫu nhiên
  const clean = String(text ?? '')
    .replace(/\[[^\]]*\]/g, '')
    .trim()
  if (clean.length >= MIN_LENGTH) forbidden.add(clean.slice(0, SNIPPET))
}

for (const paragraph of content.letter.paragraphs) addText(paragraph)
addText(content.letter.signature)
addText(content.whisperLine)
addText(content.machineName)
addText(content.countdownCopy.title)
addText(content.countdownCopy.body)
for (const capsule of content.capsules) {
  forbidden.add(capsule.id)
  addText(capsule.title)
  const card = capsule.card
  if (card.kind === 'photo' || card.kind === 'photoPair' || card.kind === 'video')
    addText(card.caption)
  if (card.kind === 'voucher') addText(card.text)
  if (card.kind === 'promise') for (const promise of card.promises) addText(promise)
  for (const name of [
    card.image,
    card.poster,
    card.video,
    card.fallbackImage,
    ...(card.images ?? []),
  ]) {
    if (name) forbidden.add(name.replace(/\.[^.]+$/, ''))
  }
}

// Gom mọi file trang mời tải: các đường dẫn trong HTML rồi lần theo import tĩnh và động trong JS
const seen = new Set()
const queue = []
const enqueue = (file) => {
  if (existsSync(file) && !seen.has(file)) {
    seen.add(file)
    queue.push(file)
  }
}

const html = readFileSync(entry, 'utf8')
seen.add(entry)
for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g))
  enqueue(join(dist, match[1]))

for (let i = 0; i < queue.length; i++) {
  const file = queue[i]
  if (!file.endsWith('.js')) continue
  const code = readFileSync(file, 'utf8')
  for (const match of code.matchAll(/(?:from|import)\s*\(?\s*["'](\.[^"']+)["']/g)) {
    enqueue(resolve(dirname(file), match[1]))
  }
}

const violations = []
for (const file of seen) {
  const text = readFileSync(file, 'utf8')
  for (const needle of forbidden) {
    if (text.includes(needle)) violations.push({ file: file.replace(`${dist}/`, ''), needle })
  }
}

console.log(`Đã quét ${seen.size} file của trang mời với ${forbidden.size} chuỗi cấm.`)
for (const file of seen) console.log(`  - ${file.replace(`${dist}/`, '')}`)

if (violations.length > 0) {
  console.error('\nTHẤT BẠI: gói của trang mời chứa nội dung của site quà:')
  for (const v of violations) console.error(`  ${v.file}: "${v.needle}"`)
  process.exit(1)
}
console.log('Đạt: gói của trang mời không chứa nội dung của site quà.')
