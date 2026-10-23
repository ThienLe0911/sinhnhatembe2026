import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import type { GameState } from './game'
import type { GameStore } from './store'

const GameContext = createContext<GameStore | null>(null)

export function GameProvider({ store, children }: { store: GameStore; children: ReactNode }) {
  return <GameContext.Provider value={store}>{children}</GameContext.Provider>
}

export function useGameStore(): GameStore {
  const store = useContext(GameContext)
  if (!store) throw new Error('useGameStore phải nằm trong GameProvider')
  return store
}

export function useGameState(): GameState {
  const store = useGameStore()
  return useSyncExternalStore(store.subscribe, store.getState)
}
