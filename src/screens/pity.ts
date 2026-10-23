/** Dòng "pity" cho vui: còn bao nhiêu lần quay nữa là chắc chắn có capsule vàng (FR-14). */
export function pityText(spinsUntilGold: number): string {
  if (spinsUntilGold <= 0) return ''
  if (spinsUntilGold === 1) return 'Lần quay tiếp theo chắc chắn ra capsule vàng!'
  return `Còn ${spinsUntilGold} lần quay nữa là chắc chắn có capsule vàng`
}
