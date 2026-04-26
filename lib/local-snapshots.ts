import type { LocalProject } from '@/lib/local-store'

export type ProjectSnapshot = {
  id: string
  projectId: string
  name: string
  createdAt: string
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

export function writeProjectSnapshots(snapshots: ProjectSnapshot[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(snapshots))
}

export function createProjectSnapshot(project: LocalProject, name: string): ProjectSnapshot {
  return {
    id: crypto.randomUUID(),
    projectId: project.id,
    name: name.trim() || `${project.name} snapshot`,
    createdAt: new Date().toISOString(),
    project: JSON.parse(JSON.stringify(project)) as LocalProject,
  }
}

export function restoreProjectFromSnapshot(snapshot: ProjectSnapshot): LocalProject {
  return {
    ...JSON.parse(JSON.stringify(snapshot.project)) as LocalProject,
    updatedAt: new Date().toISOString(),
  }
}
