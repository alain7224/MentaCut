export type MediaImportQueueItem = {
  id: string
  name: string
  size: number
  progress: number
  status: 'queued' | 'processing' | 'done' | 'error'
  createdAt: string
}

const KEY = 'mentacut.local.media.import.queue'

export function readMediaImportQueue(): MediaImportQueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MediaImportQueueItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeMediaImportQueue(items: MediaImportQueueItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function createMediaImportQueueItem(file: File): MediaImportQueueItem {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    progress: 0,
    status: 'queued',
    createdAt: new Date().toISOString(),
  }
}

export function upsertMediaImportQueueItem(items: MediaImportQueueItem[], entry: MediaImportQueueItem): MediaImportQueueItem[] {
  const index = items.findIndex((item) => item.id === entry.id)
  if (index < 0) return [entry, ...items]
  const next = [...items]
  next[index] = entry
  return next
}

export function removeMediaImportQueueItem(items: MediaImportQueueItem[], id: string): MediaImportQueueItem[] {
  return items.filter((item) => item.id !== id)
}
