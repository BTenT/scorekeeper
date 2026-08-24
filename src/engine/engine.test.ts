import { describe, expect, it } from 'vitest'
import { huisregels } from './rules'
import { computeState, stateHistory } from './scoring'
import { validateRound, validatePlayerCount } from './validation'
import { computePayments, totalForWinner, formatEuro } from './payment'
import type { Game, Round } from './types'

const players = [
  { id: 'a', name: 'Anna' },
  { id: 'b', name: 'Bram' },
  { id: 'c', name: 'Cor' },
  { id: 'd', name: 'Dirk' },
]
const ids = players.map((p) => p.id)

function game(rounds: Round[], playerList = players): Game {
  return { id: 'g1', createdAt: 0, players: playerList, ruleSet: huisregels, rounds }
}

function points(p: Record<string, number>): Round {
  return { kind: 'points', points: p }
}

describe('validation', () => {
  it('accepts a round summing to 25', () => {
    expect(validateRound(points({ a: 10, b: 8, c: 7, d: 0 }), huisregels, ids).valid).toBe(true)
  })

  it('rejects a round not summing to 25', () => {
    const result = validateRound(points({ a: 10, b: 8, c: 7, d: 1 }), huisregels, ids)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('25')
  })

  it('rejects negative and fractional points', () => {
    expect(validateRound(points({ a: -1, b: 26, c: 0, d: 0 }), huisregels, ids).valid).toBe(false)
    expect(validateRound(points({ a: 12.5, b: 12.5, c: 0, d: 0 }), huisregels, ids).valid).toBe(false)
  })

  it('rejects unknown players', () => {
    expect(validateRound(points({ x: 25 }), huisregels, ids).valid).toBe(false)
    expect(validateRound({ kind: 'pit', playerId: 'x', choice: 'self' }, huisregels, ids).valid).toBe(false)
  })

  it('allows 4-6 players only', () => {
    expect(validatePlayerCount(3).valid).toBe(false)
    expect(validatePlayerCount(4).valid).toBe(true)
    expect(validatePlayerCount(6).valid).toBe(true)
    expect(validatePlayerCount(7).valid).toBe(false)
  })
})

