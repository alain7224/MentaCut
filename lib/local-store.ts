export type LocalProject = {
  id: string
  name: string
  format: '9:16' | '1:1' | '4:5' | '16:9'
  updatedAt: string
  clips: Array<{ id: string; title: string; start: number; end: number }>
}

const KEY = 'mentacut.local.projects'

export function readLocalProjects(): LocalProject[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalProject[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeLocalProjects(projects: LocalProject[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(projects))
}

export function createProject(name: string, format: LocalProject['format']): LocalProject {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    format,
    updatedAt: now,
    clips: [
      { id: crypto.randomUUID(), title: 'Clip 1', start: 0, end: 5 },
      { id: crypto.randomUUID(), title: 'Clip 2', start: 5, end: 11 },
    ],
  }
}
