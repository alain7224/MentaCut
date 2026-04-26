export type RenderQueueStatus = 'queued' | 'ready' | 'exported'
export type RenderTarget = 'TikTok' | 'Instagram Reels' | 'YouTube Shorts' | 'YouTube' | 'Generic'

export type RenderQueueItem = {
  id: string
  projectId: string
  projectName: string
  format: string
  target: RenderTarget
  resolution: '1080p' | '1440p' | '2160p'
  fps: 24 | 25 | 30 | 60
  status: RenderQueueStatus
  notes: string
  createdAt: string
}

const KEY = 'mentacut.local.render.queue'

export function readRenderQueue(): RenderQueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RenderQueueItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeRenderQueue(items: RenderQueueItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function createRenderQueueItem(projectId: string, projectName: string, format: string): RenderQueueItem {
  return {
    id: crypto.randomUUID(),
    projectId,
    projectName,
    format,
    target: 'TikTok',
    resolution: '1080p',
    fps: 30,
    status: 'queued',
    notes: '',
    createdAt: new Date().toISOString(),
  }
}

export function upsertRenderQueueItem(items: RenderQueueItem[], item: RenderQueueItem): RenderQueueItem[] {
  const index = items.findIndex((entry) => entry.id === item.id)
  if (index < 0) return [item, ...items]
  const next = [...items]
  next[index] = item
  return next
}
