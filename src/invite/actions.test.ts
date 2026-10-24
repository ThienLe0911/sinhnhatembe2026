import { describe, expect, it, vi } from 'vitest'
import { copyText, downloadTextFile, shareInvite, type ShareData } from './actions'

const data: ShareData = { title: 'Mời', text: 'Mời bạn', url: 'https://example.test/moi/' }

describe('copyText', () => {
  it('dùng Clipboard API khi có', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const execCopy = vi.fn()
    expect(await copyText('abc', { writeText, execCopy })).toBe(true)
    expect(writeText).toHaveBeenCalledWith('abc')
    expect(execCopy).not.toHaveBeenCalled()
  })

  it('Clipboard API bị chặn thì rơi về cách cũ', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    const execCopy = vi.fn().mockReturnValue(true)
    expect(await copyText('abc', { writeText, execCopy })).toBe(true)
    expect(execCopy).toHaveBeenCalledWith('abc')
  })

  it('không có cách nào thì trả false, không ném lỗi', async () => {
    expect(await copyText('abc', { writeText: null, execCopy: null })).toBe(false)
    expect(
      await copyText('abc', {
        writeText: null,
        execCopy: () => {
          throw new Error('x')
        },
      }),
    ).toBe(false)
  })
})

describe('shareInvite', () => {
  it('có hộp chia sẻ hệ thống thì dùng nó', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const copy = vi.fn()
    expect(await shareInvite(data, { share, copy })).toBe('shared')
    expect(share).toHaveBeenCalledWith(data)
    expect(copy).not.toHaveBeenCalled()
  })

  it('không có hộp chia sẻ thì sao chép link', async () => {
    const copy = vi.fn().mockResolvedValue(true)
    expect(await shareInvite(data, { share: null, copy })).toBe('copied')
    expect(copy).toHaveBeenCalledWith(data.url)
  })

  it('đóng hộp chia sẻ là huỷ, không sao chép', async () => {
    const abort = Object.assign(new Error('x'), { name: 'AbortError' })
    const copy = vi.fn()
    expect(await shareInvite(data, { share: vi.fn().mockRejectedValue(abort), copy })).toBe(
      'cancelled',
    )
    expect(copy).not.toHaveBeenCalled()
  })

  it('chia sẻ lỗi khác thì thử sao chép link; hỏng cả hai thì failed', async () => {
    const share = vi.fn().mockRejectedValue(new Error('boom'))
    expect(await shareInvite(data, { share, copy: vi.fn().mockResolvedValue(true) })).toBe('copied')
    expect(await shareInvite(data, { share, copy: vi.fn().mockResolvedValue(false) })).toBe(
      'failed',
    )
  })
})

describe('downloadTextFile', () => {
  const makeDeps = () => {
    const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() }
    return {
      link,
      deps: {
        document: {
          createElement: vi.fn().mockReturnValue(link),
          body: { appendChild: vi.fn() },
        },
        url: { createObjectURL: vi.fn().mockReturnValue('blob:x'), revokeObjectURL: vi.fn() },
      },
    }
  }

  it('tạo liên kết tạm, bấm và dọn', () => {
    const { link, deps } = makeDeps()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(downloadTextFile('moi.ics', 'text/calendar', 'x', deps as any)).toBe(true)
    expect(link.href).toBe('blob:x')
    expect(link.download).toBe('moi.ics')
    expect(link.click).toHaveBeenCalled()
    expect(link.remove).toHaveBeenCalled()
  })

  it('không có môi trường trình duyệt hoặc trình duyệt chặn thì trả false', () => {
    expect(downloadTextFile('a', 'b', 'c', null)).toBe(false)
    const { deps } = makeDeps()
    deps.url.createObjectURL.mockImplementation(() => {
      throw new Error('blocked')
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(downloadTextFile('a', 'b', 'c', deps as any)).toBe(false)
  })
})
