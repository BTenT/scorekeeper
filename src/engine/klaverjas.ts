import type { Game, GameState, KlaverjasRound, KlaverjasRules, PlayerId, RuleSet, ScoreParts } from './types'

export function isKlaverjas(ruleSet: RuleSet): boolean {
  return ruleSet.gameType === 'klaverjassen'
}

/** Convert a raw 162-scale value to the variant's units (afgerond: 82 → 8, 97 → 10). */
export function toVariantUnits(raw: number, rules: KlaverjasRules): number {
  return rules.variant === 'afgerond' ? Math.round(raw / 10) : raw
}

export interface PotjeResult {
  /** score delta per team, in the variant's own units */
  deltas: Record<PlayerId, number>
  /** true when the trump-making team scored no more (incl. roem) than the opponent */
  nat: boolean
}

/**
 * Settle one potje. Points, roem and pit bonus are compared on the raw scale;
 * the trump team goes "nat" when its total (incl. roem) does not exceed the
 * opponent's, and then the opponent receives everything, pit bonus included.
 * In the 'afgerond' variant only the first-counted team's points are rounded
 * (97 → 10); the other team gets 16 minus that, so a potje always sums to 16.
 */
export function potjeResult(round: KlaverjasRound, rules: KlaverjasRules, teamIds: PlayerId[]): PotjeResult {
  const trump = round.trumpTeamId
  const other = teamIds.find((id) => id !== trump)!
  const rawTotal = (id: PlayerId) =>
    (round.points[id] ?? 0) + (round.roem[id] ?? 0) + (round.pitTeamId === id ? rules.pitBonus : 0)

  const pointsUnits: Record<PlayerId, number> = {}
  if (rules.variant === 'afgerond') {
    const counted =
      round.countedTeamId && teamIds.includes(round.countedTeamId) ? round.countedTeamId : trump
    const rest = teamIds.find((id) => id !== counted)!
    pointsUnits[counted] = Math.round((round.points[counted] ?? 0) / 10)
    pointsUnits[rest] = Math.round(rules.pointsPerPotje / 10) - pointsUnits[counted]
  } else {
    for (const id of teamIds) pointsUnits[id] = round.points[id] ?? 0
  }
  const converted = (id: PlayerId) =>
    pointsUnits[id] +
    toVariantUnits(round.roem[id] ?? 0, rules) +
    (round.pitTeamId === id ? toVariantUnits(rules.pitBonus, rules) : 0)

  const nat = rawTotal(trump) <= rawTotal(other)
  const deltas = nat
    ? { [trump]: 0, [other]: converted(trump) + converted(other) }
    : { [trump]: converted(trump), [other]: converted(other) }
  return { deltas, nat }
}

/**
 * One potje split into points, roem and pit per team, raw. Nat works as in
 * potjeResult: the opponent receives all three, so its parts hold everything.
 */
export function potjeParts(
  round: KlaverjasRound,
  rules: KlaverjasRules,
  teamIds: PlayerId[],
): Record<PlayerId, ScoreParts> {
  const parts = (id: PlayerId): ScoreParts => ({
    points: round.points[id] ?? 0,
    roem: round.roem[id] ?? 0,
    pit: round.pitTeamId === id ? rules.pitBonus : 0,
  })
  const trump = round.trumpTeamId
  const other = teamIds.find((id) => id !== trump)!
  if (!potjeResult(round, rules, teamIds).nat) {
    return { [trump]: parts(trump), [other]: parts(other) }
  }
  const [a, b] = [parts(trump), parts(other)]
  return {
    [trump]: { points: 0, roem: 0, pit: 0 },
    [other]: { points: a.points + b.points, roem: a.roem + b.roem, pit: a.pit + b.pit },
  }
}

/** Concours tally per team over the potjes that count. */
export function concoursTotals(game: Game): Record<PlayerId, ScoreParts> {
  const rules = game.ruleSet.klaverjas!
  const ids = game.players.map((p) => p.id)
  const totals: Record<PlayerId, ScoreParts> = Object.fromEntries(
    ids.map((id) => [id, { points: 0, roem: 0, pit: 0 }]),
  )
  for (const round of game.rounds.slice(0, rules.potjes)) {
    if (round.kind !== 'klaverjas') continue
    const parts = potjeParts(round, rules, ids)
    for (const id of ids) {
      totals[id] = {
        points: totals[id].points + parts[id].points,
        roem: totals[id].roem + parts[id].roem,
        pit: totals[id].pit + parts[id].pit,
      }
    }
  }
  return totals
}

/** A concours has no target: after the last potje the highest total wins, level is a draw. */
function computeConcoursState(game: Game, potjes: number): GameState {
  const totals = concoursTotals(game)
  const standings = game.players.map((p) => ({
    playerId: p.id,
    score: totals[p.id].points + totals[p.id].roem + totals[p.id].pit,
  }))
  const state: GameState = { standings, phase: 'up', winnerId: null, pendingTie: null }
  if (game.rounds.length < potjes) return state
  const [a, b] = standings
  if (a.score === b.score) return { ...state, draw: true }
  return { ...state, winnerId: a.score > b.score ? a.playerId : b.playerId }
}

/**
 * Replay all potjes; the first team at or above the target wins. When both
 * teams reach the target in the same potje the higher score wins; at an exact
 * tie play continues.
 */
export function computeKlaverjasState(game: Game): GameState {
  const rules = game.ruleSet.klaverjas!
  if (rules.potjes) return computeConcoursState(game, rules.potjes)
  const ids = game.players.map((p) => p.id)
  let standings = ids.map((playerId) => ({ playerId, score: 0 }))
  let winnerId: PlayerId | null = null

  for (const round of game.rounds) {
    if (winnerId) break
    if (round.kind !== 'klaverjas') continue
    const { deltas } = potjeResult(round, rules, ids)
    standings = standings.map((s) => ({ ...s, score: s.score + (deltas[s.playerId] ?? 0) }))
    const atTarget = standings.filter((s) => s.score >= rules.target)
    if (atTarget.length === 1) {
      winnerId = atTarget[0].playerId
    } else if (atTarget.length > 1 && atTarget[0].score !== atTarget[1].score) {
      winnerId = atTarget.reduce((a, b) => (a.score > b.score ? a : b)).playerId
    }
  }

  return { standings, phase: 'up', winnerId, pendingTie: null }
}

/** Team dealing potje `roundIndex` (0-based); the deal alternates every potje. */
export function dealerIdForRound(game: Game, roundIndex: number): PlayerId {
  const ids = game.players.map((p) => p.id)
  const start = Math.max(0, ids.indexOf(game.firstDealerId ?? ids[0]))
  return ids[(start + roundIndex) % ids.length]
}
