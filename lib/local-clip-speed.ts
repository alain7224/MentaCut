export type ClipSpeedPlan = {
  id: string
  projectId: string
  clipId: string
  speed: number
  preservePitch: boolean
}

const KEY = 'mentacut.local.clip.speed'

export function readClipSpeedPlans(): ClipSpeedPlan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClipSpeedPlan[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeClipSpeedPlans(items: ClipSpeedPlan[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function createDefaultClipSpeedPlan(projectId: string, clipId: string): ClipSpeedPlan {
  return {
    id: crypto.randomUUID(),
    projectId,
    clipId,
    speed: 1,
    preservePitch: true,
  }
}

export function getClipSpeedPlan(items: ClipSpeedPlan[], projectId: string, clipId: string): ClipSpeedPlan | null {
  return items.find((item) => item.projectId === projectId && item.clipId === clipId) ?? null
}

export function upsertClipSpeedPlan(items: ClipSpeedPlan[], entry: ClipSpeedPlan): ClipSpeedPlan[] {
  const index = items.findIndex((item) => item.projectId === entry.projectId && item.clipId === entry.clipId)
  if (index < 0) return [entry, ...items]
  const next = [...items]
  next[index] = entry
  return next
}

export function getEffectiveClipDuration(start: number, end: number, speed: number): number {
  const duration = Math.max(0.1, end - start)
  const safeSpeed = Math.max(0.1, speed)
  return Number((duration / safeSpeed).toFixed(3))
}
