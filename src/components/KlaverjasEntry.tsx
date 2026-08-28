import { useState } from 'react'
import type { Game, KlaverjasRound, PlayerId, Round } from '../engine/types'
import { dealerIdForRound, potjeResult, toVariantUnits } from '../engine/klaverjas'
import { validateRound } from '../engine/validation'
import { t } from '../ui/strings'

interface Props {
  game: Game
  roundNumber: number
  onSave: (round: Round) => void
  onCancel: () => void
}

const ROEM_STEPS = [20, 50, 100]

export function KlaverjasEntry({ game, roundNumber, onSave, onCancel }: Props) {
  const rules = game.ruleSet.klaverjas!
  const total = rules.pointsPerPotje
  const teamIds = game.players.map((p) => p.id)
  const dealerId = dealerIdForRound(game, roundNumber - 1)
  // The team next to the dealer speaks first, so default trump to the non-dealer.
  const [trumpTeamId, setTrumpTeamId] = useState<PlayerId>(teamIds.find((id) => id !== dealerId)!)
  const [pitTeamId, setPitTeamId] = useState<PlayerId | null>(null)
  // Team whose points were typed (the "rest" button doesn't count): its rounding
  // takes precedence in the 'afgerond' variant.
  const [countedTeamId, setCountedTeamId] = useState<PlayerId | null>(null)
  // Draft values are strings so the field may be empty while typing (see RoundEntry).
  const [pointsDraft, setPointsDraft] = useState<Record<PlayerId, string>>(
    Object.fromEntries(teamIds.map((id) => [id, '0'])),
  )
  const [roemDraft, setRoemDraft] = useState<Record<PlayerId, string>>(
    Object.fromEntries(teamIds.map((id) => [id, String(game.draftRoem?.[id] ?? 0)])),
  )

  const toNumbers = (draft: Record<PlayerId, string>): Record<PlayerId, number> =>
    Object.fromEntries(
      teamIds.map((id) => {
        const n = parseInt(draft[id], 10)
        return [id, Number.isNaN(n) ? 0 : n]
      }),
    )
  const points = toNumbers(pointsDraft)
  const roem = toNumbers(roemDraft)
  const left = total - teamIds.reduce((sum, id) => sum + points[id], 0)

  const round: KlaverjasRound = {
    kind: 'klaverjas',
    trumpTeamId,
    points,
    roem,
    ...(countedTeamId ? { countedTeamId } : {}),
    ...(pitTeamId ? { pitTeamId } : {}),
  }
  const valid = validateRound(round, game.ruleSet, teamIds).valid
  const result = valid ? potjeResult(round, rules, teamIds) : null
  const trumpName = game.players.find((p) => p.id === trumpTeamId)!.name
  const otherName = game.players.find((p) => p.id !== trumpTeamId)!.name

  function typeDigits(raw: string, max: number): string {
    const digits = raw.replace(/\D/g, '')
    if (digits === '') return ''
    return String(Math.min(max, parseInt(digits, 10)))
  }

  function setPitTeam(id: PlayerId | null) {
    setPitTeamId(id)
    if (id) {
      setPointsDraft(Object.fromEntries(teamIds.map((tid) => [tid, tid === id ? String(total) : '0'])))
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/40" onClick={onCancel}>
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {t.potje} {roundNumber}
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
              left === 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : left < 0
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            {t.klaverjasRemaining(left)}
          </span>
        </div>
        <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
          🂠 {t.deals(game.players.find((p) => p.id === dealerId)!.name)}
        </p>

        <div className="mb-4">
          <span className="mb-1 block text-sm font-semibold text-stone-600 dark:text-stone-300">{t.trumpQuestion}</span>
          <div className="grid grid-cols-2 gap-2">
            {game.players.map((p) => (
              <button
                key={p.id}
                onClick={() => setTrumpTeamId(p.id)}
                className={`rounded-xl px-3 py-2.5 font-semibold ${
                  trumpTeamId === p.id
                    ? 'bg-red-700 text-white dark:bg-red-400 dark:text-red-950'
                    : 'bg-stone-100 text-stone-600 active:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:active:bg-stone-700'
                }`}
              >
                ♣ {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {game.players.map((p) => (
            <div key={p.id} className="rounded-2xl bg-stone-50 p-3 dark:bg-stone-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                <button
                  onClick={() => setPitTeam(pitTeamId === p.id ? null : p.id)}
                  className={`h-9 rounded-xl px-3 text-xs font-bold ${
                    pitTeamId === p.id
                      ? 'bg-red-700 text-white dark:bg-red-400 dark:text-red-950'
                      : 'bg-red-50 text-red-700 active:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:active:bg-red-900'
                  }`}
                >
                  💥 {t.pit}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 text-sm text-stone-500 dark:text-stone-400">{t.points}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pointsDraft[p.id]}
                  disabled={pitTeamId !== null}
                  onFocus={(e) => {
                    if (pointsDraft[p.id] === '0') setPointsDraft((d) => ({ ...d, [p.id]: '' }))
                    else e.target.select()
                  }}
                  onChange={(e) => {
                    setCountedTeamId((prev) => prev ?? p.id)
                    setPointsDraft((d) => ({ ...d, [p.id]: typeDigits(e.target.value, total) }))
                  }}
                  onBlur={() => {
                    if (pointsDraft[p.id] === '') setPointsDraft((d) => ({ ...d, [p.id]: '0' }))
                  }}
                  className="h-11 w-20 rounded-xl border border-stone-200 bg-white text-center text-lg font-bold tabular-nums disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900"
                />
                <button
                  onClick={() => {
                    // "rest" derives this team's score, so the other team is the counted one.
                    setCountedTeamId(teamIds.find((id) => id !== p.id)!)
                    setPointsDraft((d) => ({ ...d, [p.id]: String(Math.max(0, points[p.id] + left)) }))
                  }}
                  disabled={pitTeamId !== null || left <= 0}
                  className="h-11 rounded-xl bg-stone-100 px-3 text-xs font-bold text-stone-500 active:bg-stone-200 disabled:opacity-30 dark:bg-stone-900 dark:text-stone-400 dark:active:bg-stone-700"
                >
                  rest
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="w-14 text-sm text-stone-500 dark:text-stone-400">{t.roem}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={roemDraft[p.id]}
                  onFocus={(e) => {
                    if (roemDraft[p.id] === '0') setRoemDraft((d) => ({ ...d, [p.id]: '' }))
                    else e.target.select()
                  }}
                  onChange={(e) => setRoemDraft((d) => ({ ...d, [p.id]: typeDigits(e.target.value, 9990) }))}
                  onBlur={() => {
                    if (roemDraft[p.id] === '') setRoemDraft((d) => ({ ...d, [p.id]: '0' }))
                  }}
                  className="h-11 w-20 rounded-xl border border-stone-200 bg-white text-center text-lg font-bold tabular-nums dark:border-stone-700 dark:bg-stone-900"
                />
                {ROEM_STEPS.map((step) => (
                  <button
                    key={step}
                    onClick={() => setRoemDraft((d) => ({ ...d, [p.id]: String(roem[p.id] + step) }))}
                    className="h-11 rounded-xl bg-stone-100 px-2.5 text-xs font-bold text-stone-500 active:bg-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:active:bg-stone-700"
                  >
                    +{step}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {result && (
          <div
            className={`mt-3 rounded-2xl px-4 py-2.5 text-sm font-semibold ${
              result.nat
                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            {result.nat && <div>💦 {t.natWarning(trumpName, otherName)}</div>}
            {pitTeamId && (
              <div>
                {t.pitWarning(
                  game.players.find((p) => p.id === pitTeamId)!.name,
                  toVariantUnits(rules.pitBonus, rules),
                )}
              </div>
            )}
            <div className="tabular-nums">
              {game.players.map((p) => `${p.name} +${result.deltas[p.id] ?? 0}`).join(' · ')}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={onCancel} className="w-1/3 rounded-2xl bg-stone-100 py-3 font-bold text-stone-600 active:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:active:bg-stone-700">
            {t.cancel}
          </button>
          <button
            onClick={() => onSave(round)}
            disabled={!valid}
            className="w-2/3 rounded-2xl bg-red-700 py-3 font-bold text-white active:bg-red-800 disabled:bg-stone-300 dark:bg-red-400 dark:text-red-950 dark:active:bg-red-300 dark:disabled:bg-stone-700 dark:disabled:text-stone-400"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
