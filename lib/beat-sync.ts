import type { LocalProject } from '@/lib/local-store'

export function alignProjectClipsToBeatMarkers(project: LocalProject, markers: number[]): LocalProject {
  if (!markers.length || project.clips.length === 0) return project

  let lastEnd = 0
  return {
    ...project,
    clips: project.clips.map((clip, index) => {
      const originalDuration = Math.max(0.1, clip.end - clip.start)
      const start = Number((markers[index] ?? lastEnd).toFixed(3))
      const nextMarker = markers[index + 1]
      const end = Number((nextMarker ?? (start + originalDuration)).toFixed(3))
      lastEnd = Math.max(start + 0.1, end)
      return {
        ...clip,
        start,
        end: lastEnd,
      }
    }),
  }
}
