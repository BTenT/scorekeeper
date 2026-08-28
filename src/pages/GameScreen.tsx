import { useState } from 'react'
import type { Game, GameType, Player, Round } from '../engine/types'
import { computeState, roundDeltas, stateHistory } from '../engine/scoring'
import { computePayments, formatEuro, totalForWinner } from '../engine/payment'
import { dealerIdForRound, isKlaverjas, potjeResult } from '../engine/klaverjas'
import { useGameStore } from '../state/gameStore'
import { RoundEntry } from '../components/RoundEntry'
import { KlaverjasEntry } from '../components/KlaverjasEntry'
import { t } from '../ui/strings'

interface Props {
  game: Game
  onClose: () => void
  onRematch: (players: Player[], gameType: GameType) => void
}

const ROEM_STEPS = [20, 50, 100]

export function GameScreen({ game, onClose, onRematch }: Props) {
  const { dispatch } = useGameStore()
  const [entering, setEntering] = useState(false)
  const klaverjas = isKlaverjas(game.ruleSet) ? game.ruleSet.klaverjas! : null
  const state = computeState(game)
  const history = stateHistory(game)
  const winner = game.players.find((p) => p.id === state.winnerId) ?? null
  const lowest = Math.min(...state.standings.map((s) => s.score))
  const highest = Math.max(...state.standings.map((s) => s.score))
  // No highlights before the first round or while everyone is tied.
  // Klaverjassen: high is good, so only the leading team gets a (green) highlight.
  const highlightActive = !winner && game.rounds.length > 0 && lowest !== highest
  const dealer = klaverjas ? game.players.find((p) => p.id === dealerIdForRound(game, game.rounds.length))! : null
  const draftRoem: Record<string, number> = Object.fromEntries(
    game.players.map((p) => [p.id, game.draftRoem?.[p.id] ?? 0]),
  )

  function addRound(round: Round) {
    dispatch({ type: 'add-round', gameId: game.id, round })
    setEntering(false)
  }

  return (
    <div className="flex h-dvh flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="mb-4 flex shrink-0 items-center justify-between">
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

      {/* Return game banner */}
      {state.phase === 'down' && !winner && (
        <div className="mb-3 shrink-0 rounded-2xl bg-red-100 px-4 py-2 text-center text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-400">
          ↓ {t.returnBanner}
        </div>
      )}

      {/* Standings */}
      <div className="mb-3 grid shrink-0 grid-cols-2 gap-2">
        {state.standings.map((s) => {
          const player = game.players.find((p) => p.id === s.playerId)!
          const isWinner = s.playerId === state.winnerId
          const isLowest = highlightActive && !klaverjas && s.score === lowest
          const isHighest = highlightActive && !klaverjas && s.score === highest
          const isLeading = highlightActive && !!klaverjas && s.score === highest
          return (
            <div
              key={s.playerId}
              className={`rounded-2xl p-3 shadow-sm ${
                isWinner
                  ? 'bg-amber-100 ring-2 ring-amber-400 dark:bg-amber-950 dark:ring-amber-500'
                  : isLowest || isLeading
                    ? 'bg-green-50 ring-2 ring-green-500 dark:bg-green-950 dark:ring-green-500'
                    : isHighest
                      ? 'bg-orange-50 ring-2 ring-orange-500 dark:bg-orange-950 dark:ring-orange-500'
                      : 'bg-white dark:bg-stone-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate font-semibold">{isWinner ? '🏆 ' : ''}{player.name}</span>
                {(isLowest || isLeading) && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                    {isLeading ? t.leading : t.lowest}
                  </span>
                )}
                {isHighest && (
                  <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    {t.highest}
                  </span>
                )}
              </div>
              <div className="text-3xl font-black tabular-nums">
                {s.score}
                {klaverjas && <span className="text-sm font-semibold text-stone-400 dark:text-stone-500"> / {klaverjas.target}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scrollable middle: winner card + score history */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {winner && (
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-800">
            <h2 className="mb-1 text-xl font-black text-amber-600 dark:text-amber-400">
              🏆 {klaverjas ? t.teamWins(winner.name) : t.winner(winner.name)}
            </h2>
            {/* Klaverjassen has no payout scheme, so the settlement stays hidden. */}
            {!klaverjas && (
              <>
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
                <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">{t.paymentsNote}</p>
              </>
            )}
            <button
              onClick={() => onRematch(game.players, game.ruleSet.gameType ?? 'hartenjagen')}
              className="mt-4 w-full rounded-2xl bg-red-700 px-4 py-3 font-bold text-white active:bg-red-800 dark:bg-red-400 dark:text-red-950 dark:active:bg-red-300"
            >
              {t.newGameSamePlayers}
            </button>
          </div>
        )}

        {game.rounds.length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm dark:bg-stone-800">
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
                {game.rounds.slice(0, history.length).map((round, i) => {
                  const deltas = roundDeltas(round, game.ruleSet, game.players.map((p) => p.id))
                  const isPit = round.kind === 'pit' || (round.kind === 'klaverjas' && !!round.pitTeamId)
                  const isNat =
                    round.kind === 'klaverjas' &&
                    potjeResult(round, klaverjas!, game.players.map((p) => p.id)).nat
                  return (
                    <tr key={i} className="border-b border-stone-100 last:border-0 dark:border-stone-700">
                      <td className="whitespace-nowrap px-3 py-1.5 text-stone-400 dark:text-stone-500">
                        {i + 1}
                        {isPit ? ' 💥' : ''}
                        {isNat && <span className="ml-1 font-bold text-red-700 dark:text-red-400">{t.nat}</span>}
                      </td>
                      {game.players.map((p) => (
                        <td key={p.id} className="px-3 py-1.5 text-right">
                          {round.kind === 'klaverjas' && round.trumpTeamId === p.id && (
                            <span className="text-stone-400 dark:text-stone-500">♣ </span>
                          )}
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
      </div>

      {/* Fixed bottom actions: always visible, never scrolled away */}
      {!winner && !state.pendingTie && (
        <div className="shrink-0 space-y-1 pt-2">
          {/* Klaverjassen: tally roem live during the potje; it flows into the next entry. */}
          {klaverjas && (
            <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-stone-800">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-stone-600 dark:text-stone-300">
                  {t.roem} · {t.potje.toLowerCase()} {game.rounds.length + 1}
                </span>
                <span className="text-stone-400 dark:text-stone-500">🂠 {t.deals(dealer!.name)}</span>
              </div>
              <div className="space-y-1.5">
                {game.players.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="w-16 truncate text-sm font-semibold">{p.name}</span>
                    <span className="w-12 text-right text-lg font-bold tabular-nums">{draftRoem[p.id]}</span>
                    {ROEM_STEPS.map((step) => (
                      <button
                        key={step}
                        onClick={() =>
                          dispatch({
                            type: 'set-draft-roem',
                            gameId: game.id,
                            roem: { ...draftRoem, [p.id]: draftRoem[p.id] + step },
                          })
                        }
                        className="h-11 flex-1 rounded-xl bg-stone-100 text-xs font-bold text-stone-500 active:bg-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:active:bg-stone-700"
                      >
                        +{step}
                      </button>
                    ))}
                    <button
                      onClick={() => dispatch({ type: 'set-draft-roem', gameId: game.id, roem: { ...draftRoem, [p.id]: 0 } })}
                      disabled={draftRoem[p.id] === 0}
                      className="h-11 rounded-xl bg-stone-100 px-2 text-xs font-bold text-stone-400 active:bg-stone-200 disabled:opacity-30 dark:bg-stone-900 dark:text-stone-500 dark:active:bg-stone-700"
                    >
                      ⟲
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            {klaverjas ? t.enterPotje : t.enterRound}
          </button>
        </div>
      )}

      {/* Tie: multiple players below 0 in the same round */}
      {state.pendingTie && !winner && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 dark:bg-stone-900">
            <h3 className="mb-1 text-center text-lg font-bold">{t.tieTitle}</h3>
            <p className="mb-4 text-center text-stone-500 dark:text-stone-400">{t.tieQuestion}</p>
            <div className="space-y-2">
              {state.pendingTie.map((id) => {
                const player = game.players.find((p) => p.id === id)!
                const score = state.standings.find((s) => s.playerId === id)!.score
                return (
                  <button
                    key={id}
                    onClick={() => dispatch({ type: 'set-tie-winner', gameId: game.id, playerId: id })}
                    className="w-full rounded-2xl bg-red-700 py-3 font-bold text-white active:bg-red-800 dark:bg-red-400 dark:text-red-950 dark:active:bg-red-300"
                  >
                    {player.name} ({score})
                  </button>
                )
              })}
              <button
                onClick={() => dispatch({ type: 'undo-round', gameId: game.id })}
                className="w-full rounded-2xl bg-stone-100 py-3 font-bold text-stone-600 active:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:active:bg-stone-700"
              >
                ↩︎ {t.undoRound}
              </button>
            </div>
          </div>
        </div>
      )}

      {entering &&
        (klaverjas ? (
          <KlaverjasEntry
            game={game}
            roundNumber={game.rounds.length + 1}
            onSave={addRound}
            onCancel={() => setEntering(false)}
          />
        ) : (
          <RoundEntry
            game={game}
            roundNumber={game.rounds.length + 1}
            onSave={addRound}
            onCancel={() => setEntering(false)}
          />
        ))}
    </div>
  )
}
