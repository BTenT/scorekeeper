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

/** Klaverjassen with full scores: 162 + roem per potje, first team at 1600 wins. */
export const klaverjasVolledig: RuleSet = {
  id: 'klaverjas-volledig',
  name: 'Volledig tot 1600',
  gameType: 'klaverjassen',
  klaverjas: { variant: 'volledig', target: 1600, pointsPerPotje: 162, pitBonus: 100 },
  pointsPerRound: 162,
  cards: [],
  pit: { selfDelta: 0, othersDelta: 0 },
  turnAt: 0,
  winBelow: 0,
  payment: { perPoint: 0, gameFee: 0, scheme: 'winner-takes-all-own-score' },
}

/** Klaverjassen with rounded scores: 82 → 8, 97 → 10, first team at 160 wins. */
export const klaverjasAfgerond: RuleSet = {
  ...klaverjasVolledig,
  id: 'klaverjas-afgerond',
  name: 'Afgerond tot 160',
  klaverjas: { variant: 'afgerond', target: 160, pointsPerPotje: 162, pitBonus: 100 },
}

export const ruleSets: RuleSet[] = [huisregels, standaard, klaverjasVolledig, klaverjasAfgerond]

export const hartenjagenRuleSets: RuleSet[] = [huisregels, standaard]
export const klaverjasRuleSets: RuleSet[] = [klaverjasVolledig, klaverjasAfgerond]
