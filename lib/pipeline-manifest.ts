import type { ProjectAudioMix } from '@/lib/local-audio-mix'
import type { ProjectBeatMap } from '@/lib/local-beatmap'
import type { LocalMediaRecord } from '@/lib/local-media'
import type { StickerLayerEntry } from '@/lib/local-sticker-layers'
import type { LocalProject } from '@/lib/local-store'
import type { TextLayerEntry } from '@/lib/local-text-layers'

export type PipelineManifest = {
  app: 'MentaCut'
  kind: 'pipeline-manifest'
  exportedAt: string
  project: LocalProject
  assets: LocalMediaRecord[]
  textLayers: TextLayerEntry[]
  stickerLayers: StickerLayerEntry[]
  audioMix: ProjectAudioMix | null
  beatMap: ProjectBeatMap | null
}

export function buildPipelineManifest(input: {
  project: LocalProject
  mediaLibrary: LocalMediaRecord[]
  textLayers: TextLayerEntry[]
  stickerLayers: StickerLayerEntry[]
  audioMix: ProjectAudioMix | null
  beatMap: ProjectBeatMap | null
}): PipelineManifest {
  const assetIds = new Set<string>()
  input.project.clips.forEach((clip) => {
    if (clip.mediaId) assetIds.add(clip.mediaId)
    if (clip.audioMediaId) assetIds.add(clip.audioMediaId)
  })
  if (input.audioMix?.soundtrackMediaId) assetIds.add(input.audioMix.soundtrackMediaId)

  return {
    app: 'MentaCut',
    kind: 'pipeline-manifest',
    exportedAt: new Date().toISOString(),
    project: input.project,
    assets: input.mediaLibrary.filter((item) => assetIds.has(item.id)),
    textLayers: input.textLayers.filter((item) => item.projectId === input.project.id),
    stickerLayers: input.stickerLayers.filter((item) => item.projectId === input.project.id),
    audioMix: input.audioMix,
    beatMap: input.beatMap,
  }
}
