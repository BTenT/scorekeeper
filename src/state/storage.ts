import type { Game } from '../engine/types'

const STORAGE_KEY = 'scorekeeper.games.v1'

export interface StoredData {
  games: Game[]
}

export function loadGames(storage: Pick<Storage, 'getItem'>): Game[] {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as StoredData
    return Array.isArray(data.games) ? data.games : []
  } catch {
    return []
  }
}

export function saveGames(storage: Pick<Storage, 'setItem'>, games: Game[]): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ games } satisfies StoredData))
  } catch {
    // Storage full or unavailable; the game continues in memory.
  }
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
