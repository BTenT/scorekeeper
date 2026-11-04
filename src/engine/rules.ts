import type { RuleSet } from './types'

/** Dutch 32-card variant (7 and up): 25 points per round. The id predates the name; saved games carry it. */
export const huisregels: RuleSet = {
  id: 'huisregels',
  name: 'Nederlands (25 punten)',
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

/** Dutch 32-card variant without the ruiten tien: 15 points per round, return game from 50. */
export const nederlands15: RuleSet = {
  ...huisregels,
  id: 'nederlands-15',
  name: 'Nederlands (15 punten)',
  pointsPerRound: 15,
  cards: [
    { label: 'Harten', value: 1, count: 8 },
    { label: 'Schoppenvrouw', value: 5, count: 1 },
    { label: 'Klaverenboer', value: 2, count: 1 },
  ],
  pit: { selfDelta: -15, othersDelta: 15 },
  turnAt: 50,
}

/** American 52-card variant: 26 points per round, no return game, lowest wins once someone hits turnAt. */
export const amerikaans: RuleSet = {
  ...huisregels,
  id: 'amerikaans',
  name: 'Amerikaans (52 kaarten)',
  returnGame: false,
  pointsPerRound: 26,
  cards: [
    { label: 'Harten', value: 1, count: 13 },
    { label: 'Schoppenvrouw', value: 13, count: 1 },
  ],
  pit: { selfDelta: -26, othersDelta: 26 },
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

/** Klaverjassen as a concours: 16 potjes (2592 card points), points, roem and pit kept apart. */
export const klaverjasConcours: RuleSet = {
  ...klaverjasVolledig,
  id: 'klaverjas-concours',
  name: 'Concours (16 rondes)',
  klaverjas: { variant: 'concours', target: 2592, potjes: 16, pointsPerPotje: 162, pitBonus: 100 },
}

export const ruleSets: RuleSet[] = [huisregels, nederlands15, amerikaans, klaverjasVolledig, klaverjasAfgerond, klaverjasConcours]

export const hartenjagenRuleSets: RuleSet[] = [huisregels, nederlands15, amerikaans]
export const klaverjasRuleSets: RuleSet[] = [klaverjasVolledig, klaverjasAfgerond, klaverjasConcours]
