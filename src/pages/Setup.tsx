import { useState } from 'react'
import { huisregels, hartenjagenRuleSets, klaverjasRuleSets, klaverjasVolledig } from '../engine/rules'
import { validatePlayerCount } from '../engine/validation'
import type { GameType, Player } from '../engine/types'
import { useGameStore } from '../state/gameStore'
import { newId } from '../state/storage'
import { t } from '../ui/strings'

const MIN_PLAYERS = 4
const MAX_PLAYERS = 6

export function Setup({
  presetPlayers,
  presetGameType,
  onBack,
}: {
  presetPlayers?: Player[]
  presetGameType?: GameType
  onBack: () => void
}) {
  const { dispatch } = useGameStore()
  const [gameType, setGameType] = useState<GameType>(presetGameType ?? 'hartenjagen')
  const [names, setNames] = useState<string[]>(
    presetGameType !== 'klaverjassen' && presetPlayers
      ? presetPlayers.map((p) => p.name)
      : Array.from({ length: MIN_PLAYERS }, () => ''),
  )
  const [ruleSetId, setRuleSetId] = useState(huisregels.id)
  const [perPointCents, setPerPointCents] = useState(5)
  const [gameFeeCents, setGameFeeCents] = useState(50)
  const [turnAt, setTurnAt] = useState(100)
  // Klaverjassen: two teams, "wij/zij" by default but any two names work.
  const [teamNames, setTeamNames] = useState<string[]>(
    presetGameType === 'klaverjassen' && presetPlayers
      ? presetPlayers.map((p) => p.name)
      : [t.teamWij, t.teamZij],
  )
  const [klaverjasRuleSetId, setKlaverjasRuleSetId] = useState(klaverjasVolledig.id)
  const [firstDealerIndex, setFirstDealerIndex] = useState(0)

  const trimmed = (gameType === 'klaverjassen' ? teamNames : names).map((n) => n.trim())
  const countOk = validatePlayerCount(trimmed.length, gameType).valid
  const namesOk = trimmed.every((n) => n.length > 0)
  const canStart = countOk && namesOk

  function start() {
    const players: Player[] = trimmed.map((name) => ({ id: newId(), name }))
    if (gameType === 'klaverjassen') {
      const base = klaverjasRuleSets.find((r) => r.id === klaverjasRuleSetId) ?? klaverjasVolledig
      dispatch({
        type: 'new-game',
        players,
        ruleSet: base,
        firstDealerId: players[firstDealerIndex]?.id ?? players[0].id,
      })
      return
    }
    const base = hartenjagenRuleSets.find((r) => r.id === ruleSetId) ?? huisregels
    dispatch({
      type: 'new-game',
      players,
      ruleSet: {
        ...base,
        turnAt,
        payment: { ...base.payment, perPoint: perPointCents / 100, gameFee: gameFeeCents / 100 },
      },
    })
  }

  const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base shadow-sm outline-red-700 dark:border-stone-700 dark:bg-stone-800 dark:outline-red-400'

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6">
      <header className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold shadow-sm active:bg-stone-50 dark:bg-stone-800 dark:active:bg-stone-700">
          ← {t.back}
        </button>
        <h1 className="text-xl font-bold">{t.newGame}</h1>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold text-stone-600 dark:text-stone-300">{t.gameTypeLabel}</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['hartenjagen', 'klaverjassen'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setGameType(type)}
              className={`rounded-2xl px-3 py-3 font-bold shadow-sm ${
                gameType === type
                  ? 'bg-red-700 text-white dark:bg-red-400 dark:text-red-950'
                  : 'bg-white text-stone-600 active:bg-stone-50 dark:bg-stone-800 dark:text-stone-300 dark:active:bg-stone-700'
              }`}
            >
              {type === 'hartenjagen' ? `♥ ${t.hartenjagen}` : `♣ ${t.klaverjassen}`}
            </button>
          ))}
        </div>
      </section>

      {gameType === 'klaverjassen' ? (
        <>
          <section className="mb-6">
            <h2 className="mb-2 font-semibold text-stone-600 dark:text-stone-300">{t.teams}</h2>
            <div className="space-y-2">
              {teamNames.map((name, i) => (
                <input
                  key={i}
                  value={name}
                  onChange={(e) => setTeamNames(teamNames.map((n, j) => (j === i ? e.target.value : n)))}
                  placeholder={i === 0 ? t.teamWij : t.teamZij}
                  className={inputClass}
                  enterKeyHint="next"
                />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-2 font-semibold text-stone-600 dark:text-stone-300">{t.rules}</h2>
            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-800">
              <select
                value={klaverjasRuleSetId}
                onChange={(e) => setKlaverjasRuleSetId(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-base dark:border-stone-600 dark:bg-stone-800"
                aria-label={t.variantLabel}
              >
                {klaverjasRuleSets.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <div>
                <span className="mb-1 block text-stone-600 dark:text-stone-300">{t.firstDealer}</span>
                <div className="grid grid-cols-2 gap-2">
                  {teamNames.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => setFirstDealerIndex(i)}
                      className={`rounded-xl px-3 py-2.5 font-semibold ${
                        firstDealerIndex === i
                          ? 'bg-red-700 text-white dark:bg-red-400 dark:text-red-950'
                          : 'bg-stone-100 text-stone-600 active:bg-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:active:bg-stone-700'
                      }`}
                    >
                      {name.trim() || (i === 0 ? t.teamWij : t.teamZij)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="mb-2 font-semibold text-stone-600 dark:text-stone-300">{t.players}</h2>
            <div className="space-y-2">
              {names.map((name, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={name}
                    onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                    placeholder={t.playerName(i)}
                    className={inputClass}
                    enterKeyHint="next"
                  />
                  {names.length > MIN_PLAYERS && (
                    <button
                      onClick={() => setNames(names.filter((_, j) => j !== i))}
                      aria-label={t.removePlayer}
                      className="rounded-xl bg-white px-3 text-stone-400 shadow-sm active:bg-stone-50 dark:bg-stone-800 dark:active:bg-stone-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {names.length < MAX_PLAYERS && (
              <button
                onClick={() => setNames([...names, ''])}
                className="mt-2 text-sm font-semibold text-red-700 active:text-red-900 dark:text-red-400 dark:active:text-red-300"
              >
                {t.addPlayer}
              </button>
            )}
          </section>

          <section className="mb-8">
            <h2 className="mb-2 font-semibold text-stone-600 dark:text-stone-300">{t.rules}</h2>
            <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-800">
              <select
                value={ruleSetId}
                onChange={(e) => setRuleSetId(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-base dark:border-stone-600 dark:bg-stone-800"
              >
                {hartenjagenRuleSets.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <NumberField label={t.turnAt} value={turnAt} onChange={setTurnAt} />
              <NumberField label={t.paymentPerPoint} value={perPointCents} onChange={setPerPointCents} />
              <NumberField label={t.paymentGameFee} value={gameFeeCents} onChange={setGameFeeCents} />
            </div>
          </section>
        </>
      )}

      <button
        onClick={start}
        disabled={!canStart}
        className="mt-auto w-full rounded-2xl bg-red-700 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-red-700/20 active:bg-red-800 disabled:bg-stone-300 disabled:shadow-none dark:bg-red-400 dark:text-red-950 dark:shadow-red-400/10 dark:active:bg-red-300 dark:disabled:bg-stone-700 dark:disabled:text-stone-400"
      >
        {t.start}
      </button>
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-stone-600 dark:text-stone-300">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={0}
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        className="w-24 rounded-xl border border-stone-200 px-3 py-2 text-right text-base dark:border-stone-600 dark:bg-stone-900"
      />
    </label>
  )
}
