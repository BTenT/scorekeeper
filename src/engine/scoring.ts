import type { Game, GameState, Phase, PlayerId, Round, RuleSet } from './types'

/**
 * Direct score delta per player for a round.
 * - Points rounds return points taken; the caller inverts them in the return game.
 * - Pit deltas (-25 self / +25 others) are absolute score adjustments, never inverted.
 */
export function roundDeltas(round: Round, ruleSet: RuleSet, playerIds: PlayerId[]): Record<PlayerId, number> {
  const deltas: Record<PlayerId, number> = {}
  for (const id of playerIds) {
    if (round.kind === 'points') {
      deltas[id] = round.points[id] ?? 0
    } else if (id === round.playerId) {
      deltas[id] = round.choice === 'self' ? ruleSet.pit.selfDelta : 0
    } else {
      deltas[id] = round.choice === 'others' ? ruleSet.pit.othersDelta : 0
    }
  }
  return deltas
}

/** Replay all rounds from scratch; stops at the first winner. */
export function computeState(game: Game): GameState {
  let standings = game.players.map((p) => ({ playerId: p.id, score: 0 }))
  let phase: Phase = 'up'
  let winnerId: PlayerId | null = null
  let pendingTie: PlayerId[] | null = null

  for (const round of game.rounds) {
    if (winnerId) break
    const deltas = roundDeltas(round, game.ruleSet, game.players.map((p) => p.id))
    // In the return game every point taken counts down; pit deltas always apply directly.
    const invert = phase === 'down' && round.kind === 'points'
    standings = standings.map((s) => ({
      ...s,
      score: s.score + (invert ? -deltas[s.playerId] : deltas[s.playerId]),
    }))
    // Once any player has been at turnAt, ALL players count down from the next round on.
    // The trigger keeps the overshoot value (e.g. 90 + 17 = 107).
    if (phase === 'up' && standings.some((s) => s.score >= game.ruleSet.turnAt)) {
      phase = 'down'
    }
    // During the return game the first player below 0 wins — including players
    // who were already negative (e.g. from a pit) when the return game started.
    if (phase === 'down') {
      const winners = standings.filter((s) => s.score < game.ruleSet.winBelow)
      if (winners.length === 1) {
        winnerId = winners[0].playerId
      } else if (winners.length > 1) {
        // Several players below 0 at once: whoever declared out first wins.
        // That choice is recorded on the game; until then the tie is pending.
        if (game.tieWinnerId && winners.some((w) => w.playerId === game.tieWinnerId)) {
          winnerId = game.tieWinnerId
        } else {
          pendingTie = winners.map((w) => w.playerId)
          break
        }
      }
    }
  }

  return { standings, phase, winnerId, pendingTie }
}

/** Standings after each round, for the score history table. */
export function stateHistory(game: Game): GameState[] {
  const states: GameState[] = []
  for (let i = 1; i <= game.rounds.length; i++) {
    states.push(computeState({ ...game, rounds: game.rounds.slice(0, i) }))
  }
  return states
}
