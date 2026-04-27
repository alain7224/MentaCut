import type { ProjectTagEntry } from '@/lib/local-project-tags'
import type { LocalProject } from '@/lib/local-store'

export type FinderResult = {
  projectId: string
  projectName: string
  clipId: string | null
  clipTitle: string | null
  field: 'project' | 'title' | 'headline' | 'caption' | 'tag'
  snippet: string
}

function includesText(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase())
}

export function findAcrossProjects(projects: LocalProject[], tags: ProjectTagEntry[], query: string): FinderResult[] {
  const clean = query.trim()
  if (!clean) return []

  const results: FinderResult[] = []

  for (const project of projects) {
    if (includesText(project.name, clean)) {
      results.push({ projectId: project.id, projectName: project.name, clipId: null, clipTitle: null, field: 'project', snippet: project.name })
    }

    for (const tag of tags.filter((item) => item.projectId === project.id)) {
      if (includesText(tag.value, clean)) {
        results.push({ projectId: project.id, projectName: project.name, clipId: null, clipTitle: null, field: 'tag', snippet: tag.value })
      }
    }

    for (const clip of project.clips) {
      if (includesText(clip.title, clean)) {
        results.push({ projectId: project.id, projectName: project.name, clipId: clip.id, clipTitle: clip.title, field: 'title', snippet: clip.title })
      }
      if (includesText(clip.headlineText, clean)) {
        results.push({ projectId: project.id, projectName: project.name, clipId: clip.id, clipTitle: clip.title, field: 'headline', snippet: clip.headlineText })
      }
      if (includesText(clip.captionText, clean)) {
        results.push({ projectId: project.id, projectName: project.name, clipId: clip.id, clipTitle: clip.title, field: 'caption', snippet: clip.captionText })
      }
    }
  }

  return results
}
