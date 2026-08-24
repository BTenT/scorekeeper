import { describe, expect, it } from 'vitest'
import { reducer, type StoreState } from './gameStore'
import { loadGames, saveGames } from './storage'
import { huisregels } from '../engine/rules'
import type { Game } from '../engine/types'

const players = [
  { id: 'a', name: 'Anna' },
  { id: 'b', name: 'Bram' },
  { id: 'c', name: 'Cor' },
  { id: 'd', name: 'Dirk' },
]

const empty: StoreState = { games: [], activeGameId: null }

function fakeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  }
}

describe('gameStore reducer', () => {
  it('creates and opens a new game', () => {
    const state = reducer(empty, { type: 'new-game', players, ruleSet: huisregels })
    expect(state.games).toHaveLength(1)
    expect(state.activeGameId).toBe(state.games[0].id)
    expect(state.games[0].rounds).toEqual([])
  })

  it('adds and undoes rounds', () => {
    let state = reducer(empty, { type: 'new-game', players, ruleSet: huisregels })
    const id = state.games[0].id
    state = reducer(state, { type: 'add-round', gameId: id, round: { kind: 'points', points: { a: 25, b: 0, c: 0, d: 0 } } })
    state = reducer(state, { type: 'add-round', gameId: id, round: { kind: 'pit', playerId: 'b', choice: 'self' } })
    expect(state.games[0].rounds).toHaveLength(2)
    state = reducer(state, { type: 'undo-round', gameId: id })
    expect(state.games[0].rounds).toHaveLength(1)
    expect(state.games[0].rounds[0].kind).toBe('points')
  })

  it('records a tie winner and clears it on undo', () => {
    let state = reducer(empty, { type: 'new-game', players, ruleSet: huisregels })
    const id = state.games[0].id
    state = reducer(state, { type: 'add-round', gameId: id, round: { kind: 'points', points: { a: 25, b: 0, c: 0, d: 0 } } })
    state = reducer(state, { type: 'set-tie-winner', gameId: id, playerId: 'c' })
    expect(state.games[0].tieWinnerId).toBe('c')
    state = reducer(state, { type: 'undo-round', gameId: id })
    expect(state.games[0].tieWinnerId).toBeUndefined()
  })

  it('deletes a game and clears the active id', () => {
    let state = reducer(empty, { type: 'new-game', players, ruleSet: huisregels })
    state = reducer(state, { type: 'delete-game', gameId: state.games[0].id })
    expect(state.games).toHaveLength(0)
    expect(state.activeGameId).toBeNull()
  })
})

describe('storage', () => {
  it('round-trips games through storage', () => {
    const storage = fakeStorage()
    const game: Game = { id: 'g1', createdAt: 1, players, ruleSet: huisregels, rounds: [] }
    saveGames(storage, [game])
    expect(loadGames(storage)).toEqual([game])
  })

  it('returns an empty list for missing or corrupt data', () => {
    const storage = fakeStorage()
    expect(loadGames(storage)).toEqual([])
    storage.setItem('scorekeeper.games.v1', '{not json')
    expect(loadGames(storage)).toEqual([])
  })
})
