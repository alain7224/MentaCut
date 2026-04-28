import type { LocalProject } from '@/lib/local-store'

export type ProjectHistoryState = {
  id: string
  projectId: string
  createdAt: string
  note: string
  project: LocalProject
}

export type ProjectHistoryBundle = {
  projectId: string
  cursor: number
  states: ProjectHistoryState[]
}

const KEY = 'mentacut.local.project.history'

export function readProjectHistoryBundles(): ProjectHistoryBundle[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectHistoryBundle[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectHistoryBundles(items: ProjectHistoryBundle[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function getProjectHistoryBundle(items: ProjectHistoryBundle[], projectId: string): ProjectHistoryBundle | null {
  return items.find((item) => item.projectId === projectId) ?? null
}

export function pushProjectHistoryState(items: ProjectHistoryBundle[], project: LocalProject, note: string): ProjectHistoryBundle[] {
  const current = getProjectHistoryBundle(items, project.id)
  const state: ProjectHistoryState = {
    id: crypto.randomUUID(),
    projectId: project.id,
    createdAt: new Date().toISOString(),
    note: note.trim(),
    project: JSON.parse(JSON.stringify(project)) as LocalProject,
  }

  if (!current) {
    return [{ projectId: project.id, cursor: 0, states: [state] }, ...items]
  }

  const trimmed = current.states.slice(0, current.cursor + 1)
  const nextBundle: ProjectHistoryBundle = {
    ...current,
    cursor: trimmed.length,
    states: [...trimmed, state].slice(-30),
  }

  return items.map((item) => item.projectId === project.id ? nextBundle : item)
}

export function moveProjectHistoryCursor(items: ProjectHistoryBundle[], projectId: string, direction: 'undo' | 'redo'): ProjectHistoryBundle[] {
  return items.map((item) => {
    if (item.projectId !== projectId) return item
    const nextCursor = direction === 'undo' ? Math.max(0, item.cursor - 1) : Math.min(item.states.length - 1, item.cursor + 1)
    return { ...item, cursor: nextCursor }
  })
}
