export type ProjectTagEntry = {
  id: string
  projectId: string
  value: string
}

const KEY = 'mentacut.local.project.tags'

export function readProjectTags(): ProjectTagEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectTagEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectTags(items: ProjectTagEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function addProjectTag(items: ProjectTagEntry[], projectId: string, value: string): ProjectTagEntry[] {
  const clean = value.trim()
  if (!clean) return items
  const exists = items.some((item) => item.projectId === projectId && item.value.toLowerCase() === clean.toLowerCase())
  if (exists) return items
  return [{ id: crypto.randomUUID(), projectId, value: clean }, ...items]
}

export function removeProjectTag(items: ProjectTagEntry[], tagId: string): ProjectTagEntry[] {
  return items.filter((item) => item.id !== tagId)
}
