import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { content } from './content/content'
import { createClock } from './lib/clock'
import { preloadCardMedia } from './lib/preload'
import { hasPreviewParam, isUnlocked } from './lib/time'
import { Album } from './screens/Album'
import { Countdown } from './screens/Countdown'
import { Finale } from './screens/Finale'
import { Intro } from './screens/Intro'
import { Play } from './screens/Play'
import { GameProvider, useGameState } from './state/GameProvider'
import { getBrowserStorage } from './state/progress-storage'
import { createGameStore } from './state/store'
import { ErrorBoundary } from './ui/ErrorBoundary'

// Các trang xem thử chỉ có ở môi trường phát triển (?tile, ?mascot, ?machine, ?cards),
// không vào bản build phát hành.
const devPages: Record<string, ComponentType> = import.meta.env.DEV
  ? {
      tile: lazy(() => import('./dev/StyleTile')),
      mascot: lazy(() => import('./dev/MascotSheet')),
      machine: lazy(() => import('./dev/MachineSheet')),
      cards: lazy(() => import('./dev/CardSheet')),
    }
  : {}
const devParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
const devPage = devParams ? Object.keys(devPages).find((name) => devParams.has(name)) : undefined
// ?crash giả lập một màn bị lỗi để thử màn dự phòng (chỉ môi trường phát triển)
const simulateCrash = devParams?.has('crash') ?? false

function CrashProbe(): null {
  throw new Error('Lỗi giả lập bằng ?crash')
}

function Screens({ now }: { now: () => number }) {
  const { screen } = useGameState()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {screen === 'COUNTDOWN' ? <Countdown now={now} /> : null}
        {screen === 'INTRO' ? <Intro /> : null}
        {screen === 'PLAY' ? <Play /> : null}
        {screen === 'FINALE' ? <Finale /> : null}
        {screen === 'ALBUM' ? <Album /> : null}
        {simulateCrash && screen === 'PLAY' ? <CrashProbe /> : null}
      </motion.div>
    </AnimatePresence>
  )
}

function Game() {
  const [{ store, now }] = useState(() => {
    const search = window.location.search
    const preview = hasPreviewParam(search)
    const clock = createClock(search)
    return {
      now: clock,
      store: createGameStore({
        content,
        storage: getBrowserStorage(),
        unlocked: isUnlocked(clock(), { preview }),
        preview,
      }),
    }
  })

  // Tải trước ảnh của thẻ đầu tiên để lần mở thẻ đầu không bị chờ
  useEffect(() => {
    const first = content.capsules.find((c) => c.card.kind !== 'finale')
    if (first) preloadCardMedia(first.card)
  }, [])

  return (
    <GameProvider store={store}>
      <Screens now={now} />
    </GameProvider>
  )
}

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
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  )
}
