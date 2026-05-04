import type { ProjectAudioMix } from '@/lib/local-audio-mix'
import type { ProjectBeatMap } from '@/lib/local-beatmap'
import type { ClipRoleEntry } from '@/lib/local-clip-roles'
import type { LocalMediaRecord } from '@/lib/local-media'
import type { StickerLayerEntry } from '@/lib/local-sticker-layers'
import type { LocalProject } from '@/lib/local-store'
import type { TextLayerEntry } from '@/lib/local-text-layers'
import type { ClipTransitionPlan } from '@/lib/local-transitions'
import { evaluateFinalPass } from '@/lib/final-pass'
import { buildPipelineManifest } from '@/lib/pipeline-manifest'
import { buildRenderRecipe } from '@/lib/render-recipe'

export type DeliveryPack = {
  app: 'MentaCut'
  kind: 'delivery-pack'
  exportedAt: string
  projectId: string
  projectName: string
  finalPass: ReturnType<typeof evaluateFinalPass>
  recipe: ReturnType<typeof buildRenderRecipe>
  manifest: ReturnType<typeof buildPipelineManifest>
}

export function buildDeliveryPack(input: {
  project: LocalProject
  mediaLibrary: LocalMediaRecord[]
  textLayers: TextLayerEntry[]
  stickerLayers: StickerLayerEntry[]
  audioMix: ProjectAudioMix | null
  beatMap: ProjectBeatMap | null
  roles: ClipRoleEntry[]
  transitions: ClipTransitionPlan[]
}): DeliveryPack {
  const finalPass = evaluateFinalPass({
    project: input.project,
    mediaLibrary: input.mediaLibrary,
    roles: input.roles,
    transitions: input.transitions,
    audioMix: input.audioMix,
  })

  const recipe = buildRenderRecipe(input.project, {
    textLayers: input.textLayers,
    stickerLayers: input.stickerLayers,
    audioMix: input.audioMix,
  })

  const manifest = buildPipelineManifest({
    project: input.project,
    mediaLibrary: input.mediaLibrary,
    textLayers: input.textLayers,
    stickerLayers: input.stickerLayers,
    audioMix: input.audioMix,
    beatMap: input.beatMap,
  })

  return {
    app: 'MentaCut',
    kind: 'delivery-pack',
    exportedAt: new Date().toISOString(),
    projectId: input.project.id,
    projectName: input.project.name,
    finalPass,
    recipe,
    manifest,
  }
}
