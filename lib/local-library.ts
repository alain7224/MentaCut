export type FavoriteKind = 'template' | 'sticker' | 'overlay' | 'text'

export type LocalLibraryFavorites = {
  templateIds: string[]
  stickerIds: string[]
  overlayIds: string[]
  textValues: string[]
}

const KEY = 'mentacut.local.library.favorites'

export const DEFAULT_LIBRARY_FAVORITES: LocalLibraryFavorites = {
  templateIds: [],
  stickerIds: [],
  overlayIds: [],
  textValues: [],
}

export function readLocalLibraryFavorites(): LocalLibraryFavorites {
  if (typeof window === 'undefined') return DEFAULT_LIBRARY_FAVORITES
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_LIBRARY_FAVORITES
    const parsed = JSON.parse(raw) as Partial<LocalLibraryFavorites>
    return {
      templateIds: Array.isArray(parsed.templateIds) ? parsed.templateIds : [],
      stickerIds: Array.isArray(parsed.stickerIds) ? parsed.stickerIds : [],
      overlayIds: Array.isArray(parsed.overlayIds) ? parsed.overlayIds : [],
      textValues: Array.isArray(parsed.textValues) ? parsed.textValues : [],
    }
  } catch {
    return DEFAULT_LIBRARY_FAVORITES
  }
}

export function writeLocalLibraryFavorites(favorites: LocalLibraryFavorites) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(favorites))
}

export function toggleFavoriteId(ids: string[], value: string): string[] {
  return ids.includes(value) ? ids.filter((item) => item !== value) : [...ids, value]
}