describe('scoring', () => {
  it('adds points in the up phase', () => {
    const state = computeState(game([points({ a: 10, b: 8, c: 7, d: 0 })]))
    expect(state.standings.map((s) => s.score)).toEqual([10, 8, 7, 0])
    expect(state.winnerId).toBeNull()
  })

  it('pit self gives -25 to the taker only', () => {
    const state = computeState(game([{ kind: 'pit', playerId: 'a', choice: 'self' }]))
    expect(state.standings.map((s) => s.score)).toEqual([-25, 0, 0, 0])
  })

  it('pit others gives +25 to everyone else', () => {
    const state = computeState(game([{ kind: 'pit', playerId: 'a', choice: 'others' }]))
    expect(state.standings.map((s) => s.score)).toEqual([0, 25, 25, 25])
  })

  it('a negative score while still in the up phase does not win', () => {
    const state = computeState(game([{ kind: 'pit', playerId: 'a', choice: 'self' }]))
    expect(state.winnerId).toBeNull()
    expect(state.standings[0].phase).toBe('up')
  })

  it('passing 100 keeps the overshoot and flips to the return game', () => {
    const rounds: Round[] = [
      points({ a: 25, b: 0, c: 0, d: 0 }),
      points({ a: 25, b: 0, c: 0, d: 0 }),
      points({ a: 25, b: 0, c: 0, d: 0 }),
      points({ a: 15, b: 10, c: 0, d: 0 }), // a: 90
      points({ a: 17, b: 8, c: 0, d: 0 }), // a: 107, turns
    ]
    const state = computeState(game(rounds))
    const a = state.standings[0]
    expect(a.score).toBe(107)
    expect(a.phase).toBe('down')
  })

  it('points count down in the return game and first below 0 wins', () => {
    const up: Round[] = Array.from({ length: 4 }, () => points({ a: 25, b: 0, c: 0, d: 0 })) // a: 100, down
    const down: Round[] = Array.from({ length: 4 }, () => points({ a: 25, b: 0, c: 0, d: 0 })) // 100 - 100 = 0
    const final: Round = points({ a: 10, b: 15, c: 0, d: 0 }) // a: -10 -> wins
    const state = computeState(game([...up, ...down, final]))
    expect(state.standings[0].score).toBe(-10)
    expect(state.winnerId).toBe('a')
  })

  it('exactly 0 in the return game does not win yet', () => {
    const rounds: Round[] = Array.from({ length: 8 }, () => points({ a: 25, b: 0, c: 0, d: 0 }))
    const state = computeState(game(rounds)) // 100 up (turns), then -100 back to exactly 0
    expect(state.standings[0].score).toBe(0)
    expect(state.winnerId).toBeNull()
  })

  it('pit self in the return game subtracts 25 and can win the game', () => {
    const up: Round[] = Array.from({ length: 4 }, () => points({ a: 25, b: 0, c: 0, d: 0 })) // a: 100, down
    const down: Round[] = Array.from({ length: 3 }, () => points({ a: 25, b: 0, c: 0, d: 0 })) // a: 25
    const pit: Round = { kind: 'pit', playerId: 'a', choice: 'self' } // a: 0... below? 25-25=0 no win
    const pit2: Round = { kind: 'pit', playerId: 'a', choice: 'self' } // a: -25 wins
    const state = computeState(game([...up, ...down, pit, pit2]))
    expect(state.standings[0].score).toBe(-25)
    expect(state.winnerId).toBe('a')
  })

  it('rounds after the winning round are ignored', () => {
    const rounds: Round[] = [
      ...Array.from({ length: 5 }, () => points({ a: 25, b: 0, c: 0, d: 0 })), // a: 125
      ...Array.from({ length: 6 }, () => points({ a: 25, b: 0, c: 0, d: 0 })), // a: -25, wins at round 11
      points({ a: 0, b: 25, c: 0, d: 0 }),
    ]
    const state = computeState(game(rounds))
    expect(state.winnerId).toBe('a')
    expect(state.standings[1].score).toBe(0)
  })

  it('works with 6 players', () => {
    const six = [...players, { id: 'e', name: 'Eva' }, { id: 'f', name: 'Fem' }]
    const state = computeState(game([points({ a: 5, b: 5, c: 5, d: 5, e: 5, f: 0 })], six))
    expect(state.standings).toHaveLength(6)
    expect(state.standings.map((s) => s.score)).toEqual([5, 5, 5, 5, 5, 0])
  })

  it('stateHistory returns standings per round', () => {
    const history = stateHistory(game([points({ a: 25, b: 0, c: 0, d: 0 }), points({ a: 0, b: 25, c: 0, d: 0 })]))
    expect(history).toHaveLength(2)
    expect(history[0].standings[0].score).toBe(25)
    expect(history[1].standings[1].score).toBe(25)
  })
})

describe('payment', () => {
  it('each loser pays 0.50 + 0.05 x own score to the winner', () => {
    const rounds: Round[] = [
      ...Array.from({ length: 5 }, () => points({ a: 20, b: 5, c: 0, d: 0 })), // a: 100 -> down, b: 25
      ...Array.from({ length: 5 }, () => points({ a: 21, b: 0, c: 4, d: 0 })), // a: -5 wins, b: 25, c: 20, d: 0
    ]
    const state = computeState(game(rounds))
    expect(state.winnerId).toBe('a')
    const lines = computePayments(state, huisregels)
    expect(lines).toEqual([
      { from: 'b', to: 'a', amount: 0.5 + 0.05 * 25 }, // 1.75
      { from: 'c', to: 'a', amount: 0.5 + 0.05 * 20 }, // 1.50
      { from: 'd', to: 'a', amount: 0.5 },
    ])
    expect(totalForWinner(lines)).toBe(3.75)
  })

  it('a loser with a negative score pays only the game fee', () => {
    const state = {
      winnerId: 'a',
      standings: [
        { playerId: 'a', score: -5, phase: 'down' as const },
        { playerId: 'b', score: -10, phase: 'up' as const },
      ],
    }
    expect(computePayments(state, huisregels)).toEqual([{ from: 'b', to: 'a', amount: 0.5 }])
  })

  it('no payments while the game is running', () => {
    const state = computeState(game([points({ a: 25, b: 0, c: 0, d: 0 })]))
    expect(computePayments(state, huisregels)).toEqual([])
  })

  it('formats euros in Dutch style', () => {
    expect(formatEuro(1.75)).toMatch(/1,75/)
  })
})
