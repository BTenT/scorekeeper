import { useState } from 'react'
import { GameStoreProvider, useActiveGame, useGameStore } from './state/gameStore'
import { Home } from './pages/Home'
import { Setup } from './pages/Setup'
import { GameScreen } from './pages/GameScreen'
import type { GameType, Player } from './engine/types'

export type View = { name: 'home' } | { name: 'setup'; presetPlayers?: Player[]; presetGameType?: GameType }

function Shell() {
  const [view, setView] = useState<View>({ name: 'home' })
  const { dispatch } = useGameStore()
  const activeGame = useActiveGame()

  if (activeGame) {
    return (
      <GameScreen
        game={activeGame}
        onClose={() => {
          dispatch({ type: 'close-game' })
          setView({ name: 'home' })
        }}
        onRematch={(players, gameType) => {
          dispatch({ type: 'close-game' })
          setView({ name: 'setup', presetPlayers: players, presetGameType: gameType })
        }}
      />
    )
  }

  if (view.name === 'setup') {
    return <Setup presetPlayers={view.presetPlayers} presetGameType={view.presetGameType} onBack={() => setView({ name: 'home' })} />
  }

  return <Home onNewGame={() => setView({ name: 'setup' })} />
}

function App() {
  return (
    <GameStoreProvider>
      <div className="min-h-dvh bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <div className="mx-auto max-w-md">
          <Shell />
        </div>
        {/* Keeps scrolled content from running under the status bar in the native apps. */}
        <div className="fixed inset-x-0 top-0 h-[env(safe-area-inset-top)] bg-stone-100 dark:bg-stone-950" />
      </div>
    </GameStoreProvider>
  )
}

export default App
