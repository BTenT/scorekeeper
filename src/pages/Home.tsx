import { useGameStore } from '../state/gameStore'
import { computeState } from '../engine/scoring'
import { t } from '../ui/strings'

export function Home({ onNewGame }: { onNewGame: () => void }) {
  const { state, dispatch } = useGameStore()

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-red-700 dark:text-red-400">
          ♥ {t.appName}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">{t.subtitle}</p>
      </header>

      <button
        onClick={onNewGame}
        className="mb-6 w-full rounded-2xl bg-red-700 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-red-700/20 active:bg-red-800 dark:bg-red-400 dark:text-red-950 dark:shadow-red-400/10 dark:active:bg-red-300"
      >
        {t.newGame}
      </button>

      {state.games.length === 0 ? (
        <p className="text-center text-stone-400 dark:text-stone-500">{t.noGames}</p>
      ) : (
        <ul className="space-y-3">
          {state.games.map((game) => {
            const gameState = computeState(game)
            const winner = game.players.find((p) => p.id === gameState.winnerId)
            const date = new Date(game.createdAt).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            return (
              <li key={game.id}>
                <button
                  onClick={() => dispatch({ type: 'open-game', gameId: game.id })}
                  className="w-full rounded-2xl bg-white p-4 text-left shadow-sm active:bg-stone-50 dark:bg-stone-800 dark:active:bg-stone-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {game.players.map((p) => p.name).join(', ')}
                    </span>
                    <span
                      className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        winner
                          ? 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}
                    >
                      {winner ? t.finished : t.inProgress}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {date} · {game.rounds.length} {t.round.toLowerCase()}s
                    {winner ? ` · ${t.winner(winner.name)}` : ''}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
