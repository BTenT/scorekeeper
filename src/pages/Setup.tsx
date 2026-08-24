import { useState } from 'react'
import { huisregels, ruleSets } from '../engine/rules'
import { validatePlayerCount } from '../engine/validation'
import type { Player } from '../engine/types'
import { useGameStore } from '../state/gameStore'
import { newId } from '../state/storage'
import { t } from '../ui/strings'

const MIN_PLAYERS = 4
const MAX_PLAYERS = 6

export function Setup({ presetPlayers, onBack }: { presetPlayers?: Player[]; onBack: () => void }) {
  const { dispatch } = useGameStore()
  const [names, setNames] = useState<string[]>(
    presetPlayers?.map((p) => p.name) ?? Array.from({ length: MIN_PLAYERS }, () => ''),
  )
  const [ruleSetId, setRuleSetId] = useState(huisregels.id)
  const [perPointCents, setPerPointCents] = useState(5)
  const [gameFeeCents, setGameFeeCents] = useState(50)
  const [turnAt, setTurnAt] = useState(100)

  const trimmed = names.map((n) => n.trim())
  const countOk = validatePlayerCount(trimmed.length).valid
  const namesOk = trimmed.every((n) => n.length > 0)
  const canStart = countOk && namesOk

  function start() {
    const base = ruleSets.find((r) => r.id === ruleSetId) ?? huisregels
    const players: Player[] = trimmed.map((name) => ({ id: newId(), name }))
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

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6">
      <header className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold shadow-sm active:bg-stone-50">
          ← {t.back}
        </button>
        <h1 className="text-xl font-bold">{t.newGame}</h1>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold text-stone-600">{t.players}</h2>
        <div className="space-y-2">
          {names.map((name, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                placeholder={t.playerName(i)}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base shadow-sm outline-red-700"
                enterKeyHint="next"
              />
              {names.length > MIN_PLAYERS && (
                <button
                  onClick={() => setNames(names.filter((_, j) => j !== i))}
                  aria-label={t.removePlayer}
                  className="rounded-xl bg-white px-3 text-stone-400 shadow-sm active:bg-stone-50"
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
            className="mt-2 text-sm font-semibold text-red-700 active:text-red-900"
          >
            {t.addPlayer}
          </button>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-semibold text-stone-600">{t.rules}</h2>
        <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
          <select
            value={ruleSetId}
            onChange={(e) => setRuleSetId(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-base"
          >
            {ruleSets.map((r) => (
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

      <button
        onClick={start}
        disabled={!canStart}
        className="mt-auto w-full rounded-2xl bg-red-700 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-red-700/20 active:bg-red-800 disabled:bg-stone-300 disabled:shadow-none"
      >
        {t.start}
      </button>
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-stone-600">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={0}
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        className="w-24 rounded-xl border border-stone-200 px-3 py-2 text-right text-base"
      />
    </label>
  )
}
