import type { LocalProject } from '@/lib/local-store'

export type ProjectSnapshot = {
  id: string
  projectId: string
  projectName: string
  createdAt: string
  note: string
  project: LocalProject
}

const KEY = 'mentacut.local.project.snapshots'

export function readProjectSnapshots(): ProjectSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectSnapshot[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectSnapshots(items: ProjectSnapshot[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function createProjectSnapshot(project: LocalProject, note: string): ProjectSnapshot {
  return {
    id: crypto.randomUUID(),
    projectId: project.id,
    projectName: project.name,
    createdAt: new Date().toISOString(),
    note: note.trim(),
    project: JSON.parse(JSON.stringify(project)) as LocalProject,
  }
}
