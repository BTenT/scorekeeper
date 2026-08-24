import { useState } from 'react'
import { GameStoreProvider, useActiveGame, useGameStore } from './state/gameStore'
import { Home } from './pages/Home'
import { Setup } from './pages/Setup'
import { GameScreen } from './pages/GameScreen'
import type { Player } from './engine/types'

export type View = { name: 'home' } | { name: 'setup'; presetPlayers?: Player[] }

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
        onRematch={(players) => {
          dispatch({ type: 'close-game' })
          setView({ name: 'setup', presetPlayers: players })
        }}
      />
    )
  }

  if (view.name === 'setup') {
    return <Setup presetPlayers={view.presetPlayers} onBack={() => setView({ name: 'home' })} />
  }

  return <Home onNewGame={() => setView({ name: 'setup' })} />
}

function App() {
  return (
    <GameStoreProvider>
      <div className="min-h-dvh bg-stone-100 text-stone-900" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto max-w-md">
          <Shell />
        </div>
      </div>
    </GameStoreProvider>
  )
}

export default App
