import type { LocalMediaRecord } from '@/lib/local-media'
import type { LocalProject } from '@/lib/local-store'

export type ProjectAssetRow = {
  assetId: string
  name: string
  kind: string
  size: number
  duration: number | null
  usedByClips: number
}

export function buildProjectAssetReport(project: LocalProject, mediaLibrary: LocalMediaRecord[]): ProjectAssetRow[] {
  const usage = new Map<string, number>()
  for (const clip of project.clips) {
    if (clip.mediaId) usage.set(clip.mediaId, (usage.get(clip.mediaId) ?? 0) + 1)
    if (clip.audioMediaId) usage.set(clip.audioMediaId, (usage.get(clip.audioMediaId) ?? 0) + 1)
  }

  return mediaLibrary
    .filter((item) => usage.has(item.id))
    .map((item) => ({
      assetId: item.id,
      name: item.name,
      kind: item.kind,
      size: item.size,
      duration: item.duration,
      usedByClips: usage.get(item.id) ?? 0,
    }))
    .sort((a, b) => b.usedByClips - a.usedByClips || a.name.localeCompare(b.name))
}
