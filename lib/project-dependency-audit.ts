import type { LocalMediaRecord } from '@/lib/local-media'
import type { LocalProject } from '@/lib/local-store'

export type ProjectDependencyIssue = {
  severity: 'high' | 'medium' | 'low'
  type: 'missing-media' | 'missing-audio' | 'missing-template' | 'empty-copy'
  clipId: string
  clipTitle: string
  message: string
}

export function auditProjectDependencies(project: LocalProject, mediaLibrary: LocalMediaRecord[]): ProjectDependencyIssue[] {
  const mediaIds = new Set(mediaLibrary.map((item) => item.id))
  const issues: ProjectDependencyIssue[] = []

  for (const clip of project.clips) {
    if (clip.mediaId && !mediaIds.has(clip.mediaId)) {
      issues.push({
        severity: 'high',
        type: 'missing-media',
        clipId: clip.id,
        clipTitle: clip.title,
        message: 'El clip apunta a una media visual que ya no está en la librería local.',
      })
    }

    if (clip.audioMediaId && !mediaIds.has(clip.audioMediaId)) {
      issues.push({
        severity: 'high',
        type: 'missing-audio',
        clipId: clip.id,
        clipTitle: clip.title,
        message: 'El clip apunta a un audio local que ya no está disponible.',
      })
    }

    if (!clip.templateId) {
      issues.push({
        severity: 'low',
        type: 'missing-template',
        clipId: clip.id,
        clipTitle: clip.title,
        message: 'El clip no tiene templateId asignado.',
      })
    }

    if (!clip.headlineText.trim() && !clip.captionText.trim()) {
      issues.push({
        severity: 'medium',
        type: 'empty-copy',
        clipId: clip.id,
        clipTitle: clip.title,
        message: 'El clip no tiene headline ni caption.',
      })
    }
  }

  return issues
}
