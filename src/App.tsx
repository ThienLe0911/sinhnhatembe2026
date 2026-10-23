import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useState, type ComponentType } from 'react'
import { content } from './content/content'
import { createClock } from './lib/clock'
import { hasPreviewParam, isUnlocked } from './lib/time'
import { Countdown } from './screens/Countdown'
import { Finale } from './screens/Finale'
import { Intro } from './screens/Intro'
import { Play } from './screens/Play'
import { getBrowserStorage } from './state/progress-storage'
import { GameProvider, useGameState } from './state/GameProvider'
import { createGameStore } from './state/store'
import { Stage } from './ui/Stage'

// Các trang xem thử chỉ có ở môi trường phát triển (?tile, ?mascot, ?machine), không vào bản build phát hành.
const devPages: Record<string, ComponentType> = import.meta.env.DEV
  ? {
      tile: lazy(() => import('./dev/StyleTile')),
      mascot: lazy(() => import('./dev/MascotSheet')),
      machine: lazy(() => import('./dev/MachineSheet')),
      cards: lazy(() => import('./dev/CardSheet')),
    }
  : {}
const devPage = import.meta.env.DEV
  ? Object.keys(devPages).find((name) => new URLSearchParams(window.location.search).has(name))
  : undefined

// Màn chưa làm: finale (T16, T17) và album (T18)
function Soon({ name }: { name: string }) {
  return (
    <Stage>
      <p>{name} đang được dựng…</p>
    </Stage>
  )
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
        {screen === 'ALBUM' ? <Soon name="Album" /> : null}
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
  return <Game />
}
