export type TimelineMarkerColor = 'mint' | 'amber' | 'rose' | 'sky' | 'violet'

export type TimelineMarker = {
  id: string
  projectId: string
  time: number
  label: string
  note: string
  color: TimelineMarkerColor
}

const KEY = 'mentacut.local.timeline.markers'

export function readTimelineMarkers(): TimelineMarker[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TimelineMarker[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeTimelineMarkers(markers: TimelineMarker[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(markers))
}

export function createTimelineMarker(projectId: string, time = 0): TimelineMarker {
  return {
    id: crypto.randomUUID(),
    projectId,
    time: Number(Math.max(0, time).toFixed(3)),
    label: 'Marker',
    note: '',
    color: 'mint',
  }
}

export function upsertTimelineMarker(markers: TimelineMarker[], marker: TimelineMarker): TimelineMarker[] {
  const index = markers.findIndex((item) => item.id === marker.id)
  if (index < 0) return [marker, ...markers]
  const next = [...markers]
  next[index] = marker
  return next
}
