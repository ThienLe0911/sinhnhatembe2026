import { lazy, Suspense } from 'react'
import { Stage } from './ui/Stage'

// Style tile chỉ có ở môi trường phát triển (?tile), không vào bản build phát hành.
const StyleTile = import.meta.env.DEV ? lazy(() => import('./dev/StyleTile')) : null
const showTile = import.meta.env.DEV && new URLSearchParams(window.location.search).has('tile')

export function App() {
  if (StyleTile && showTile) {
    return (
      <Suspense fallback={null}>
        <StyleTile />
      </Suspense>
    )
  }
  return (
    <Stage>
      <p>Đang dựng…</p>
    </Stage>
  )
}
