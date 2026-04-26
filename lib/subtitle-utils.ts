import type { LocalProject } from '@/lib/local-store'

export type SubtitleMode = 'headline' | 'caption' | 'mixed'

export type SubtitleCue = {
  id: string
  index: number
  clipId: string
  clipTitle: string
  start: number
  end: number
  text: string
}

export function formatSrtTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = Math.floor(safe % 60)
  const millis = Math.round((safe - Math.floor(safe)) * 1000)

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  const ms = String(millis).padStart(3, '0')

  return `${hh}:${mm}:${ss},${ms}`
}

export function buildSubtitleCues(project: LocalProject, mode: SubtitleMode): SubtitleCue[] {
  return project.clips.map((clip, index) => {
    const headline = clip.headlineText?.trim() || ''
    const caption = clip.captionText?.trim() || ''
    const title = clip.title?.trim() || `Clip ${index + 1}`

    let text = ''
    if (mode === 'headline') text = headline || title
    if (mode === 'caption') text = caption || headline || title
    if (mode === 'mixed') text = [headline || title, caption].filter(Boolean).join('\n')

    return {
      id: crypto.randomUUID(),
      index: index + 1,
      clipId: clip.id,
      clipTitle: title,
      start: clip.start,
      end: clip.end,
      text: text.trim(),
    }
  })
}

export function exportCuesToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue) => {
      return `${cue.index}\n${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(cue.end)}\n${cue.text}\n`
    })
    .join('\n')
}
