export type ClipSourceTrimPlan = {
  id: string
  projectId: string
  clipId: string
  mediaStart: number
  mediaEnd: number | null
}

const KEY = 'mentacut.local.source.trim'

export function readClipSourceTrimPlans(): ClipSourceTrimPlan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClipSourceTrimPlan[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeClipSourceTrimPlans(items: ClipSourceTrimPlan[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function createDefaultClipSourceTrimPlan(projectId: string, clipId: string): ClipSourceTrimPlan {
  return {
    id: crypto.randomUUID(),
    projectId,
    clipId,
    mediaStart: 0,
    mediaEnd: null,
  }
}

export function getClipSourceTrimPlan(items: ClipSourceTrimPlan[], projectId: string, clipId: string): ClipSourceTrimPlan | null {
  return items.find((item) => item.projectId === projectId && item.clipId === clipId) ?? null
}

export function upsertClipSourceTrimPlan(items: ClipSourceTrimPlan[], entry: ClipSourceTrimPlan): ClipSourceTrimPlan[] {
  const index = items.findIndex((item) => item.projectId === entry.projectId && item.clipId === entry.clipId)
  if (index < 0) return [entry, ...items]
  const next = [...items]
  next[index] = entry
  return next
}

export function resolveSourceTrim(duration: number, plan: ClipSourceTrimPlan | null): { start: number; end: number } {
  const safeDuration = Math.max(0.1, duration)
  const start = Math.max(0, Math.min(plan?.mediaStart ?? 0, safeDuration - 0.05))
  const requestedEnd = plan?.mediaEnd ?? safeDuration
  const end = Math.max(start + 0.05, Math.min(requestedEnd, safeDuration))
  return {
    start: Number(start.toFixed(3)),
    end: Number(end.toFixed(3)),
  }
}
