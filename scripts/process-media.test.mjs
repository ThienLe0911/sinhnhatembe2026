import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  buildFfmpegArgs,
  buildPosterFrameArgs,
  chooseQuality,
  classifyFile,
  encodeWebp,
  hasMetadata,
  outputName,
  parseArgs,
  planJobs,
  posterName,
  qualityLadder,
  run,
} from './process-media.mjs'

describe('tên đầu ra', () => {
  it('bỏ phần mở rộng, giữ nguyên hoa/thường', () => {
    expect(outputName('anhEmbe1.HEIC')).toBe('anhEmbe1.webp')
    expect(outputName('IMG_0649.heic')).toBe('IMG_0649.webp')
    expect(outputName('a.b.c.jpeg')).toBe('a.b.c.webp')
  })

  it('video ra .mp4 và có poster riêng', () => {
    expect(outputName('clipEmbe.MOV')).toBe('clipEmbe.mp4')
    expect(posterName('clipEmbe.MOV')).toBe('clipEmbe.poster.webp')
  })

  it('phân loại theo phần mở rộng không phân biệt hoa/thường', () => {
    expect(classifyFile('x.HEIC')).toBe('image')
    expect(classifyFile('x.Png')).toBe('image')
    expect(classifyFile('x.MOV')).toBe('video')
    expect(classifyFile('x.m4v')).toBe('video')
    expect(classifyFile('ghichu.txt')).toBeNull()
  })
})

describe('tham số dòng lệnh', () => {
  it('có mặc định và đọc được các cờ', () => {
    expect(parseArgs([]).maxKb).toBe(300)
    const o = parseArgs(['--input', '/a', '--output', '/b', '--max-kb', '120'])
    expect(o).toMatchObject({ input: '/a', output: '/b', maxKb: 120 })
  })

  it('từ chối cờ lạ hoặc giá trị sai', () => {
    expect(() => parseArgs(['--lạ'])).toThrow()
    expect(() => parseArgs(['--max-kb', 'abc'])).toThrow()
    expect(() => parseArgs(['--input'])).toThrow()
  })
})

describe('chọn chất lượng', () => {
  it('bậc thang đi từ 80 xuống 55', () => {
    expect(qualityLadder()).toEqual([80, 75, 70, 65, 60, 55])
  })

  it('dừng ở mức cao nhất vẫn nằm trong giới hạn', async () => {
    const tried = []
    const encode = async (q) => {
      tried.push(q)
      return Buffer.alloc(q * 10)
    }
    const r = await chooseQuality(encode, 700)
    expect(r.quality).toBe(70)
    expect(r.overLimit).toBe(false)
    expect(tried).toEqual([80, 75, 70])
  })

  it('đánh dấu vượt giới hạn khi mức thấp nhất vẫn lớn', async () => {
    const r = await chooseQuality(async (q) => Buffer.alloc(q * 10), 100)
    expect(r.quality).toBe(55)
    expect(r.overLimit).toBe(true)
  })
})

describe('tham số ffmpeg', () => {
  const args = buildFfmpegArgs('in.MOV', 'out.mp4')

  it('H.264, tắt tiếng, faststart, xoá metadata', () => {
    expect(args).toContain('libx264')
    expect(args).toContain('-an')
    expect(args[args.indexOf('-movflags') + 1]).toBe('+faststart')
    expect(args[args.indexOf('-map_metadata') + 1]).toBe('-1')
    expect(args[args.indexOf('-i') + 1]).toBe('in.MOV')
    expect(args.at(-1)).toBe('out.mp4')
  })

  it('giới hạn cạnh dài 1280 và không phóng to', () => {
    const filter = args[args.indexOf('-vf') + 1]
    expect(filter).toContain('min(1280,iw)')
    expect(filter).toContain('min(1280,ih)')
  })

  it('lấy poster ở giây đầu', () => {
    const poster = buildPosterFrameArgs('in.MOV', 'f.png')
    expect(poster[poster.indexOf('-ss') + 1]).toBe('0')
    expect(poster).toContain('-frames:v')
  })
})

