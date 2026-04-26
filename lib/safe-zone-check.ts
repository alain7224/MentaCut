import type { LocalProject } from '@/lib/local-store'
import type { ProjectSubtitleStyle } from '@/lib/local-subtitle-style'

export type SafeZoneIssue = {
  clipId: string
  clipTitle: string
  severity: 'high' | 'medium' | 'low'
  message: string
}

export function evaluateSubtitleSafeZones(project: LocalProject, style: ProjectSubtitleStyle | null): SafeZoneIssue[] {
  const issues: SafeZoneIssue[] = []
  if (!style) return issues

  for (const clip of project.clips) {
    if (style.position === 'bottom') {
      if (clip.frameY > 68) {
        issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'high', message: 'El contenido está muy abajo y puede chocar con subtítulos en la zona inferior.' })
      } else if (clip.frameY > 58) {
        issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'medium', message: 'El contenido se acerca a la zona inferior de subtítulos.' })
      }
    }

    if (style.position === 'top') {
      if (clip.frameY < 32) {
        issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'high', message: 'El contenido está muy arriba y puede chocar con subtítulos en la zona superior.' })
      } else if (clip.frameY < 42) {
        issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'medium', message: 'El contenido se acerca a la zona superior de subtítulos.' })
      }
    }

    if (style.position === 'center') {
      if (clip.frameY >= 40 && clip.frameY <= 60) {
        issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'high', message: 'El contenido cruza la zona central donde caerían los subtítulos.' })
      }
    }

    if (clip.frameScale > 1.25) {
      issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'low', message: 'El scale es alto y reduce margen visual para el caption.' })
    }
  }

  return issues
}
