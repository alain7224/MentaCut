export type TransitionType = 'cut' | 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'blur' | 'flash'
export type TransitionCurve = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

export type ClipTransitionPlan = {
  id: string
  projectId: string
  fromClipId: string
  toClipId: string
  type: TransitionType
  duration: number
  curve: TransitionCurve
  note: string
}

const KEY = 'mentacut.local.transition.plans'

export function readTransitionPlans(): ClipTransitionPlan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClipTransitionPlan[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeTransitionPlans(plans: ClipTransitionPlan[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(plans))
}

export function upsertTransitionPlan(plans: ClipTransitionPlan[], plan: ClipTransitionPlan): ClipTransitionPlan[] {
  const index = plans.findIndex((item) => item.id === plan.id)
  if (index < 0) return [plan, ...plans]
  const next = [...plans]
  next[index] = plan
  return next
}

export function createDefaultTransitionPlan(projectId: string, fromClipId: string, toClipId: string): ClipTransitionPlan {
  return {
    id: crypto.randomUUID(),
    projectId,
    fromClipId,
    toClipId,
    type: 'cut',
    duration: 0.2,
    curve: 'ease-in-out',
    note: '',
  }
}
