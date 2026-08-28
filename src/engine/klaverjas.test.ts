import { describe, expect, it } from 'vitest'
import { dealerIdForRound, potjeResult, toVariantUnits } from './klaverjas'
import { computeState, roundDeltas } from './scoring'
import { klaverjasAfgerond, klaverjasVolledig } from './rules'
import { validatePlayerCount, validateRound } from './validation'
import type { Game, KlaverjasRound } from './types'

const teams = [
  { id: 'wij', name: 'Wij' },
  { id: 'zij', name: 'Zij' },
]
const ids = ['wij', 'zij']
const volledig = klaverjasVolledig.klaverjas!
const afgerond = klaverjasAfgerond.klaverjas!

function potje(partial: Partial<KlaverjasRound>): KlaverjasRound {
  return {
    kind: 'klaverjas',
    trumpTeamId: 'wij',
    points: { wij: 82, zij: 80 },
    roem: { wij: 0, zij: 0 },
    ...partial,
  }
}

function game(rounds: KlaverjasRound[], variant = klaverjasVolledig): Game {
  return { id: 'g', createdAt: 0, players: teams, ruleSet: variant, rounds }
}

describe('toVariantUnits', () => {
  it('keeps raw values in volledig and rounds to tens in afgerond', () => {
    expect(toVariantUnits(97, volledig)).toBe(97)
    expect(toVariantUnits(82, afgerond)).toBe(8)
    expect(toVariantUnits(97, afgerond)).toBe(10)
    expect(toVariantUnits(20, afgerond)).toBe(2)
  })
})

describe('potjeResult', () => {
  it('gives each team its own points plus roem when the trump team wins', () => {
    const r = potje({ points: { wij: 97, zij: 65 }, roem: { wij: 20, zij: 0 } })
    expect(potjeResult(r, volledig, ids)).toEqual({ deltas: { wij: 117, zij: 65 }, nat: false })
  })

  it('rounds the counted team and gives the other 16 minus that (97 → 10, other 6)', () => {
    const r = potje({ points: { wij: 97, zij: 65 }, roem: { wij: 20, zij: 0 }, countedTeamId: 'wij' })
    expect(potjeResult(r, afgerond, ids)).toEqual({ deltas: { wij: 12, zij: 6 }, nat: false })
  })

  it('lets the first-counted rounding take precedence (65 → 7, other 16 − 7 = 9)', () => {
    const r = potje({ points: { wij: 97, zij: 65 }, countedTeamId: 'zij' })
    expect(potjeResult(r, afgerond, ids)).toEqual({ deltas: { wij: 9, zij: 7 }, nat: false })
  })

  it('defaults the counted team to the trump team', () => {
    const r = potje({ trumpTeamId: 'zij', points: { wij: 97, zij: 65 } })
    // zij counted: 65 → 7, wij 16 − 7 = 9; zij is also nat, so wij gets 9 + 7.
    expect(potjeResult(r, afgerond, ids)).toEqual({ deltas: { wij: 16, zij: 0 }, nat: true })
  })

  it('always sums a potje to 16 in afgerond, roem aside', () => {
    const r = potje({ points: { wij: 85, zij: 77 }, countedTeamId: 'wij' }) // 85 → 9, 77 → 7
    const { deltas } = potjeResult(r, afgerond, ids)
    expect(deltas.wij + deltas.zij).toBe(16)
    expect(deltas).toEqual({ wij: 9, zij: 7 })
  })

  it('sends everything to the opponent when the trump team is nat', () => {
    const r = potje({ points: { wij: 70, zij: 92 }, roem: { wij: 20, zij: 0 } })
    expect(potjeResult(r, volledig, ids)).toEqual({ deltas: { wij: 0, zij: 182 }, nat: true })
  })

  it('lets roem rescue the trump team from nat', () => {
    // 80 + 50 roem = 130 beats 82: not nat despite fewer than 82 card points.
    const r = potje({ points: { wij: 80, zij: 82 }, roem: { wij: 50, zij: 0 } })
    expect(potjeResult(r, volledig, ids)).toEqual({ deltas: { wij: 130, zij: 82 }, nat: false })
  })

  it('treats an exact tie (81–81) as nat', () => {
    const r = potje({ points: { wij: 81, zij: 81 } })
    expect(potjeResult(r, volledig, ids)).toEqual({ deltas: { wij: 0, zij: 162 }, nat: true })
  })

  it('adds the pit bonus: +100 volledig, +10 afgerond', () => {
    const r = potje({ points: { wij: 162, zij: 0 }, roem: { wij: 20, zij: 0 }, pitTeamId: 'wij' })
    expect(potjeResult(r, volledig, ids)).toEqual({ deltas: { wij: 282, zij: 0 }, nat: false })
    expect(potjeResult(r, afgerond, ids)).toEqual({ deltas: { wij: 28, zij: 0 }, nat: false })
  })

  it('gives the opponent its pit bonus too when the trump team is nat', () => {
    // Zij pit while wij made trump: wij is nat, zij receives 162 + 100 + roem.
    const r = potje({ points: { wij: 0, zij: 162 }, roem: { wij: 20, zij: 0 }, pitTeamId: 'zij' })
    expect(potjeResult(r, volledig, ids)).toEqual({ deltas: { wij: 0, zij: 282 }, nat: true })
  })

  it('is exposed through roundDeltas for the history table', () => {
    const r = potje({ points: { wij: 97, zij: 65 } })
    expect(roundDeltas(r, klaverjasVolledig, ids)).toEqual({ wij: 97, zij: 65 })
  })
})

