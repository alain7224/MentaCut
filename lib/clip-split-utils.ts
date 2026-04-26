import type { LocalClip, LocalProject } from '@/lib/local-store'

export type SplitParts = 2 | 3 | 4

function cloneClip(clip: LocalClip): LocalClip {
  return JSON.parse(JSON.stringify(clip)) as LocalClip
}

export function previewSplitClip(clip: LocalClip, parts: SplitParts): LocalClip[] {
  const duration = Math.max(0.1, clip.end - clip.start)
  const partDuration = duration / parts
  let cursor = clip.start

  return Array.from({ length: parts }).map((_, index) => {
    const nextStart = Number(cursor.toFixed(3))
    const nextEnd = Number((index === parts - 1 ? clip.end : cursor + partDuration).toFixed(3))
    cursor = nextEnd
    return {
      ...cloneClip(clip),
      id: crypto.randomUUID(),
      title: `${clip.title} parte ${index + 1}`,
      start: nextStart,
      end: Math.max(nextStart + 0.1, nextEnd),
    }
  })
}

export function splitClipInProject(project: LocalProject, clipId: string, parts: SplitParts): LocalProject {
  const clips: LocalClip[] = []

  for (const clip of project.clips) {
    if (clip.id !== clipId) {
      clips.push(cloneClip(clip))
      continue
    }
    clips.push(...previewSplitClip(clip, parts))
  }

  return {
    ...project,
    clips,
  }
}
