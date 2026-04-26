import type { LocalMediaRecord } from '@/lib/local-media'
import type { LocalClip, LocalProject } from '@/lib/local-store'

export type InsertMode = 'append' | 'prepend'

function sanitizeTitle(name: string) {
  return name.replace(/\.[^.]+$/, '').trim() || 'Clip'
}

function createClipFromMedia(item: LocalMediaRecord, fallbackDuration: number, index: number): LocalClip {
  const duration = item.kind === 'video' && item.duration && item.duration > 0 ? item.duration : Math.max(0.5, fallbackDuration)
  return {
    id: crypto.randomUUID(),
    title: sanitizeTitle(item.name),
    start: 0,
    end: Number(duration.toFixed(3)),
    mediaId: item.id,
    audioMediaId: null,
    templateId: 'hook-crystal',
    frameX: 50,
    frameY: 50,
    frameScale: 1,
    headlineText: sanitizeTitle(item.name),
    captionText: `Clip ${index + 1} insertado desde media local`,
    stickerId: null,
    graphicOverlayId: null,
  }
}

function rebaseClips(clips: LocalClip[], startAt = 0): LocalClip[] {
  let cursor = Math.max(0, startAt)
  return clips.map((clip) => {
    const duration = Math.max(0.1, clip.end - clip.start)
    const next = {
      ...clip,
      start: Number(cursor.toFixed(3)),
      end: Number((cursor + duration).toFixed(3)),
    }
    cursor = next.end
    return next
  })
}

export function insertMediaIntoProject(project: LocalProject, mediaItems: LocalMediaRecord[], mode: InsertMode, fallbackDuration: number): LocalProject {
  const incoming = rebaseClips(mediaItems.map((item, index) => createClipFromMedia(item, fallbackDuration, index)), 0)

  if (mode === 'prepend') {
    const shift = incoming.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0)
    const shiftedExisting = project.clips.map((clip) => ({
      ...clip,
      start: Number((clip.start + shift).toFixed(3)),
      end: Number((clip.end + shift).toFixed(3)),
    }))
    return {
      ...project,
      clips: [...incoming, ...shiftedExisting],
    }
  }

  const startAt = project.clips.length ? project.clips[project.clips.length - 1].end : 0
  return {
    ...project,
    clips: [...project.clips, ...rebaseClips(incoming, startAt)],
  }
}
