import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Game, Player, Round, RuleSet } from '../engine/types'
import { loadGames, newId, saveGames } from './storage'

export interface StoreState {
  games: Game[]
  activeGameId: string | null
}

export type StoreAction =
  | { type: 'new-game'; players: Player[]; ruleSet: RuleSet }
  | { type: 'open-game'; gameId: string }
  | { type: 'close-game' }
  | { type: 'add-round'; gameId: string; round: Round }
  | { type: 'undo-round'; gameId: string }
  | { type: 'set-tie-winner'; gameId: string; playerId: string }
  | { type: 'delete-game'; gameId: string }

export function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'new-game': {
      const game: Game = {
        id: newId(),
        createdAt: Date.now(),
        players: action.players,
        ruleSet: action.ruleSet,
        rounds: [],
      }
      return { games: [game, ...state.games], activeGameId: game.id }
    }
    case 'open-game':
      return { ...state, activeGameId: action.gameId }
    case 'close-game':
      return { ...state, activeGameId: null }
    case 'add-round':
      return {
        ...state,
        games: state.games.map((g) =>
          g.id === action.gameId ? { ...g, rounds: [...g.rounds, action.round] } : g,
        ),
      }
    case 'undo-round':
      return {
        ...state,
        games: state.games.map((g) =>
          g.id === action.gameId ? { ...g, rounds: g.rounds.slice(0, -1), tieWinnerId: undefined } : g,
        ),
      }
    case 'set-tie-winner':
      return {
        ...state,
        games: state.games.map((g) =>
          g.id === action.gameId ? { ...g, tieWinnerId: action.playerId } : g,
        ),
      }
    case 'delete-game':
      return {
        games: state.games.filter((g) => g.id !== action.gameId),
        activeGameId: state.activeGameId === action.gameId ? null : state.activeGameId,
      }
  }
}

interface StoreContextValue {
  state: StoreState
  dispatch: React.Dispatch<StoreAction>
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    games: loadGames(localStorage),
    activeGameId: null,
  }))

  useEffect(() => {
    saveGames(localStorage, state.games)
  }, [state.games])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useGameStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useGameStore must be used within GameStoreProvider')
  return ctx
}

export function useActiveGame(): Game | null {
  const { state } = useGameStore()
  return state.games.find((g) => g.id === state.activeGameId) ?? null
}
