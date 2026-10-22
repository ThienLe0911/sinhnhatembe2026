#!/usr/bin/env node
// Công cụ xử lý media: ảnh/video gốc từ iPhone -> WebP/MP4 đã xoá metadata, nhỏ gọn.
// Chỉ ĐỌC thư mục input; mọi file trung gian nằm trong thư mục tạm của hệ điều hành.
import { execFile, spawnSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import sharp from 'sharp'

const execFileAsync = promisify(execFile)

const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

export const IMAGE_EXTS = ['.heic', '.heif', '.jpg', '.jpeg', '.png']
export const VIDEO_EXTS = ['.mov', '.mp4', '.m4v']
export const MAX_IMAGE_EDGE = 1440
export const MAX_VIDEO_EDGE = 1280
export const QUALITY_START = 80
export const QUALITY_MIN = 55
export const QUALITY_STEP = 5
export const DEFAULT_MAX_KB = 300

export const DEFAULT_INPUT = join(REPO_ROOT, 'image')
export const DEFAULT_OUTPUT = join(REPO_ROOT, 'src', 'assets', 'media')

/** Phân loại theo phần mở rộng (không phân biệt hoa/thường). */
export function classifyFile(fileName) {
  const ext = extname(fileName).toLowerCase()
  if (IMAGE_EXTS.includes(ext)) return 'image'
  if (VIDEO_EXTS.includes(ext)) return 'video'
  return null
}

/** Tên đầu ra = tên gốc bỏ phần mở rộng, GIỮ NGUYÊN hoa/thường (anhEmbe1.HEIC -> anhEmbe1.webp). */
export function outputName(fileName, kind = classifyFile(fileName)) {
  const base = basename(fileName, extname(fileName))
  return `${base}${kind === 'video' ? '.mp4' : '.webp'}`
}

export function posterName(fileName) {
  return `${basename(fileName, extname(fileName))}.poster.webp`
}

export function parseArgs(argv) {
  const options = { input: DEFAULT_INPUT, output: DEFAULT_OUTPUT, maxKb: DEFAULT_MAX_KB }
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i]
    if (flag === '--help' || flag === '-h') {
      options.help = true
      continue
    }
    const value = argv[i + 1]
    if (flag === '--input' || flag === '--output' || flag === '--max-kb') {
      if (value === undefined || value.startsWith('--'))
        throw new Error(`Thiếu giá trị cho ${flag}`)
      i += 1
      if (flag === '--input') options.input = resolve(value)
      else if (flag === '--output') options.output = resolve(value)
      else {
        const kb = Number(value)
        if (!Number.isFinite(kb) || kb <= 0) throw new Error(`--max-kb phải là số dương: ${value}`)
        options.maxKb = kb
      }
      continue
    }
    throw new Error(`Tham số không hợp lệ: ${flag}`)
  }
  return options
}

/** Các mức chất lượng thử lần lượt: 80, 75, ..., 55. */
export function qualityLadder(start = QUALITY_START, min = QUALITY_MIN, step = QUALITY_STEP) {
  const levels = []
  for (let q = start; q > min; q -= step) levels.push(q)
  levels.push(min)
  return levels
}

/**
 * Chọn chất lượng cao nhất mà kích thước <= maxBytes. `encode(quality)` trả Buffer.
 * Nếu mức thấp nhất vẫn lớn hơn giới hạn thì trả bản ở mức thấp nhất kèm overLimit = true.
 */
export async function chooseQuality(encode, maxBytes, levels = qualityLadder()) {
  let last
  for (const quality of levels) {
    const buffer = await encode(quality)
    last = { quality, buffer, overLimit: buffer.length > maxBytes }
    if (!last.overLimit) return last
  }
  return last
}

/** Tham số ffmpeg cho video: H.264, tắt tiếng, cạnh dài tối đa 1280, không metadata. */
export function buildFfmpegArgs(input, output, maxEdge = MAX_VIDEO_EDGE) {
  // -2 giữ cạnh còn lại chẵn (yêu cầu của yuv420p); min() để không phóng to.
  const scale = `scale='if(gte(iw,ih),min(${maxEdge},iw),-2)':'if(gte(iw,ih),-2,min(${maxEdge},ih))'`
  return [
    '-y',
    '-i',
    input,
    '-an',
    '-vf',
    scale,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '28',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-map_metadata',
    '-1',
    '-map_chapters',
    '-1',
    '-fflags',
    '+bitexact',
    '-flags:v',
    '+bitexact',
    output,
  ]
}

