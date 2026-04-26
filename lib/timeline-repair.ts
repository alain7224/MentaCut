import type { LocalClip, LocalProject } from '@/lib/local-store'

export type TimelineIssue = {
  type: 'gap' | 'overlap' | 'negative-start' | 'invalid-duration'
  clipId: string
  clipTitle: string
  amount: number
  message: string
}

function cloneClip(clip: LocalClip): LocalClip {
  return { ...clip }
}

export function inspectTimeline(project: LocalProject): TimelineIssue[] {
  const issues: TimelineIssue[] = []
  const clips = project.clips

  for (let i = 0; i < clips.length; i += 1) {
    const clip = clips[i]
    const duration = clip.end - clip.start

    if (clip.start < 0) {
      issues.push({
        type: 'negative-start',
        clipId: clip.id,
        clipTitle: clip.title,
        amount: Math.abs(clip.start),
        message: 'El clip empieza antes de 0.',
      })
    }

    if (duration <= 0) {
      issues.push({
        type: 'invalid-duration',
        clipId: clip.id,
        clipTitle: clip.title,
        amount: Math.abs(duration),
        message: 'El clip tiene duración inválida.',
      })
    }

    const next = clips[i + 1]
    if (!next) continue

    const delta = Number((next.start - clip.end).toFixed(3))
    if (delta > 0) {
      issues.push({
        type: 'gap',
        clipId: next.id,
        clipTitle: next.title,
        amount: delta,
        message: 'Hay hueco antes de este clip.',
      })
    }
    if (delta < 0) {
      issues.push({
        type: 'overlap',
        clipId: next.id,
        clipTitle: next.title,
        amount: Math.abs(delta),
        message: 'Este clip se solapa con el anterior.',
      })
    }
  }

  return issues
}

export function normalizeTimelineFromZero(project: LocalProject): LocalProject {
  const clips = project.clips.map(cloneClip)
  let cursor = 0

  for (const clip of clips) {
    const duration = Math.max(0.1, clip.end - clip.start)
    clip.start = Number(cursor.toFixed(3))
    clip.end = Number((clip.start + duration).toFixed(3))
    cursor = clip.end
  }

  return { ...project, clips }
}

export function closeTimelineGaps(project: LocalProject): LocalProject {
  const clips = project.clips.map(cloneClip)
  if (clips.length === 0) return { ...project, clips }

  clips[0].start = Math.max(0, Number(clips[0].start.toFixed(3)))
  clips[0].end = Math.max(clips[0].start + 0.1, Number(clips[0].end.toFixed(3)))

  for (let i = 1; i < clips.length; i += 1) {
    const previous = clips[i - 1]
    const current = clips[i]
    const duration = Math.max(0.1, current.end - current.start)
    current.start = Number(previous.end.toFixed(3))
    current.end = Number((current.start + duration).toFixed(3))
  }

  return { ...project, clips }
}

export function removeTimelineOverlaps(project: LocalProject): LocalProject {
  const clips = project.clips.map(cloneClip)
  if (clips.length === 0) return { ...project, clips }

  clips[0].start = Math.max(0, Number(clips[0].start.toFixed(3)))
  clips[0].end = Math.max(clips[0].start + 0.1, Number(clips[0].end.toFixed(3)))

  for (let i = 1; i < clips.length; i += 1) {
    const previous = clips[i - 1]
    const current = clips[i]
    const duration = Math.max(0.1, current.end - current.start)
    if (current.start < previous.end) {
      current.start = Number(previous.end.toFixed(3))
      current.end = Number((current.start + duration).toFixed(3))
    }
    if (current.start < 0) {
      current.start = 0
      current.end = Number((duration).toFixed(3))
    }
  }

  return { ...project, clips }
}

export function distributeTimelineGap(project: LocalProject, gapSeconds: number): LocalProject {
  const clips = project.clips.map(cloneClip)
  if (clips.length === 0) return { ...project, clips }

  let cursor = Math.max(0, clips[0].start)
  const safeGap = Math.max(0, gapSeconds)

  for (let i = 0; i < clips.length; i += 1) {
    const clip = clips[i]
    const duration = Math.max(0.1, clip.end - clip.start)
    clip.start = Number(cursor.toFixed(3))
    clip.end = Number((clip.start + duration).toFixed(3))
    cursor = clip.end + safeGap
  }

  return { ...project, clips }
}
