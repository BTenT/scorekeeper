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

/**
 * One klaverjas deal ("potje"). All values are on the raw 162-point scale,
 * regardless of the scoring variant; the 'afgerond' variant converts on replay.
 */
export interface KlaverjasRound {
  kind: 'klaverjas'
  /** team that made trump; goes "nat" when it scores no more than the opponent */
  trumpTeamId: PlayerId
  /** card points per team, summing to pointsPerPotje (162) */
  points: Record<PlayerId, number>
  /**
   * Team whose points were counted (typed) first. In the 'afgerond' variant its
   * rounding takes precedence and the other team gets the remainder, so the
   * points of a potje always sum to 16. Defaults to the trump team.
   */
  countedTeamId?: PlayerId
  /** roem per team, raw (20/50/100…) */
  roem: Record<PlayerId, number>
  /** team that took every trick, if any (earns the pit bonus) */
  pitTeamId?: PlayerId
}

export type Round = PointsRound | PitRound | KlaverjasRound

export interface PaymentRules {
  /** euro per point of the loser's own final score */
  perPoint: number
  /** fixed euro fee per loser */
  gameFee: number
  scheme: 'winner-takes-all-own-score'
}

export type GameType = 'hartenjagen' | 'klaverjassen'

export type KlaverjasVariant = 'volledig' | 'afgerond'

export interface KlaverjasRules {
  /** 'volledig' keeps raw scores (to 1600); 'afgerond' rounds to tens (82 → 8, to 160) */
  variant: KlaverjasVariant
  /** first team at or above this (in the variant's own units) wins */
  target: number
  /** card points dealt per potje, raw scale (162) */
  pointsPerPotje: number
  /** raw bonus for taking every trick (100; shows as 10 in 'afgerond') */
  pitBonus: number
}

export interface RuleSet {
  id: string
  name: string
  /** absent on games saved before klaverjassen existed → hartenjagen */
  gameType?: GameType
  /** present iff gameType === 'klaverjassen' */
  klaverjas?: KlaverjasRules
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
}

export interface GameState {
  standings: PlayerStanding[]
  /** 'down' once any player has reached turnAt: from then on everyone counts down. */
  phase: Phase
  winnerId: PlayerId | null
  /**
   * Set when several players dropped below 0 in the same round and no choice
   * has been recorded yet: the app must ask who declared out ("uitgemeld") first.
   */
  pendingTie: PlayerId[] | null
}

export interface Game {
  id: string
  createdAt: number
  players: Player[]
  ruleSet: RuleSet
  rounds: Round[]
  /** Chosen winner when several players dropped below 0 in the same round. */
  tieWinnerId?: PlayerId
  /** Klaverjassen: team that deals the first potje; dealing alternates per potje. */
  firstDealerId?: PlayerId
  /** Klaverjassen: roem tallied during the current potje, raw, cleared when the potje is saved. */
  draftRoem?: Record<PlayerId, number>
}

export interface PaymentLine {
  from: PlayerId
  to: PlayerId
  amount: number
}
