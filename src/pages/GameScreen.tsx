import { useState } from 'react'
import type { Game, Player, Round } from '../engine/types'
import { computeState, roundDeltas, stateHistory } from '../engine/scoring'
import { computePayments, formatEuro, totalForWinner } from '../engine/payment'
import { useGameStore } from '../state/gameStore'
import { RoundEntry } from '../components/RoundEntry'
import { t } from '../ui/strings'

interface Props {
  game: Game
  onClose: () => void
  onRematch: (players: Player[]) => void
}

export function GameScreen({ game, onClose, onRematch }: Props) {
  const { dispatch } = useGameStore()
  const [entering, setEntering] = useState(false)
  const state = computeState(game)
  const history = stateHistory(game)
  const winner = game.players.find((p) => p.id === state.winnerId) ?? null

  function addRound(round: Round) {
    dispatch({ type: 'add-round', gameId: game.id, round })
    setEntering(false)
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6">
      <header className="mb-4 flex items-center justify-between">
        <button onClick={onClose} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold shadow-sm active:bg-stone-50 dark:bg-stone-800 dark:active:bg-stone-700">
          ← {t.back}
        </button>
        <button
          onClick={() => {
            if (confirm(t.deleteConfirm)) dispatch({ type: 'delete-game', gameId: game.id })
          }}
          className="text-sm text-stone-400 active:text-red-700 dark:text-stone-500 dark:active:text-red-400"
        >
          {t.deleteGame}
        </button>
      </header>

      {/* Standings */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {state.standings.map((s) => {
          const player = game.players.find((p) => p.id === s.playerId)!
          const isWinner = s.playerId === state.winnerId
          return (
            <div
              key={s.playerId}
              className={`rounded-2xl p-3 shadow-sm ${isWinner ? 'bg-amber-100 ring-2 ring-amber-400 dark:bg-amber-950 dark:ring-amber-500' : 'bg-white dark:bg-stone-800'}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate font-semibold">{isWinner ? '🏆 ' : ''}{player.name}</span>
                {s.phase === 'down' && !isWinner && (
                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-400">
                    ↓ {t.returnPhase}
                  </span>
                )}
              </div>
              <div className="text-3xl font-black tabular-nums">{s.score}</div>
            </div>
          )
        })}
      </div>

      {/* Winner + payments */}
      {winner && (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-800">
          <h2 className="mb-1 text-xl font-black text-amber-600 dark:text-amber-400">🏆 {t.winner(winner.name)}</h2>
          <h3 className="mb-2 font-semibold text-stone-600 dark:text-stone-300">{t.payments}</h3>
          <ul className="space-y-1">
            {computePayments(state, game.ruleSet).map((line) => {
              const from = game.players.find((p) => p.id === line.from)!
              return (
                <li key={line.from} className="flex justify-between text-stone-700 dark:text-stone-200">
                  <span>{t.pays(from.name, formatEuro(line.amount), winner.name)}</span>
                </li>
              )
            })}
            <li className="mt-1 flex justify-between border-t border-stone-200 pt-2 font-bold dark:border-stone-600">
              <span>{t.receivesTotal(winner.name, formatEuro(totalForWinner(computePayments(state, game.ruleSet))))}</span>
            </li>
          </ul>
          <button
            onClick={() => onRematch(game.players)}
            className="mt-4 w-full rounded-2xl bg-red-700 px-4 py-3 font-bold text-white active:bg-red-800 dark:bg-red-400 dark:text-red-950 dark:active:bg-red-300"
          >
            {t.newGameSamePlayers}
          </button>
        </div>
      )}

      {/* History */}
      {game.rounds.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-stone-800">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-500 dark:border-stone-700 dark:text-stone-400">
                <th className="px-3 py-2 font-semibold">#</th>
                {game.players.map((p) => (
                  <th key={p.id} className="px-3 py-2 text-right font-semibold">
                    {p.name.slice(0, 6)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {game.rounds.map((round, i) => {
                const deltas = roundDeltas(round, game.ruleSet, game.players.map((p) => p.id))
                return (
                  <tr key={i} className="border-b border-stone-100 last:border-0 dark:border-stone-700">
                    <td className="px-3 py-1.5 text-stone-400 dark:text-stone-500">
                      {i + 1}
                      {round.kind === 'pit' ? ' 💥' : ''}
                    </td>
                    {game.players.map((p) => (
                      <td key={p.id} className="px-3 py-1.5 text-right">
                        <span className="text-stone-400 dark:text-stone-500">{deltas[p.id] !== 0 ? deltas[p.id] : '·'}</span>{' '}
                        <span className="font-semibold">{history[i].standings.find((s) => s.playerId === p.id)!.score}</span>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!winner && (
        <div className="mt-auto space-y-2">
          {game.rounds.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'undo-round', gameId: game.id })}
              className="w-full rounded-2xl py-2 text-sm font-semibold text-stone-500 active:text-stone-800 dark:text-stone-400 dark:active:text-stone-200"
            >
              ↩︎ {t.undoRound}
            </button>
          )}
          <button
            onClick={() => setEntering(true)}
            className="w-full rounded-2xl bg-red-700 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-red-700/20 active:bg-red-800 dark:bg-red-400 dark:text-red-950 dark:shadow-red-400/10 dark:active:bg-red-300"
          >
            {t.enterRound}
          </button>
        </div>
      )}

      {entering && (
        <RoundEntry
          game={game}
          roundNumber={game.rounds.length + 1}
          onSave={addRound}
          onCancel={() => setEntering(false)}
        />
      )}
    </div>
  )
}