describe('computeKlaverjasState', () => {
  it('accumulates potjes and crowns the first team at the target', () => {
    const big = potje({ points: { wij: 162, zij: 0 }, roem: { wij: 100, zij: 0 }, pitTeamId: 'wij' })
    const rounds = Array.from({ length: 5 }, () => big) // 5 × 362 = 1810
    const state = computeState(game(rounds))
    expect(state.winnerId).toBe('wij')
    expect(state.phase).toBe('up')
    expect(state.pendingTie).toBeNull()
  })

  it('has no winner below the target', () => {
    const state = computeState(game([potje({ points: { wij: 97, zij: 65 } })]))
    expect(state.winnerId).toBeNull()
    expect(state.standings).toEqual([
      { playerId: 'wij', score: 97 },
      { playerId: 'zij', score: 65 },
    ])
  })

  it('picks the higher score when both teams pass the target in the same potje', () => {
    const rounds = Array.from({ length: 9 }, () => potje({ points: { wij: 90, zij: 72 } })) // 810 – 648
    // zij makes trump and wins the potje (1000 vs 900), yet both teams pass 1600.
    const finish = potje({ trumpTeamId: 'zij', points: { wij: 82, zij: 80 }, roem: { wij: 818, zij: 920 } })
    const state = computeState(game([...rounds, finish]))
    // wij 810+900=1710, zij 648+1000=1648 → wij wins on the higher score.
    expect(state.winnerId).toBe('wij')
  })

  it('plays on at an exact tie on or above the target', () => {
    const r1 = potje({ points: { wij: 100, zij: 62 }, roem: { wij: 800, zij: 638 } }) // wij 900, zij 700
    const r2 = potje({ trumpTeamId: 'zij', points: { wij: 62, zij: 100 }, roem: { wij: 638, zij: 800 } })
    const state = computeState(game([r1, r2])) // both exactly 1600
    expect(state.standings.map((s) => s.score)).toEqual([1600, 1600])
    expect(state.winnerId).toBeNull()
  })

  it('stops replaying after the winner is decided', () => {
    const big = potje({ points: { wij: 162, zij: 0 }, roem: { wij: 1438, zij: 0 }, pitTeamId: 'wij' })
    const after = potje({ points: { wij: 0, zij: 162 }, trumpTeamId: 'zij' })
    const state = computeState(game([big, after]))
    expect(state.winnerId).toBe('wij')
    expect(state.standings.find((s) => s.playerId === 'zij')!.score).toBe(0)
  })
})

describe('dealerIdForRound', () => {
  it('alternates the deal per potje starting at firstDealerId', () => {
    const g = { ...game([]), firstDealerId: 'zij' }
    expect(dealerIdForRound(g, 0)).toBe('zij')
    expect(dealerIdForRound(g, 1)).toBe('wij')
    expect(dealerIdForRound(g, 2)).toBe('zij')
  })

  it('defaults to the first team without firstDealerId', () => {
    expect(dealerIdForRound(game([]), 0)).toBe('wij')
  })
})

describe('klaverjas validation', () => {
  it('requires the points to sum to 162', () => {
    const bad = potje({ points: { wij: 82, zij: 70 } })
    expect(validateRound(bad, klaverjasVolledig, ids).valid).toBe(false)
    expect(validateRound(potje({}), klaverjasVolledig, ids).valid).toBe(true)
  })

  it('rejects an unknown trump team and negative roem', () => {
    expect(validateRound(potje({ trumpTeamId: 'x' }), klaverjasVolledig, ids).valid).toBe(false)
    expect(validateRound(potje({ roem: { wij: -20, zij: 0 } }), klaverjasVolledig, ids).valid).toBe(false)
  })

  it('rejects an unknown counted team', () => {
    expect(validateRound(potje({ countedTeamId: 'x' }), klaverjasVolledig, ids).valid).toBe(false)
    expect(validateRound(potje({ countedTeamId: 'zij' }), klaverjasVolledig, ids).valid).toBe(true)
  })

  it('requires the pit team to hold all points', () => {
    expect(validateRound(potje({ pitTeamId: 'wij' }), klaverjasVolledig, ids).valid).toBe(false)
    const ok = potje({ points: { wij: 162, zij: 0 }, pitTeamId: 'wij' })
    expect(validateRound(ok, klaverjasVolledig, ids).valid).toBe(true)
  })

  it('requires exactly 2 teams', () => {
    expect(validatePlayerCount(2, 'klaverjassen').valid).toBe(true)
    expect(validatePlayerCount(4, 'klaverjassen').valid).toBe(false)
    expect(validatePlayerCount(4).valid).toBe(true)
  })
})
