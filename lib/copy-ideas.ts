import type { ProjectBrief } from '@/lib/local-project-briefs'
import type { LocalProject } from '@/lib/local-store'

export type CopyIdeaPack = {
  hooks: string[]
  ctas: string[]
  captions: string[]
}

function compact(value: string) {
  return value.trim()
}

export function buildCopyIdeas(project: LocalProject, brief: ProjectBrief | null): CopyIdeaPack {
  const projectName = compact(project.name)
  const audience = compact(brief?.audience ?? '')
  const objective = compact(brief?.objective ?? '')
  const offer = compact(brief?.offer ?? '')
  const cta = compact(brief?.cta ?? '')
  const voice = compact(brief?.voice ?? '')

  const hooks = [
    audience && offer ? `Si eres ${audience}, mira esto: ${offer}.` : '',
    objective ? `Esto te ayuda a ${objective}.` : '',
    offer ? `La forma más rápida de entender esto: ${offer}.` : '',
    projectName ? `${projectName}: empieza por aquí.` : '',
  ].filter(Boolean)

  const ctas = [
    cta || '',
    objective ? `Guarda este video si quieres ${objective}.` : '',
    offer ? `Comenta si quieres más ejemplos sobre ${offer}.` : '',
    audience ? `Compártelo con alguien como ${audience}.` : '',
  ].filter(Boolean)

  const captions = [
    [hooks[0] ?? '', offer, ctas[0] ?? ''].filter(Boolean).join(' '),
    [objective ? `Objetivo: ${objective}.` : '', offer ? `Idea clave: ${offer}.` : '', ctas[1] ?? ''].filter(Boolean).join(' '),
    [voice ? `Tono: ${voice}.` : '', projectName ? `Proyecto: ${projectName}.` : '', ctas[2] ?? ''].filter(Boolean).join(' '),
  ].filter(Boolean)

  return { hooks, ctas, captions }
}
