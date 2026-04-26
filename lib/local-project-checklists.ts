export type ProjectChecklistItem = {
  id: string
  projectId: string
  label: string
  done: boolean
}

const KEY = 'mentacut.local.project.checklists'

export function readProjectChecklistItems(): ProjectChecklistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectChecklistItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectChecklistItems(items: ProjectChecklistItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function getDefaultChecklist(projectId: string): ProjectChecklistItem[] {
  return [
    'Definir hook',
    'Completar cuerpo narrativo',
    'Cerrar con CTA',
    'Revisar subtítulos',
    'Revisar mezcla de audio',
    'Corregir timeline',
    'Última revisión visual',
  ].map((label) => ({
    id: crypto.randomUUID(),
    projectId,
    label,
    done: false,
  }))
}

export function getChecklistForProject(items: ProjectChecklistItem[], projectId: string): ProjectChecklistItem[] {
  const filtered = items.filter((item) => item.projectId === projectId)
  return filtered.length ? filtered : getDefaultChecklist(projectId)
}

export function upsertChecklistItem(items: ProjectChecklistItem[], item: ProjectChecklistItem): ProjectChecklistItem[] {
  const index = items.findIndex((entry) => entry.id === item.id)
  if (index < 0) return [item, ...items]
  const next = [...items]
  next[index] = item
  return next
}
