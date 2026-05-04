import type { ProjectAudioMix } from '@/lib/local-audio-mix'
import type { ProjectBeatMap } from '@/lib/local-beatmap'
import type { LocalProject } from '@/lib/local-store'
import type { TextLayerEntry } from '@/lib/local-text-layers'
import type { StickerLayerEntry } from '@/lib/local-sticker-layers'

export type ProjectScorecard = {
  clips: number
  duration: number
  textLayers: number
  stickers: number
  hasBeatMap: boolean
  hasAudioMix: boolean
}

export function buildProjectScorecard(input: {
  project: LocalProject
  textLayers: TextLayerEntry[]
  stickerLayers: StickerLayerEntry[]
  beatMap: ProjectBeatMap | null
  audioMix: ProjectAudioMix | null
}): ProjectScorecard {
  return {
    clips: input.project.clips.length,
    duration: Number(input.project.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0).toFixed(3)),
    textLayers: input.textLayers.filter((item) => item.projectId === input.project.id).length,
    stickers: input.stickerLayers.filter((item) => item.projectId === input.project.id).length,
    hasBeatMap: Boolean(input.beatMap),
    hasAudioMix: Boolean(input.audioMix),
  }
}
