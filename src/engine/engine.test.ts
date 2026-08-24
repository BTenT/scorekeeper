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

// 4 rounds that bring player a to exactly 100 and start the return game
const aTo100: Round[] = Array.from({ length: 4 }, () => points({ a: 25, b: 0, c: 0, d: 0 }))

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
  it('adds points while nobody has reached 100', () => {
    const state = computeState(game([points({ a: 10, b: 8, c: 7, d: 0 })]))
    expect(state.standings.map((s) => s.score)).toEqual([10, 8, 7, 0])
    expect(state.phase).toBe('up')
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

  it('a negative score before the return game does not win', () => {
    const state = computeState(game([{ kind: 'pit', playerId: 'a', choice: 'self' }]))
    expect(state.winnerId).toBeNull()
    expect(state.phase).toBe('up')
  })

  it('passing 100 keeps the overshoot and starts the return game for everyone', () => {
    const rounds: Round[] = [
      ...Array.from({ length: 3 }, () => points({ a: 25, b: 0, c: 0, d: 0 })), // a: 75
      points({ a: 15, b: 10, c: 0, d: 0 }), // a: 90
      points({ a: 17, b: 8, c: 0, d: 0 }), // a: 107, return game starts
    ]
    const state = computeState(game(rounds))
    expect(state.standings[0].score).toBe(107)
    expect(state.phase).toBe('down')
  })

  it('after someone reached 100, points count down for ALL players', () => {
    const state = computeState(game([...aTo100, points({ a: 0, b: 20, c: 5, d: 0 })]))
    expect(state.standings.map((s) => s.score)).toEqual([100, -20, -5, 0])
  })

  it('a low player dropping below 0 in the return game wins', () => {
    const state = computeState(game([...aTo100, points({ a: 0, b: 0, c: 10, d: 15 })]))
    // c: -10, d: -15 -> lowest score wins
    expect(state.winnerId).toBe('d')
  })

  it('a player who is already negative when the return game starts wins immediately', () => {
    const rounds: Round[] = [{ kind: 'pit', playerId: 'b', choice: 'self' }, ...aTo100]
    const state = computeState(game(rounds))
    expect(state.standings[1].score).toBe(-25)
    expect(state.winnerId).toBe('b')
  })

  it('exactly 0 in the return game does not win', () => {
    const rounds: Round[] = [...aTo100, ...Array.from({ length: 4 }, () => points({ a: 25, b: 0, c: 0, d: 0 }))]
    const state = computeState(game(rounds)) // a: 100 up, then -100 back to exactly 0
    expect(state.standings[0].score).toBe(0)
    expect(state.phase).toBe('down')
    expect(state.winnerId).toBeNull()
  })

  it('pit self in the return game still subtracts 25 and can win', () => {
    const down: Round[] = Array.from({ length: 3 }, () => points({ a: 25, b: 0, c: 0, d: 0 })) // a: 25
    const pit: Round = { kind: 'pit', playerId: 'a', choice: 'self' } // a: 0, no win
    const pit2: Round = { kind: 'pit', playerId: 'a', choice: 'self' } // a: -25, wins
    const state = computeState(game([...aTo100, ...down, pit, pit2]))
    expect(state.standings[0].score).toBe(-25)
    expect(state.winnerId).toBe('a')
  })

  it('rounds after the winning round are ignored', () => {
    const rounds: Round[] = [
      ...aTo100,
      ...Array.from({ length: 5 }, () => points({ a: 25, b: 0, c: 0, d: 0 })), // a: -25, wins
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
      points({ a: 0, b: 25, c: 0, d: 0 }), // b: 25
      ...aTo100, // a: 100, return game starts
      ...Array.from({ length: 5 }, () => points({ a: 25, b: 0, c: 0, d: 0 })), // a: -25, wins
    ]
    const state = computeState(game(rounds))
    expect(state.winnerId).toBe('a')
    const lines = computePayments(state, huisregels)
    expect(lines).toEqual([
      { from: 'b', to: 'a', amount: 0.5 + 0.05 * 25 }, // 1.75
      { from: 'c', to: 'a', amount: 0.5 },
      { from: 'd', to: 'a', amount: 0.5 },
    ])
    expect(totalForWinner(lines)).toBe(2.75)
  })

  it('a loser with a negative score pays only the game fee', () => {
    const state = {
      winnerId: 'a',
      phase: 'down' as const,
      standings: [
        { playerId: 'a', score: -15 },
        { playerId: 'b', score: -10 },
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
