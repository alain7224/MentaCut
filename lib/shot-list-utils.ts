import type { ClipNoteEntry } from '@/lib/local-clip-notes'
import type { ClipRoleEntry } from '@/lib/local-clip-roles'
import type { LocalProject } from '@/lib/local-store'

export type ShotListRow = {
  clipId: string
  title: string
  start: number
  end: number
  duration: number
  role: string
  shotIdea: string
  note: string
  reshoot: boolean
}

export function buildShotList(project: LocalProject, roles: ClipRoleEntry[], notes: ClipNoteEntry[]): ShotListRow[] {
  return project.clips.map((clip) => {
    const role = roles.find((item) => item.projectId === project.id && item.clipId === clip.id)
    const note = notes.find((item) => item.projectId === project.id && item.clipId === clip.id)
    return {
      clipId: clip.id,
      title: clip.title,
      start: clip.start,
      end: clip.end,
      duration: Math.max(0.1, clip.end - clip.start),
      role: role?.role ?? 'setup',
      shotIdea: note?.shotIdea ?? '',
      note: note?.note ?? '',
      reshoot: note?.reshoot ?? false,
    }
  })
}

export function exportShotListTxt(rows: ShotListRow[], projectName: string): string {
  const lines = [`Shot list · ${projectName}`, '']
  rows.forEach((row, index) => {
    lines.push(`#${index + 1} ${row.title}`)
    lines.push(`Tiempo: ${row.start.toFixed(2)}s → ${row.end.toFixed(2)}s (${row.duration.toFixed(2)}s)`)
    lines.push(`Rol: ${row.role}`)
    if (row.shotIdea) lines.push(`Shot idea: ${row.shotIdea}`)
    if (row.note) lines.push(`Nota: ${row.note}`)
    lines.push(`Reshoot: ${row.reshoot ? 'Sí' : 'No'}`)
    lines.push('')
  })
  return lines.join('\n')
}
