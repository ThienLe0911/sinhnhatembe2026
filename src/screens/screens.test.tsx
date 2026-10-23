import { describe, expect, it } from 'vitest'
import { UNLOCK_AT_MS } from '../lib/time'
import { formatUnlockTime, pad2 } from './Countdown'

describe('định dạng màn đếm ngược', () => {
  it('mốc mở khoá hiện đúng giờ Việt Nam, bất kể múi giờ máy', () => {
    expect(formatUnlockTime(UNLOCK_AT_MS)).toBe('00:00 27/10')
  })

  it('giờ nửa đêm không bị hiện thành 24:00', () => {
    expect(formatUnlockTime(Date.parse('2026-10-27T00:05:00+07:00'))).toBe('00:05 27/10')
  })

  it('pad2 thêm số 0 phía trước', () => {
    expect(pad2(3)).toBe('03')
    expect(pad2(14)).toBe('14')
    expect(pad2(0)).toBe('00')
  })
})
