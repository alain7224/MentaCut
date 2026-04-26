export type ClipRole = 'hook' | 'setup' | 'problem' | 'solution' | 'proof' | 'cta' | 'b-roll'

export type ClipRoleEntry = {
  id: string
  projectId: string
  clipId: string
  role: ClipRole
  note: string
}

const KEY = 'mentacut.local.clip.roles'

export function readClipRoles(): ClipRoleEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClipRoleEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeClipRoles(entries: ClipRoleEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(entries))
}

export function upsertClipRole(entries: ClipRoleEntry[], entry: ClipRoleEntry): ClipRoleEntry[] {
  const index = entries.findIndex((item) => item.projectId === entry.projectId && item.clipId === entry.clipId)
  if (index < 0) return [entry, ...entries]
  const next = [...entries]
  next[index] = entry
  return next
}

export function getClipRoleEntry(entries: ClipRoleEntry[], projectId: string, clipId: string): ClipRoleEntry | null {
  return entries.find((item) => item.projectId === projectId && item.clipId === clipId) ?? null
}

export function createDefaultClipRole(projectId: string, clipId: string): ClipRoleEntry {
  return {
    id: crypto.randomUUID(),
    projectId,
    clipId,
    role: 'setup',
    note: '',
  }
}

export function applyRolePreset(
  projectId: string,
  clipIds: string[],
  preset: 'hook-body-cta' | 'problem-solution-cta' | 'hook-proof-cta',
): ClipRoleEntry[] {
  const roles: ClipRole[] = []

  if (preset === 'hook-body-cta') {
    clipIds.forEach((_, index) => {
      if (index === 0) roles.push('hook')
      else if (index === clipIds.length - 1) roles.push('cta')
      else roles.push('setup')
    })
  }

  if (preset === 'problem-solution-cta') {
    clipIds.forEach((_, index) => {
      if (index === 0) roles.push('problem')
      else if (index === clipIds.length - 1) roles.push('cta')
      else roles.push(index % 2 === 0 ? 'proof' : 'solution')
    })
  }

  if (preset === 'hook-proof-cta') {
    clipIds.forEach((_, index) => {
      if (index === 0) roles.push('hook')
      else if (index === clipIds.length - 1) roles.push('cta')
      else roles.push('proof')
    })
  }

  return clipIds.map((clipId, index) => ({
    id: crypto.randomUUID(),
    projectId,
    clipId,
    role: roles[index] ?? 'setup',
    note: '',
  }))
}
