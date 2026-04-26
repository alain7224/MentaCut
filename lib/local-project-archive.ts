export type ArchivedProjectEntry = {
  projectId: string
  archivedAt: string
}

const KEY = 'mentacut.local.project.archive'

export function readArchivedProjects(): ArchivedProjectEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ArchivedProjectEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeArchivedProjects(entries: ArchivedProjectEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(entries))
}

export function archiveProject(entries: ArchivedProjectEntry[], projectId: string): ArchivedProjectEntry[] {
  const exists = entries.some((item) => item.projectId === projectId)
  if (exists) return entries
  return [{ projectId, archivedAt: new Date().toISOString() }, ...entries]
}

export function restoreProject(entries: ArchivedProjectEntry[], projectId: string): ArchivedProjectEntry[] {
  return entries.filter((item) => item.projectId !== projectId)
}

export function isProjectArchived(entries: ArchivedProjectEntry[], projectId: string): boolean {
  return entries.some((item) => item.projectId === projectId)
}
