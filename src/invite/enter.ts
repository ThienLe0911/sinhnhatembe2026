import { springs } from '../ui/motion'

// Mỗi khối hiện lên lần lượt; MotionProvider tự bỏ phần dịch chuyển khi bật giảm chuyển động
export const enter = (index: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { ...springs.soft, delay: 0.08 * index },
})
