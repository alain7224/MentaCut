export type PublishProfile = {
  id: string
  projectId: string
  platform: 'TikTok' | 'Instagram Reels' | 'YouTube Shorts' | 'YouTube' | 'Generic'
  title: string
  description: string
  hashtags: string
  firstComment: string
  scheduleNote: string
}

const KEY = 'mentacut.local.publish.profiles'

export function readPublishProfiles(): PublishProfile[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PublishProfile[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writePublishProfiles(items: PublishProfile[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function createDefaultPublishProfile(projectId: string): PublishProfile {
  return {
    id: crypto.randomUUID(),
    projectId,
    platform: 'TikTok',
    title: '',
    description: '',
    hashtags: '',
    firstComment: '',
    scheduleNote: '',
  }
}

export function upsertPublishProfile(items: PublishProfile[], entry: PublishProfile): PublishProfile[] {
  const index = items.findIndex((item) => item.projectId === entry.projectId)
  if (index < 0) return [entry, ...items]
  const next = [...items]
  next[index] = entry
  return next
}