/** Tham số ffmpeg lấy một khung hình ở giây đầu (PNG tạm, sau đó sharp đổi sang WebP sạch). */
export function buildPosterFrameArgs(input, output) {
  return ['-y', '-ss', '0', '-i', input, '-frames:v', '1', '-map_metadata', '-1', output]
}

/** Tách danh sách file thành ảnh / video xử lý được / video phải bỏ qua vì thiếu ffmpeg. */
export function planJobs(fileNames, ffmpegAvailable) {
  const plan = { images: [], videos: [], skippedVideos: [], ignored: [] }
  for (const name of [...fileNames].sort()) {
    const kind = classifyFile(name)
    if (kind === 'image') plan.images.push(name)
    else if (kind === 'video') (ffmpegAvailable ? plan.videos : plan.skippedVideos).push(name)
    else plan.ignored.push(name)
  }
  return plan
}

export function detectFfmpeg() {
  const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  return !result.error && result.status === 0
}

/**
 * Kiểm tra file còn metadata hay không (EXIF, XMP, IPTC, ICC, ...).
 * Với WebP còn quét thẳng các chunk RIFF để không phụ thuộc cách sharp báo cáo.
 */
export async function hasMetadata(file) {
  const meta = await sharp(file).metadata()
  if (meta.exif || meta.xmp || meta.iptc || meta.icc || meta.tifftagPhotoshop) return true
  const data = await readFile(file)
  if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    let offset = 12
    while (offset + 8 <= data.length) {
      const fourcc = data.toString('ascii', offset, offset + 4)
      if (fourcc === 'EXIF' || fourcc === 'XMP ' || fourcc === 'ICCP') return true
      offset += 8 + data.readUInt32LE(offset + 4) + (data.readUInt32LE(offset + 4) % 2)
    }
  }
  return false
}

async function findSips() {
  return existsSync('/usr/bin/sips') ? '/usr/bin/sips' : 'sips'
}

/** Đưa ảnh về dạng sharp đọc được; HEIC/HEIF đổi sang JPEG trung gian bằng sips. */
async function prepareSource(srcPath, tmpDir, index) {
  const ext = extname(srcPath).toLowerCase()
  if (ext !== '.heic' && ext !== '.heif') return srcPath
  const intermediate = join(tmpDir, `heic-${index}.jpg`)
  await execFileAsync(await findSips(), [
    '-s',
    'format',
    'jpeg',
    '-s',
    'formatOptions',
    '95',
    srcPath,
    '--out',
    intermediate,
  ])
  return intermediate
}

/** Mã hoá ảnh thành WebP: xoay đúng chiều, thu nhỏ, không giữ metadata (mặc định của sharp). */
export function encodeWebp(sourcePath, quality, maxEdge = MAX_IMAGE_EDGE) {
  return sharp(sourcePath)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .toColourspace('srgb')
    .webp({ quality, effort: 6 })
    .toBuffer()
}

// Ghi qua file tạm cùng thư mục rồi đổi tên để không bao giờ để lại file đầu ra dở dang.
async function writeAtomic(path, buffer) {
  const partial = `${path}.partial`
  try {
    await writeFile(partial, buffer)
    await rename(partial, path)
  } finally {
    await rm(partial, { force: true })
  }
}

export async function processImage(srcPath, outDir, { maxKb, tmpDir, index = 0 }) {
  const name = basename(srcPath)
  const source = await prepareSource(srcPath, tmpDir, index)
  const maxBytes = maxKb * 1024
  const { quality, buffer, overLimit } = await chooseQuality((q) => encodeWebp(source, q), maxBytes)
  const outPath = join(outDir, outputName(name, 'image'))
  await writeAtomic(outPath, buffer)
  return { name, out: basename(outPath), quality, bytes: buffer.length, overLimit }
}

