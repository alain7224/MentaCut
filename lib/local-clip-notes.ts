export type ClipNoteEntry = {
  id: string
  projectId: string
  clipId: string
  note: string
  shotIdea: string
  reshoot: boolean
}

const KEY = 'mentacut.local.clip.notes'

export function readClipNotes(): ClipNoteEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClipNoteEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeClipNotes(entries: ClipNoteEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(entries))
}

export function createDefaultClipNote(projectId: string, clipId: string): ClipNoteEntry {
  return {
    id: crypto.randomUUID(),
    projectId,
    clipId,
    note: '',
    shotIdea: '',
    reshoot: false,
  }
}

export function getClipNoteEntry(entries: ClipNoteEntry[], projectId: string, clipId: string): ClipNoteEntry | null {
  return entries.find((item) => item.projectId === projectId && item.clipId === clipId) ?? null
}

export function upsertClipNote(entries: ClipNoteEntry[], entry: ClipNoteEntry): ClipNoteEntry[] {
  const index = entries.findIndex((item) => item.projectId === entry.projectId && item.clipId === entry.clipId)
  if (index < 0) return [entry, ...entries]
  const next = [...entries]
  next[index] = entry
  return next
}
