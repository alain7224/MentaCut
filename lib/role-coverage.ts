import type { ClipRoleEntry } from '@/lib/local-clip-roles'
import type { LocalProject } from '@/lib/local-store'

export type RoleCoverageRow = {
  role: string
  clips: number
  duration: number
}

export function buildRoleCoverage(project: LocalProject, roles: ClipRoleEntry[]): RoleCoverageRow[] {
  const projectRoles = roles.filter((item) => item.projectId === project.id)
  const map = new Map<string, RoleCoverageRow>()

  for (const clip of project.clips) {
    const role = projectRoles.find((item) => item.clipId === clip.id)?.role ?? 'setup'
    const duration = Math.max(0, clip.end - clip.start)
    const current = map.get(role) ?? { role, clips: 0, duration: 0 }
    current.clips += 1
    current.duration += duration
    map.set(role, current)
  }

  return [...map.values()].sort((a, b) => b.duration - a.duration || b.clips - a.clips)
}
