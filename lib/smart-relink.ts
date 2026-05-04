import type { LocalMediaRecord } from '@/lib/local-media'
import type { LocalProject } from '@/lib/local-store'

export type SmartRelinkSuggestion = {
  clipId: string
  clipTitle: string
  field: 'mediaId' | 'audioMediaId'
  missingId: string
  suggestionId: string | null
  suggestionName: string | null
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function buildSmartRelinkSuggestions(project: LocalProject, library: LocalMediaRecord[]): SmartRelinkSuggestion[] {
  const byId = new Set(library.map((item) => item.id))
  return project.clips.flatMap((clip) => {
    const rows: SmartRelinkSuggestion[] = []
    const checks: Array<{field:'mediaId'|'audioMediaId', id:string|null}> = [
      { field: 'mediaId', id: clip.mediaId },
      { field: 'audioMediaId', id: clip.audioMediaId },
    ]
    for (const check of checks) {
      if (!check.id || byId.has(check.id)) continue
      const normalizedTitle = normalize(clip.title)
      const suggestion = library.find((item) => normalize(item.name).includes(normalizedTitle) || normalizedTitle.includes(normalize(item.name.replace(/\.[^.]+$/, '')))) ?? null
      rows.push({
        clipId: clip.id,
        clipTitle: clip.title,
        field: check.field,
        missingId: check.id,
        suggestionId: suggestion?.id ?? null,
        suggestionName: suggestion?.name ?? null,
      })
    }
    return rows
  })
}
