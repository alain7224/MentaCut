import type { ClipRoleEntry } from '@/lib/local-clip-roles'
import type { TimelineMarker } from '@/lib/local-timeline-markers'
import type { LocalProject } from '@/lib/local-store'

export type ProjectChapter = {
  title: string
  start: number
  end: number
  source: 'role' | 'marker'
}

export function buildProjectChapters(project: LocalProject, roles: ClipRoleEntry[], markers: TimelineMarker[]): ProjectChapter[] {
  const projectRoles = roles.filter((item) => item.projectId === project.id)
  const projectMarkers = markers.filter((item) => item.projectId === project.id).sort((a, b) => a.time - b.time)

  const fromRoles: ProjectChapter[] = project.clips.map((clip) => {
    const role = projectRoles.find((item) => item.clipId === clip.id)
    return {
      title: role ? `${role.role} · ${clip.title}` : clip.title,
      start: clip.start,
      end: clip.end,
      source: 'role',
    }
  })

  const fromMarkers: ProjectChapter[] = projectMarkers.map((marker, index) => ({
    title: marker.label,
    start: marker.time,
    end: Number((projectMarkers[index + 1]?.time ?? project.clips[project.clips.length - 1]?.end ?? marker.time).toFixed(3)),
    source: 'marker',
  }))

  return fromMarkers.length ? fromMarkers : fromRoles
}

export function exportProjectChaptersTxt(projectName: string, chapters: ProjectChapter[]): string {
  const lines = [`Chapters · ${projectName}`, '']
  chapters.forEach((chapter, index) => {
    lines.push(`#${index + 1} ${chapter.title}`)
    lines.push(`${chapter.start.toFixed(3)}s → ${chapter.end.toFixed(3)}s`)
    lines.push('')
  })
  return lines.join('\n')
}