describe('video khi thiếu ffmpeg', () => {
  const files = ['b.MOV', 'a.HEIC', 'c.mp4', 'ghichu.txt']

  it('thiếu ffmpeg: bỏ qua video, vẫn xử lý ảnh', () => {
    const plan = planJobs(files, false)
    expect(plan.images).toEqual(['a.HEIC'])
    expect(plan.videos).toEqual([])
    expect(plan.skippedVideos).toEqual(['b.MOV', 'c.mp4'])
    expect(plan.ignored).toEqual(['ghichu.txt'])
  })

  it('có ffmpeg: video được xử lý', () => {
    const plan = planJobs(files, true)
    expect(plan.videos).toEqual(['b.MOV', 'c.mp4'])
    expect(plan.skippedVideos).toEqual([])
  })
})

describe('tích hợp trên ảnh tổng hợp', () => {
  let dir
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'process-media-test-'))
  })
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  // Ảnh 2000x1000 với EXIF (có orientation 6: cần xoay 90 độ) và ICC.
  async function makeSource(path) {
    await sharp({
      create: { width: 2000, height: 1000, channels: 3, background: { r: 200, g: 80, b: 60 } },
    })
      .withExif({ IFD0: { Copyright: 'rieng-tu' } })
      .withMetadata({ orientation: 6 })
      .withIccProfile('srgb')
      .jpeg()
      .toFile(path)
  }

  it('xoá metadata và xoay đúng chiều', async () => {
    const src = join(dir, 'goc.jpg')
    await makeSource(src)
    const before = await sharp(src).metadata()
    expect(before.exif).toBeDefined()
    expect(before.orientation).toBe(6)
    expect(await hasMetadata(src)).toBe(true)

    const out = join(dir, 'ra.webp')
    await writeFile(out, await encodeWebp(src, 80))
    const meta = await sharp(out).metadata()
    expect(await hasMetadata(out)).toBe(false)
    expect(meta.exif).toBeUndefined()
    expect(meta.orientation).toBeUndefined()
    // Gốc 2000x1000 xoay 90 độ thành 1000x2000, rồi thu nhỏ cạnh dài về 1440
    expect(meta.width).toBeLessThan(meta.height)
    expect(meta.height).toBe(1440)
  })

  it('chạy toàn bộ: không đụng file gốc, chạy lại ra cùng nội dung, không phóng to ảnh nhỏ', async () => {
    const input = join(dir, 'in')
    const output = join(dir, 'out')
    await mkdir(input)
    await makeSource(join(input, 'AnhThu.JPG'))
    await sharp({
      create: { width: 200, height: 100, channels: 3, background: '#335577' },
    })
      .png()
      .toFile(join(input, 'nho.png'))
    const originals = await Promise.all(
      ['AnhThu.JPG', 'nho.png'].map((n) => readFile(join(input, n))),
    )

    const options = { input, output, maxKb: 300 }
    const first = await run(options, { ffmpegAvailable: false })
    expect(first.failed).toBe(0)
    expect((await readdir(output)).sort()).toEqual(['AnhThu.webp', 'nho.webp'])
    const firstBytes = await readFile(join(output, 'AnhThu.webp'))
    const small = await sharp(join(output, 'nho.webp')).metadata()
    expect([small.width, small.height]).toEqual([200, 100])

    await run(options, { ffmpegAvailable: false })
    expect(await readFile(join(output, 'AnhThu.webp'))).toEqual(firstBytes)

    const after = await Promise.all(['AnhThu.JPG', 'nho.png'].map((n) => readFile(join(input, n))))
    expect(after).toEqual(originals)
    expect(await readdir(input)).toHaveLength(2)
  })

  it('từ chối output trùng input', async () => {
    await expect(run({ input: dir, output: dir, maxKb: 300 })).rejects.toThrow()
  })
})
