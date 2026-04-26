import type { LocalProject } from '@/lib/local-store'

export type ClipRenameMode = 'replace' | 'prefix-number' | 'suffix-number'

export function renameProjectClips(project: LocalProject, input: {
  mode: ClipRenameMode
  value: string
  startNumber: number
}): LocalProject {
  const base = input.value.trim() || 'Clip'
  const start = Math.max(1, input.startNumber)

  return {
    ...project,
    clips: project.clips.map((clip, index) => {
      const n = start + index
      let title = clip.title
      if (input.mode === 'replace') title = `${base} ${n}`
      if (input.mode === 'prefix-number') title = `${base} ${n} · ${clip.title}`
      if (input.mode === 'suffix-number') title = `${clip.title} · ${base} ${n}`
      return { ...clip, title: title.trim() }
    }),
  }
}
