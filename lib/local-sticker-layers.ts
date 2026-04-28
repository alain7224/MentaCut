export type StickerPreset = '🔥' | '⭐' | '✅' | '⚡' | '💥' | '🎯' | '❤️' | '🚀'

export type StickerLayerEntry = {
  id: string
  projectId: string
  clipId: string
  preset: StickerPreset
  x: number
  y: number
  scale: number
  rotation: number
}

const KEY = 'mentacut.local.sticker.layers'

export function readStickerLayers(): StickerLayerEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StickerLayerEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeStickerLayers(items: StickerLayerEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function createStickerLayer(projectId: string, clipId: string, preset: StickerPreset = '⭐'): StickerLayerEntry {
  return {
    id: crypto.randomUUID(),
    projectId,
    clipId,
    preset,
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
  }
}

export function upsertStickerLayer(items: StickerLayerEntry[], entry: StickerLayerEntry): StickerLayerEntry[] {
  const index = items.findIndex((item) => item.id === entry.id)
  if (index < 0) return [entry, ...items]
  const next = [...items]
  next[index] = entry
  return next
}

export function removeStickerLayer(items: StickerLayerEntry[], id: string): StickerLayerEntry[] {
  return items.filter((item) => item.id !== id)
}
