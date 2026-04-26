import type { LocalClip, LocalProject, ProjectFormat } from '@/lib/local-store'

export type VariantStrategy = 'keep' | 'fit' | 'fill'

function getScaleMultiplier(strategy: VariantStrategy): number {
  if (strategy === 'fit') return 0.92
  if (strategy === 'fill') return 1.08
  return 1
}

function transformClipForVariant(clip: LocalClip, strategy: VariantStrategy): LocalClip {
  const multiplier = getScaleMultiplier(strategy)
  return {
    ...clip,
    id: crypto.randomUUID(),
    frameScale: Number((clip.frameScale * multiplier).toFixed(3)),
  }
}

export function createProjectVariant(
  source: LocalProject,
  targetFormat: ProjectFormat,
  strategy: VariantStrategy,
  suffix: string,
): LocalProject {
  const safeSuffix = suffix.trim() || targetFormat

  return {
    id: crypto.randomUUID(),
    name: `${source.name} ${safeSuffix}`.trim(),
    format: targetFormat,
    updatedAt: new Date().toISOString(),
    clips: source.clips.map((clip) => transformClipForVariant(clip, strategy)),
  }
}
