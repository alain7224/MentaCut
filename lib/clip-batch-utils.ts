import type { LocalClip, LocalProject } from '@/lib/local-store'

export type SelectedClipsExport = {
  app: 'MentaCut'
  kind: 'selected-clips-export'
  exportedAt: string
  projectId: string
  projectName: string
  clipCount: number
  clips: LocalClip[]
}

function cloneClip(clip: LocalClip): LocalClip {
  return JSON.parse(JSON.stringify(clip)) as LocalClip
}

export function getSelectedClips(project: LocalProject, selectedIds: string[]): LocalClip[] {
  const selectedSet = new Set(selectedIds)
  return project.clips.filter((clip) => selectedSet.has(clip.id)).map(cloneClip)
}

export function exportSelectedClips(project: LocalProject, selectedIds: string[]): string {
  const clips = getSelectedClips(project, selectedIds)
  const payload: SelectedClipsExport = {
    app: 'MentaCut',
    kind: 'selected-clips-export',
    exportedAt: new Date().toISOString(),
    projectId: project.id,
    projectName: project.name,
    clipCount: clips.length,
    clips,
  }
  return JSON.stringify(payload, null, 2)
}

export function deleteSelectedClips(project: LocalProject, selectedIds: string[]): LocalProject {
  const selectedSet = new Set(selectedIds)
  return {
    ...project,
    clips: project.clips.filter((clip) => !selectedSet.has(clip.id)),
  }
}

export function duplicateSelectedClips(project: LocalProject, selectedIds: string[]): LocalProject {
  const selectedSet = new Set(selectedIds)
  const clips: LocalClip[] = []

  for (const clip of project.clips) {
    clips.push(cloneClip(clip))
    if (selectedSet.has(clip.id)) {
      const duplicate = cloneClip(clip)
      duplicate.id = crypto.randomUUID()
      duplicate.title = `${clip.title} copia`
      clips.push(duplicate)
    }
  }

  return {
    ...project,
    clips,
  }
}

export function renumberClipTitles(project: LocalProject): LocalProject {
  return {
    ...project,
    clips: project.clips.map((clip, index) => ({
      ...clip,
      title: `Clip ${index + 1}`,
    })),
  }
}
