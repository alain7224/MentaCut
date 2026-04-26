export type ProjectAudioMix = {
  id: string
  projectId: string
  soundtrackMediaId: string | null
  soundtrackVolume: number
  originalAudioVolume: number
  duckingEnabled: boolean
  duckingAmount: number
  fadeInSeconds: number
  fadeOutSeconds: number
  clipOverrides: Array<{
    clipId: string
    volume: number
    mute: boolean
  }>
}

const KEY = 'mentacut.local.audio.mix'

export function readProjectAudioMixes(): ProjectAudioMix[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectAudioMix[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectAudioMixes(mixes: ProjectAudioMix[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(mixes))
}

export function createDefaultProjectAudioMix(projectId: string): ProjectAudioMix {
  return {
    id: crypto.randomUUID(),
    projectId,
    soundtrackMediaId: null,
    soundtrackVolume: 70,
    originalAudioVolume: 100,
    duckingEnabled: true,
    duckingAmount: 35,
    fadeInSeconds: 0.5,
    fadeOutSeconds: 0.5,
    clipOverrides: [],
  }
}

export function upsertProjectAudioMix(mixes: ProjectAudioMix[], mix: ProjectAudioMix): ProjectAudioMix[] {
  const index = mixes.findIndex((item) => item.projectId === mix.projectId)
  if (index < 0) return [mix, ...mixes]
  const next = [...mixes]
  next[index] = mix
  return next
}

export function setClipAudioOverride(
  mix: ProjectAudioMix,
  clipId: string,
  patch: Partial<ProjectAudioMix['clipOverrides'][number]>,
): ProjectAudioMix {
  const current = mix.clipOverrides.find((item) => item.clipId === clipId) ?? {
    clipId,
    volume: 100,
    mute: false,
  }

  const nextOverride = { ...current, ...patch }
  const existingIndex = mix.clipOverrides.findIndex((item) => item.clipId === clipId)
  const nextOverrides = [...mix.clipOverrides]

  if (existingIndex < 0) nextOverrides.push(nextOverride)
  else nextOverrides[existingIndex] = nextOverride

  return {
    ...mix,
    clipOverrides: nextOverrides,
  }
}

export function getClipAudioOverride(mix: ProjectAudioMix, clipId: string) {
  return mix.clipOverrides.find((item) => item.clipId === clipId) ?? null
}
