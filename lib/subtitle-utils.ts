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

function splitLongTextChunk(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chunks: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars || !current) {
      current = candidate
      continue
    }
    chunks.push(current)
    current = word
  }

  if (current) chunks.push(current)
  return chunks
}

export function splitTextForSubtitleCues(text: string, maxChars = 42): string[] {
  const normalized = text.replace(/\r/g, '').trim()
  if (!normalized) return []

  const sentenceParts = normalized
    .split(/\n+|(?<=[.!?;:])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const chunks: string[] = []

  for (const part of sentenceParts) {
    if (part.length <= maxChars) {
      chunks.push(part)
      continue
    }
    chunks.push(...splitLongTextChunk(part, maxChars))
  }

  return chunks.length ? chunks : [normalized]
}

export function buildSegmentedSubtitleCues(project: LocalProject, mode: SubtitleMode, maxChars = 42): SubtitleCue[] {
  const base = buildSubtitleCues(project, mode)
  const segmented: SubtitleCue[] = []
  let counter = 1

  for (const cue of base) {
    const parts = splitTextForSubtitleCues(cue.text, maxChars)
    if (parts.length === 0) continue

    const totalDuration = Math.max(0.5, cue.end - cue.start)
    const partDuration = totalDuration / parts.length

    parts.forEach((part, index) => {
      const start = Number((cue.start + (partDuration * index)).toFixed(3))
      const end = Number((cue.start + (partDuration * (index + 1))).toFixed(3))

      segmented.push({
        id: crypto.randomUUID(),
        index: counter,
        clipId: cue.clipId,
        clipTitle: cue.clipTitle,
        start,
        end,
        text: part,
      })
      counter += 1
    })
  }

  return segmented
}

export function exportCuesToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue) => {
      return `${cue.index}\n${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(cue.end)}\n${cue.text}\n`
    })
    .join('\n')
}
