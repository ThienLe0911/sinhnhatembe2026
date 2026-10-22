import { lazy, Suspense, type ComponentType } from 'react'
import { Stage } from './ui/Stage'

// Các trang xem thử chỉ có ở môi trường phát triển (?tile, ?mascot), không vào bản build phát hành.
const devPages: Record<string, ComponentType> = import.meta.env.DEV
  ? {
      tile: lazy(() => import('./dev/StyleTile')),
      mascot: lazy(() => import('./dev/MascotSheet')),
      machine: lazy(() => import('./dev/MachineSheet')),
    }
  : {}
const devPage = import.meta.env.DEV
  ? Object.keys(devPages).find((name) => new URLSearchParams(window.location.search).has(name))
  : undefined

export function App() {
  if (devPage) {
    const DevPage = devPages[devPage]
    return (
      <Suspense fallback={null}>
        <DevPage />
      </Suspense>
    )
  }
  return (
    <Stage>
      <p>Đang dựng…</p>
    </Stage>
  )
}
