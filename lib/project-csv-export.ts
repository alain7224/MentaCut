import type { LocalProject } from '@/lib/local-store'

function csvEscape(value: string | number | null | undefined): string {
  const text = String(value ?? '')
  const escaped = text.replace(/"/g, '""')
  return `"${escaped}"`
}

export function exportProjectClipsCsv(project: LocalProject): string {
  const header = ['clip_id', 'title', 'start', 'end', 'duration', 'headline', 'caption', 'media_id', 'audio_id', 'template_id']
  const rows = project.clips.map((clip) => [
    clip.id,
    clip.title,
    clip.start.toFixed(3),
    clip.end.toFixed(3),
    (clip.end - clip.start).toFixed(3),
    clip.headlineText,
    clip.captionText,
    clip.mediaId,
    clip.audioMediaId,
    clip.templateId,
  ])

  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}
