import { useState } from 'react'
import type { Game, PitChoice, PlayerId, Round } from '../engine/types'
import { validateRound } from '../engine/validation'
import { t } from '../ui/strings'

interface Props {
  game: Game
  roundNumber: number
  onSave: (round: Round) => void
  onCancel: () => void
}

export function RoundEntry({ game, roundNumber, onSave, onCancel }: Props) {
  const [points, setPoints] = useState<Record<PlayerId, number>>(
    Object.fromEntries(game.players.map((p) => [p.id, 0])),
  )
  const [pitPlayer, setPitPlayer] = useState<PlayerId | null>(null)
  const total = game.ruleSet.pointsPerRound
  const used = Object.values(points).reduce((a, b) => a + b, 0)
  const left = total - used

  const round: Round = { kind: 'points', points }
  const valid = validateRound(round, game.ruleSet, game.players.map((p) => p.id)).valid

  function setPlayerPoints(id: PlayerId, value: number) {
    setPoints({ ...points, [id]: Math.max(0, Math.min(total, value)) })
  }

  function savePit(choice: PitChoice) {
    if (pitPlayer) onSave({ kind: 'pit', playerId: pitPlayer, choice })
  }

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/40" onClick={onCancel}>
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {t.round} {roundNumber}
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
              left === 0 ? 'bg-green-100 text-green-700' : left < 0 ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {left < 0 ? t.tooMany(-left) : t.remaining(left, total)}
          </span>
        </div>

        <div className="space-y-2">
          {game.players.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-24 truncate font-semibold">{p.name}</span>
              <button
                onClick={() => setPlayerPoints(p.id, points[p.id] - 1)}
                className="h-11 w-11 rounded-xl bg-stone-100 text-xl font-bold active:bg-stone-200"
                aria-label={`${p.name} -1`}
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={total}
                value={points[p.id]}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPlayerPoints(p.id, Math.floor(Number(e.target.value) || 0))}
                className="h-11 w-14 rounded-xl border border-stone-200 text-center text-lg font-bold tabular-nums"
              />
              <button
                onClick={() => setPlayerPoints(p.id, points[p.id] + 1)}
                className="h-11 w-11 rounded-xl bg-stone-100 text-xl font-bold active:bg-stone-200"
                aria-label={`${p.name} +1`}
              >
                +
              </button>
              <button
                onClick={() => setPlayerPoints(p.id, points[p.id] + left)}
                disabled={left <= 0}
                className="h-11 rounded-xl bg-stone-100 px-2 text-xs font-bold text-stone-500 active:bg-stone-200 disabled:opacity-30"
              >
                rest
              </button>
              <button
                onClick={() => setPitPlayer(p.id)}
                className="h-11 rounded-xl bg-red-50 px-2 text-xs font-bold text-red-700 active:bg-red-100"
              >
                {t.pit}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onCancel} className="w-1/3 rounded-2xl bg-stone-100 py-3 font-bold text-stone-600 active:bg-stone-200">
            {t.cancel}
          </button>
          <button
            onClick={() => onSave(round)}
            disabled={!valid}
            className="w-2/3 rounded-2xl bg-red-700 py-3 font-bold text-white active:bg-red-800 disabled:bg-stone-300"
          >
            {t.save}
          </button>
        </div>

        {pitPlayer && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6" onClick={() => setPitPlayer(null)}>
            <div className="w-full max-w-sm rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-4 text-center text-lg font-bold">
                💥 {t.pitTitle(game.players.find((p) => p.id === pitPlayer)!.name)}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => savePit('self')}
                  className="w-full rounded-2xl bg-red-700 py-3 font-bold text-white active:bg-red-800"
                >
                  {t.pitSelf(game.ruleSet.pit.selfDelta)}
                </button>
                <button
                  onClick={() => savePit('others')}
                  className="w-full rounded-2xl bg-red-700 py-3 font-bold text-white active:bg-red-800"
                >
                  {t.pitOthers(game.ruleSet.pit.othersDelta)}
                </button>
                <button
                  onClick={() => setPitPlayer(null)}
                  className="w-full rounded-2xl bg-stone-100 py-3 font-bold text-stone-600 active:bg-stone-200"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
