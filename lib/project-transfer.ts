import type { LocalProject } from '@/lib/local-store'

export type SingleProjectExport = {
  app: 'MentaCut'
  kind: 'single-project-export'
  exportedAt: string
  project: LocalProject
}

export function parseSingleProjectExport(raw: string): LocalProject {
  const parsed = JSON.parse(raw) as Partial<SingleProjectExport>

  if (!parsed || parsed.app !== 'MentaCut' || parsed.kind !== 'single-project-export' || !parsed.project) {
    throw new Error('Archivo de proyecto inválido')
  }

  const project = parsed.project as LocalProject

  if (!project.id || !project.name || !project.format || !Array.isArray(project.clips)) {
    throw new Error('Proyecto incompleto')
  }

  return project
}

export function normalizeImportedProject(project: LocalProject): LocalProject {
  return {
    ...project,
    id: crypto.randomUUID(),
    name: `${project.name} importado`,
    updatedAt: new Date().toISOString(),
    clips: project.clips.map((clip) => ({
      ...clip,
      id: crypto.randomUUID(),
    })),
  }
}
