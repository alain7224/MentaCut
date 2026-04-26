import type { LocalClip, LocalProject } from '@/lib/local-store'

function cloneClip(clip: LocalClip): LocalClip {
  return JSON.parse(JSON.stringify(clip)) as LocalClip
}

export function canMergeAdjacentClips(project: LocalProject, selectedIds: string[]): boolean {
  if (selectedIds.length < 2) return false
  const indexes = project.clips
    .map((clip, index) => ({ id: clip.id, index }))
    .filter((item) => selectedIds.includes(item.id))
    .map((item) => item.index)
    .sort((a, b) => a - b)

  if (indexes.length !== selectedIds.length) return false
  for (let i = 1; i < indexes.length; i += 1) {
    if (indexes[i] !== indexes[i - 1] + 1) return false
  }
  return true
}

export function mergeAdjacentClips(project: LocalProject, selectedIds: string[]): LocalProject {
  if (!canMergeAdjacentClips(project, selectedIds)) return project

  const selectedSet = new Set(selectedIds)
  const selected = project.clips.filter((clip) => selectedSet.has(clip.id)).map(cloneClip)
  const first = selected[0]
  const last = selected[selected.length - 1]

  const merged: LocalClip = {
    ...cloneClip(first),
    id: crypto.randomUUID(),
    title: `${first.title} + ${last.title}`,
    start: first.start,
    end: last.end,
    headlineText: selected.map((clip) => clip.headlineText).filter(Boolean).join(' · '),
    captionText: selected.map((clip) => clip.captionText).filter(Boolean).join(' '),
  }

  const clips: LocalClip[] = []
  let inserted = false

  for (const clip of project.clips) {
    if (!selectedSet.has(clip.id)) {
      clips.push(cloneClip(clip))
      continue
    }
    if (!inserted) {
      clips.push(merged)
      inserted = true
    }
  }

  return {
    ...project,
    clips,
  }
}
