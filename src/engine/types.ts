export type PlayerId = string

export interface Player {
  id: PlayerId
  name: string
}

export type PitChoice = 'self' | 'others'

/** A normal round: points taken per player, summing to ruleSet.pointsPerRound. */
export interface PointsRound {
  kind: 'points'
  points: Record<PlayerId, number>
}

/** A pit round: one player took everything and chose the effect. */
export interface PitRound {
  kind: 'pit'
  playerId: PlayerId
  choice: PitChoice
}

export type Round = PointsRound | PitRound

export interface PaymentRules {
  /** euro per point of the loser's own final score */
  perPoint: number
  /** fixed euro fee per loser */
  gameFee: number
  scheme: 'winner-takes-all-own-score'
}

export interface RuleSet {
  id: string
  name: string
  /** total points distributed in a normal round */
  pointsPerRound: number
  /** informational card values, editable per game */
  cards: { label: string; value: number; count: number }[]
  pit: { selfDelta: number; othersDelta: number }
  /** reaching this score (or more) flips a player into the return game */
  turnAt: number
  /** a return-phase player dropping below this wins */
  winBelow: number
  payment: PaymentRules
}

export type Phase = 'up' | 'down'

export interface PlayerStanding {
  playerId: PlayerId
  score: number
  phase: Phase
}

export interface GameState {
  standings: PlayerStanding[]
  winnerId: PlayerId | null
}

export interface Game {
  id: string
  createdAt: number
  players: Player[]
  ruleSet: RuleSet
  rounds: Round[]
}

export interface PaymentLine {
  from: PlayerId
  to: PlayerId
  amount: number
}
