import type { PlayerId, Round, RuleSet } from './types'

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateRound(round: Round, ruleSet: RuleSet, playerIds: PlayerId[]): ValidationResult {
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

export function validatePlayerCount(count: number): ValidationResult {
  if (count < 4 || count > 6) {
    return { valid: false, error: 'Hartenjagen speel je met 4 tot 6 spelers.' }
  }
  return { valid: true }
}
