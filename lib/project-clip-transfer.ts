import type { LocalClip, LocalProject } from '@/lib/local-store'

export type SelectedClipsImport = {
  app: 'MentaCut'
  kind: 'selected-clips-export'
  exportedAt: string
  projectId: string
  projectName: string
  clipCount: number
  clips: LocalClip[]
}

export type ClipTransferMode = 'append' | 'prepend'

function cloneClip(clip: LocalClip): LocalClip {
  return JSON.parse(JSON.stringify(clip)) as LocalClip
}

function clipDuration(clip: LocalClip): number {
  return Math.max(0.1, clip.end - clip.start)
}

function sumClipDurations(clips: LocalClip[]): number {
  return clips.reduce((sum, clip) => sum + clipDuration(clip), 0)
}

function rebaseSequential(clips: LocalClip[], startAt = 0): LocalClip[] {
  let cursor = Math.max(0, startAt)
  return clips.map((clip) => {
    const duration = clipDuration(clip)
    const next: LocalClip = {
      ...cloneClip(clip),
      id: crypto.randomUUID(),
      start: Number(cursor.toFixed(3)),
      end: Number((cursor + duration).toFixed(3)),
    }
    cursor = next.end
    return next
  })
}

export function parseSelectedClipsImport(raw: string): LocalClip[] {
  const parsed = JSON.parse(raw) as Partial<SelectedClipsImport>
  if (!parsed || parsed.app !== 'MentaCut' || parsed.kind !== 'selected-clips-export' || !Array.isArray(parsed.clips)) {
    throw new Error('Archivo de clips inválido')
  }
  return parsed.clips as LocalClip[]
}

export function appendClipsToProject(project: LocalProject, incoming: LocalClip[]): LocalProject {
  const safeIncoming = rebaseSequential(incoming, project.clips.length ? project.clips[project.clips.length - 1].end : 0)
  return {
    ...project,
    clips: [...project.clips.map(cloneClip), ...safeIncoming],
  }
}

export function prependClipsToProject(project: LocalProject, incoming: LocalClip[]): LocalProject {
  const imported = rebaseSequential(incoming, 0)
  const shift = sumClipDurations(imported)

  const shiftedExisting = project.clips.map((clip) => {
    const next = cloneClip(clip)
    next.start = Number((next.start + shift).toFixed(3))
    next.end = Number((next.end + shift).toFixed(3))
    return next
  })

  return {
    ...project,
    clips: [...imported, ...shiftedExisting],
  }
}

export function importClipsIntoProject(project: LocalProject, incoming: LocalClip[], mode: ClipTransferMode): LocalProject {
  return mode === 'prepend' ? prependClipsToProject(project, incoming) : appendClipsToProject(project, incoming)
}

export function mergeProjectClips(target: LocalProject, source: LocalProject, mode: ClipTransferMode): LocalProject {
  return importClipsIntoProject(target, source.clips.map(cloneClip), mode)
}
