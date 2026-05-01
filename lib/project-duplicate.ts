import type { LocalProject } from '@/lib/local-store'

export function duplicateProject(project: LocalProject, suffix: string): LocalProject {
  const label = suffix.trim() || 'copia'
  return {
    ...JSON.parse(JSON.stringify(project)) as LocalProject,
    id: crypto.randomUUID(),
    name: `${project.name} ${label}`.trim(),
    updatedAt: new Date().toISOString(),
    clips: project.clips.map((clip) => ({
      ...JSON.parse(JSON.stringify(clip)),
      id: crypto.randomUUID(),
    })),
  }
}
