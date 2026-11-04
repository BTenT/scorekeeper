import type { RuleSet } from '../engine/types'
import { isKlaverjas, toVariantUnits } from '../engine/klaverjas'
import { formatEuro, playsForMoney } from '../engine/payment'
import { ruleSets } from '../engine/rules'
import { hasReturnGame } from '../engine/scoring'
import { t } from '../ui/strings'

function sectionsFor(ruleSet: RuleSet) {
  if (isKlaverjas(ruleSet)) {
    const rules = ruleSet.klaverjas!
    return t.rulesKlaverjassen(t.rulesKlaverjasTelling[rules.variant], toVariantUnits(rules.pitBonus, rules))
  }
  return t.rulesHartenjagen({
    pointsPerRound: ruleSet.pointsPerRound,
    cards: ruleSet.cards.map((c) => `${c.label.toLowerCase()} ${c.count > 1 ? `${c.count} × ${c.value}` : c.value}`).join(', '),
    selfDelta: ruleSet.pit.selfDelta,
    othersDelta: ruleSet.pit.othersDelta,
    turnAt: ruleSet.turnAt,
    returnGame: hasReturnGame(ruleSet),
    payment: playsForMoney(ruleSet)
      ? { gameFee: formatEuro(ruleSet.payment.gameFee), perPoint: formatEuro(ruleSet.payment.perPoint) }
      : null,
  })
}

export function RulesDialog({ ruleSet, onClose }: { ruleSet: RuleSet; onClose: () => void }) {
  // A saved game keeps its rule set, including the name it had back then; show the current name.
  const name = ruleSets.find((r) => r.id === ruleSet.id)?.name ?? ruleSet.name
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.rules}
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{t.rules}</h2>
        <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
          {isKlaverjas(ruleSet) ? t.klaverjassen : t.hartenjagen} · {name}
        </p>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {sectionsFor(ruleSet).map((section) => (
            <section key={section.title}>
              <h3 className="mb-1 font-semibold text-stone-600 dark:text-stone-300">{section.title}</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700 dark:text-stone-200">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 h-12 w-full shrink-0 rounded-2xl bg-stone-100 font-bold text-stone-600 active:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:active:bg-stone-700"
        >
          {t.close}
        </button>
      </div>
    </div>
  )
}
