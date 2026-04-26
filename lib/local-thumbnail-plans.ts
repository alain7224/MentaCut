export type ThumbnailTextAlign = 'left' | 'center' | 'right'
export type ThumbnailStyle = 'bold' | 'clean' | 'dramatic'

export type ProjectThumbnailPlan = {
  id: string
  projectId: string
  clipId: string | null
  title: string
  subtitle: string
  badge: string
  style: ThumbnailStyle
  align: ThumbnailTextAlign
  backgroundDim: number
}

const KEY = 'mentacut.local.thumbnail.plans'

export function readProjectThumbnailPlans(): ProjectThumbnailPlan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectThumbnailPlan[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectThumbnailPlans(plans: ProjectThumbnailPlan[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(plans))
}

export function createDefaultThumbnailPlan(projectId: string): ProjectThumbnailPlan {
  return {
    id: crypto.randomUUID(),
    projectId,
    clipId: null,
    title: '',
    subtitle: '',
    badge: '',
    style: 'bold',
    align: 'center',
    backgroundDim: 25,
  }
}

export function upsertProjectThumbnailPlan(plans: ProjectThumbnailPlan[], plan: ProjectThumbnailPlan): ProjectThumbnailPlan[] {
  const index = plans.findIndex((item) => item.projectId === plan.projectId)
  if (index < 0) return [plan, ...plans]
  const next = [...plans]
  next[index] = plan
  return next
}
