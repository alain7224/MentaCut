import type { LocalProject } from '@/lib/local-store'

export type FunctionalTemplateId = 'hook-crystal' | 'problem-solution' | 'proof-cta'

export function applyFunctionalTemplate(project: LocalProject, templateId: FunctionalTemplateId): LocalProject {
  return {
    ...project,
    clips: project.clips.map((clip, index, clips) => {
      const first = index === 0
      const last = index === clips.length - 1

      if (templateId === 'hook-crystal') {
        return {
          ...clip,
          templateId,
          headlineText: first ? 'PARA YA Y MIRA ESTO' : clip.headlineText || 'Texto del clip',
          captionText: last ? 'Guárdalo y compártelo' : clip.captionText || 'Desarrollo del mensaje',
          frameScale: first ? 1.15 : clip.frameScale,
        }
      }

      if (templateId === 'problem-solution') {
        return {
          ...clip,
          templateId,
          headlineText: first ? 'EL PROBLEMA' : last ? 'LA SOLUCIÓN' : clip.headlineText || 'Paso intermedio',
          captionText: last ? 'Haz esto ahora' : clip.captionText || 'Explicación breve',
        }
      }

      return {
        ...clip,
        templateId,
        headlineText: first ? 'MIRA LA PRUEBA' : clip.headlineText || 'Prueba o ejemplo',
        captionText: last ? 'Sígueme para más' : clip.captionText || 'Demostración',
      }
    }),
  }
}
