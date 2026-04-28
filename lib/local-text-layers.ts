export type TextLayerEntry = {
  id: string
  projectId: string
  clipId: string
  text: string
  x: number
  y: number
  scale: number
  fontSize: number
  color: string
  background: string
  enter: 'none' | 'fade' | 'slide-up' | 'zoom'
  exit: 'none' | 'fade' | 'slide-down' | 'zoom'
}

const KEY = 'mentacut.local.text.layers'

export function readTextLayers(): TextLayerEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TextLayerEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeTextLayers(items: TextLayerEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function createTextLayer(projectId: string, clipId: string): TextLayerEntry {
  return {
    id: crypto.randomUUID(),
    projectId,
    clipId,
    text: 'Texto',
    x: 50,
    y: 18,
    scale: 1,
    fontSize: 26,
    color: '#FFFFFF',
    background: 'rgba(0,0,0,0.35)',
    enter: 'fade',
    exit: 'fade',
  }
}

export function upsertTextLayer(items: TextLayerEntry[], entry: TextLayerEntry): TextLayerEntry[] {
  const index = items.findIndex((item) => item.id === entry.id)
  if (index < 0) return [entry, ...items]
  const next = [...items]
  next[index] = entry
  return next
}

export function removeTextLayer(items: TextLayerEntry[], id: string): TextLayerEntry[] {
  return items.filter((item) => item.id !== id)
}
