import type { Game, GameState, PlayerId, PlayerStanding, Round, RuleSet } from './types'

/**
 * Direct score delta per player for a round.
 * - Points rounds return points taken; the caller inverts them for return-phase players.
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

function applyDelta(standing: PlayerStanding, delta: number, invertWhenDown: boolean, ruleSet: RuleSet): PlayerStanding {
  // In the return game every point taken counts down instead of up.
  const invert = invertWhenDown && standing.phase === 'down'
  const score = standing.score + (invert ? -delta : delta)
  let phase = standing.phase
  if (phase === 'up' && score >= ruleSet.turnAt) {
    // Player lands on the overshoot value (e.g. 90 + 17 = 107) and turns around.
    phase = 'down'
  }
  return { ...standing, score, phase }
}

/** Replay all rounds from scratch; stops at the first winner. */
export function computeState(game: Game): GameState {
  let standings: PlayerStanding[] = game.players.map((p) => ({
    playerId: p.id,
    score: 0,
    phase: 'up',
  }))
  let winnerId: PlayerId | null = null

  for (const round of game.rounds) {
    if (winnerId) break
    const deltas = roundDeltas(round, game.ruleSet, game.players.map((p) => p.id))
    const invertWhenDown = round.kind === 'points'
    standings = standings.map((s) => applyDelta(s, deltas[s.playerId], invertWhenDown, game.ruleSet))
    // Only a player already in the return game can win by dropping below 0.
    const winners = standings.filter((s) => s.phase === 'down' && s.score < game.ruleSet.winBelow)
    if (winners.length > 0) {
      // If several drop below 0 in the same round, the lowest score wins.
      winnerId = winners.reduce((a, b) => (b.score < a.score ? b : a)).playerId
    }
  }

  return { standings, winnerId }
}

/** Standings after each round, for the score history table. */
export function stateHistory(game: Game): GameState[] {
  const states: GameState[] = []
  for (let i = 1; i <= game.rounds.length; i++) {
    states.push(computeState({ ...game, rounds: game.rounds.slice(0, i) }))
  }
  return states
}
