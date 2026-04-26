export type ProjectBrief = {
  id: string
  projectId: string
  audience: string
  platform: string
  objective: string
  offer: string
  cta: string
  voice: string
  notes: string
}

const KEY = 'mentacut.local.project.briefs'

export function readProjectBriefs(): ProjectBrief[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectBrief[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectBriefs(briefs: ProjectBrief[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(briefs))
}

export function createDefaultProjectBrief(projectId: string): ProjectBrief {
  return {
    id: crypto.randomUUID(),
    projectId,
    audience: '',
    platform: 'TikTok / Reels / Shorts',
    objective: '',
    offer: '',
    cta: '',
    voice: 'Directa y clara',
    notes: '',
  }
}

export function upsertProjectBrief(briefs: ProjectBrief[], brief: ProjectBrief): ProjectBrief[] {
  const index = briefs.findIndex((item) => item.projectId === brief.projectId)
  if (index < 0) return [brief, ...briefs]
  const next = [...briefs]
  next[index] = brief
  return next
}
