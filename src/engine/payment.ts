import type { GameState, PaymentLine, RuleSet } from './types'

/**
 * Winner takes all: every other player pays the winner
 * gameFee + perPoint x their own final score (never less than the fee).
 */
export function computePayments(state: GameState, ruleSet: RuleSet): PaymentLine[] {
  if (!state.winnerId) return []
  const { perPoint, gameFee } = ruleSet.payment
  return state.standings
    .filter((s) => s.playerId !== state.winnerId)
    .map((s) => ({
      from: s.playerId,
      to: state.winnerId!,
      amount: round2(gameFee + perPoint * Math.max(0, s.score)),
    }))
}

export function totalForWinner(lines: PaymentLine[]): number {
  return round2(lines.reduce((sum, l) => sum + l.amount, 0))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}
