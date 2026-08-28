import type { GameType, PlayerId, Round, RuleSet } from './types'

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateRound(round: Round, ruleSet: RuleSet, playerIds: PlayerId[]): ValidationResult {
  if (round.kind === 'klaverjas') {
    const rules = ruleSet.klaverjas
    if (!rules) return { valid: false, error: 'Geen klaverjas-regels op dit spel.' }
    if (!playerIds.includes(round.trumpTeamId)) {
      return { valid: false, error: 'Onbekend team voor troef.' }
    }
    if (round.countedTeamId !== undefined && !playerIds.includes(round.countedTeamId)) {
      return { valid: false, error: 'Onbekend team voor de telling.' }
    }
    for (const record of [round.points, round.roem]) {
      for (const [id, value] of Object.entries(record)) {
        if (!playerIds.includes(id)) return { valid: false, error: 'Onbekend team in potje.' }
        if (!Number.isInteger(value) || value < 0) {
          return { valid: false, error: 'Punten en roem moeten hele getallen van 0 of meer zijn.' }
        }
      }
    }
    const total = playerIds.reduce((sum, id) => sum + (round.points[id] ?? 0), 0)
    if (total !== rules.pointsPerPotje) {
      return { valid: false, error: `Punten moeten samen ${rules.pointsPerPotje} zijn (nu ${total}).` }
    }
    if (round.pitTeamId !== undefined) {
      if (!playerIds.includes(round.pitTeamId)) {
        return { valid: false, error: 'Onbekend team voor pit.' }
      }
      if ((round.points[round.pitTeamId] ?? 0) !== rules.pointsPerPotje) {
        return { valid: false, error: 'Bij een pit heeft dat team alle punten.' }
      }
    }
    return { valid: true }
  }

  if (round.kind === 'pit') {
    if (!playerIds.includes(round.playerId)) {
      return { valid: false, error: 'Onbekende speler voor pit.' }
    }
    return { valid: true }
  }

  const entries = Object.entries(round.points)
  for (const [id, points] of entries) {
    if (!playerIds.includes(id)) {
      return { valid: false, error: 'Onbekende speler in ronde.' }
    }
    if (!Number.isInteger(points) || points < 0) {
      return { valid: false, error: 'Punten moeten hele getallen van 0 of meer zijn.' }
    }
  }
  const total = entries.reduce((sum, [, points]) => sum + points, 0)
  if (total !== ruleSet.pointsPerRound) {
    return {
      valid: false,
      error: `Totaal moet ${ruleSet.pointsPerRound} zijn (nu ${total}).`,
    }
  }
  return { valid: true }
}

export function validatePlayerCount(count: number, gameType: GameType = 'hartenjagen'): ValidationResult {
  if (gameType === 'klaverjassen') {
    if (count !== 2) {
      return { valid: false, error: 'Klaverjassen heeft precies 2 teams.' }
    }
    return { valid: true }
  }
  if (count < 4 || count > 6) {
    return { valid: false, error: 'Hartenjagen speel je met 4 tot 6 spelers.' }
  }
  return { valid: true }
}
