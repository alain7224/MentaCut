export type ProjectBeatMap = {
  id: string
  projectId: string
  audioMediaId: string | null
  bpm: number
  offsetSeconds: number
  markers: number[]
  source: 'manual' | 'generated'
}

const KEY = 'mentacut.local.beatmaps'

export function readProjectBeatMaps(): ProjectBeatMap[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectBeatMap[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectBeatMaps(beatMaps: ProjectBeatMap[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(beatMaps))
}

export function createDefaultBeatMap(projectId: string): ProjectBeatMap {
  return {
    id: crypto.randomUUID(),
    projectId,
    audioMediaId: null,
    bpm: 120,
    offsetSeconds: 0,
    markers: [],
    source: 'generated',
  }
}

export function upsertProjectBeatMap(beatMaps: ProjectBeatMap[], beatMap: ProjectBeatMap): ProjectBeatMap[] {
  const index = beatMaps.findIndex((item) => item.projectId === beatMap.projectId)
  if (index < 0) return [beatMap, ...beatMaps]
  const next = [...beatMaps]
  next[index] = beatMap
  return next
}

export function generateBeatMarkers(totalDuration: number, bpm: number, offsetSeconds: number): number[] {
  const safeDuration = Math.max(0, totalDuration)
  const safeBpm = Math.max(40, bpm)
  const interval = 60 / safeBpm
  const markers: number[] = []

  let cursor = Math.max(0, offsetSeconds)
  while (cursor <= safeDuration + 0.0001) {
    markers.push(Number(cursor.toFixed(3)))
    cursor += interval
  }

  return markers
}

export function parseManualMarkers(raw: string): number[] {
  const numbers = raw
    .split(/[,\n\s]+/)
    .map((item) => Number(item.trim()))
    .filter((value) => Number.isFinite(value) && value >= 0)

  return Array.from(new Set(numbers.map((value) => Number(value.toFixed(3))))).sort((a, b) => a - b)
}