export async function processVideo(srcPath, outDir, { tmpDir, index = 0 }) {
  const name = basename(srcPath)
  const outPath = join(outDir, outputName(name, 'video'))
  const partial = `${outPath}.partial.mp4`
  const frame = join(tmpDir, `frame-${index}.png`)
  try {
    await execFileAsync('ffmpeg', buildFfmpegArgs(srcPath, partial))
    await rename(partial, outPath)
    await execFileAsync('ffmpeg', buildPosterFrameArgs(srcPath, frame))
    const poster = await sharp(frame).webp({ quality: QUALITY_START, effort: 6 }).toBuffer()
    await writeAtomic(join(outDir, posterName(name)), poster)
  } finally {
    await rm(partial, { force: true })
  }
  return { name, out: basename(outPath), bytes: (await stat(outPath)).size }
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

function printTable(rows) {
  const header = ['Tên gốc', 'Trước', 'Sau', 'Kết quả']
  const all = [header, ...rows]
  const widths = header.map((_, c) => Math.max(...all.map((r) => r[c].length)))
  for (const row of all) console.log(row.map((cell, c) => cell.padEnd(widths[c])).join('  '))
}

/** Chạy toàn bộ quy trình; trả về { rows, skippedVideos, failed, warnings }. */
export async function run(options, { ffmpegAvailable = detectFfmpeg() } = {}) {
  const { input, output, maxKb } = options
  if (resolve(input) === resolve(output)) {
    throw new Error('Thư mục output không được trùng với input (không ghi vào thư mục gốc).')
  }
  const names = (await readdir(input)).filter((n) => !n.startsWith('.'))
  const plan = planJobs(names, ffmpegAvailable)
  await mkdir(output, { recursive: true })
  const tmpDir = await mkdtemp(join(tmpdir(), 'process-media-'))
  const cleanup = () => rmSync(tmpDir, { recursive: true, force: true })
  const onSignal = () => {
    cleanup()
    process.exit(130)
  }
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)

  const rows = []
  const warnings = []
  let failed = 0
  const seenOutputs = new Map()
  try {
    const jobs = [
      ...plan.images.map((name) => ({ name, kind: 'image' })),
      ...plan.videos.map((name) => ({ name, kind: 'video' })),
    ]
    for (const [index, { name, kind }] of jobs.entries()) {
      const srcPath = join(input, name)
      const before = (await stat(srcPath)).size
      const target = outputName(name, kind)
      try {
        if (seenOutputs.has(target)) {
          throw new Error(`trùng tên đầu ra ${target} với ${seenOutputs.get(target)}`)
        }
        seenOutputs.set(target, name)
        if (kind === 'image') {
          const r = await processImage(srcPath, output, { maxKb, tmpDir, index })
          let note = `OK -> ${r.out} (q${r.quality})`
          if (r.overLimit) {
            note = `CẢNH BÁO vượt ${maxKb} KB ở chất lượng tối thiểu -> ${r.out} (q${r.quality})`
            warnings.push(`${name}: ${kb(r.bytes)} > ${maxKb} KB dù đã giảm tới q${QUALITY_MIN}`)
          }
          rows.push([name, kb(before), kb(r.bytes), note])
        } else {
          const r = await processVideo(srcPath, output, { tmpDir, index })
          rows.push([name, kb(before), kb(r.bytes), `OK -> ${r.out}`])
        }
      } catch (error) {
        failed += 1
        rows.push([name, kb(before), '-', `LỖI: ${error.message.split('\n')[0]}`])
      }
    }
    for (const name of plan.skippedVideos) {
      const before = (await stat(join(input, name))).size
      rows.push([name, kb(before), '-', 'BỎ QUA (thiếu ffmpeg)'])
    }
  } finally {
    process.off('SIGINT', onSignal)
    process.off('SIGTERM', onSignal)
    cleanup()
  }

  printTable(rows)
  for (const w of warnings) console.warn(`CẢNH BÁO: ${w}`)
  if (plan.skippedVideos.length > 0) {
    console.warn(
      '\nKhông tìm thấy ffmpeg trong PATH nên đã bỏ qua video (cài bằng: brew install ffmpeg):',
    )
    for (const name of plan.skippedVideos) console.warn(`  - ${name}`)
  }
  if (rows.length === 0)
    console.log(`Không có media nào trong ${relative(process.cwd(), input) || input}`)
  return { rows, skippedVideos: plan.skippedVideos, failed, warnings }
}

async function main() {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exit(2)
  }
  if (options.help) {
    console.log(
      'Dùng: node scripts/process-media.mjs [--input <thư mục>] [--output <thư mục>] [--max-kb 300]',
    )
    return
  }
  try {
    const { failed } = await run(options)
    process.exitCode = failed > 0 ? 1 : 0
  } catch (error) {
    console.error(`Lỗi: ${error.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
