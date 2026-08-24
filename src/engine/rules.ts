import type { RuleSet } from './types'

/** House rules: 32-card deck (7 and up), 25 points per round. */
export const huisregels: RuleSet = {
  id: 'huisregels',
  name: 'Huisregels (32 kaarten)',
  pointsPerRound: 25,
  cards: [
    { label: 'Harten', value: 1, count: 8 },
    { label: 'Schoppenvrouw', value: 5, count: 1 },
    { label: 'Klaverenboer', value: 2, count: 1 },
    { label: 'Ruiten tien', value: 10, count: 1 },
  ],
  pit: { selfDelta: -25, othersDelta: 25 },
  turnAt: 100,
  winBelow: 0,
  payment: { perPoint: 0.05, gameFee: 0.5, scheme: 'winner-takes-all-own-score' },
}

/** Standard 52-card variant: hearts 1 each, Q♠ 5, J♣ 2, last trick 5. */
export const standaard: RuleSet = {
  id: 'standaard',
  name: 'Standaard (52 kaarten)',
  pointsPerRound: 25,
  cards: [
    { label: 'Harten', value: 1, count: 13 },
    { label: 'Schoppenvrouw', value: 5, count: 1 },
    { label: 'Klaverenboer', value: 2, count: 1 },
    { label: 'Laatste slag', value: 5, count: 1 },
  ],
  pit: { selfDelta: -25, othersDelta: 25 },
  turnAt: 100,
  winBelow: 0,
  payment: { perPoint: 0.05, gameFee: 0.5, scheme: 'winner-takes-all-own-score' },
}

export const ruleSets: RuleSet[] = [huisregels, standaard]
