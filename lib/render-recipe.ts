import type { TextLayerEntry } from '@/lib/local-text-layers'
import type { StickerLayerEntry } from '@/lib/local-sticker-layers'
import type { ProjectAudioMix } from '@/lib/local-audio-mix'
import type { LocalProject } from '@/lib/local-store'

export type RenderRecipe = {
  projectId: string
  projectName: string
  clips: number
  duration: number
  ffmpegCommand: string
  notes: string[]
}

export function buildRenderRecipe(project: LocalProject, input: {
  textLayers: TextLayerEntry[]
  stickerLayers: StickerLayerEntry[]
  audioMix: ProjectAudioMix | null
}): RenderRecipe {
  const duration = project.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0)
  const textCount = input.textLayers.filter((item) => item.projectId === project.id).length
  const stickerCount = input.stickerLayers.filter((item) => item.projectId === project.id).length
  const hasAudio = Boolean(input.audioMix)

  const command = [
    'ffmpeg',
    '-i input_timeline_manifest.json',
    hasAudio ? '-i soundtrack_or_mixed_audio.wav' : '',
    '-filter_complex',
    '"concat/video-compose/subtitles/overlays"',
    '-c:v libx264',
    '-pix_fmt yuv420p',
    '-c:a aac',
    '-movflags +faststart',
    'output.mp4',
  ].filter(Boolean).join(' ')

  return {
    projectId: project.id,
    projectName: project.name,
    clips: project.clips.length,
    duration: Number(duration.toFixed(3)),
    ffmpegCommand: command,
    notes: [
      `Capas de texto: ${textCount}`,
      `Stickers: ${stickerCount}`,
      `Audio mix: ${hasAudio ? 'sí' : 'no'}`,
      'Receta pensada para worker de render futuro con FFmpeg.',
    ],
  }
}
