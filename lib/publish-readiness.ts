import type { ProjectAudioMix } from '@/lib/local-audio-mix'
import type { ClipRoleEntry } from '@/lib/local-clip-roles'
import type { LocalProject } from '@/lib/local-store'
import { buildSegmentedSubtitleCues } from '@/lib/subtitle-utils'
import { inspectTimeline } from '@/lib/timeline-repair'
import type { ClipTransitionPlan } from '@/lib/local-transitions'

export type PublishCheck = {
  key: string
  label: string
  passed: boolean
  weight: number
  detail: string
}

export type PublishReadinessReport = {
  score: number
  state: 'draft' | 'nearly-ready' | 'ready'
  checks: PublishCheck[]
  recommendations: string[]
}

function round(value: number) {
  return Math.round(value * 10) / 10
}

export function evaluateProjectPublishReadiness(input: {
  project: LocalProject
  roles: ClipRoleEntry[]
  transitions: ClipTransitionPlan[]
  audioMix: ProjectAudioMix | null
}): PublishReadinessReport {
  const { project, roles, transitions, audioMix } = input
  const duration = project.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0)
  const timelineIssues = inspectTimeline(project)
  const subtitles = buildSegmentedSubtitleCues(project, 'mixed', 42)
  const projectRoles = roles.filter((entry) => entry.projectId === project.id)
  const projectTransitions = transitions.filter((entry) => entry.projectId === project.id)
  const clipsWithMedia = project.clips.filter((clip) => clip.mediaId).length
  const clipsWithText = project.clips.filter((clip) => clip.headlineText.trim() || clip.captionText.trim()).length
  const hasHook = projectRoles.some((entry) => entry.role === 'hook')
  const hasCta = projectRoles.some((entry) => entry.role === 'cta')
  const hasNarrativeBody = projectRoles.some((entry) => ['setup', 'problem', 'solution', 'proof'].includes(entry.role))
  const transitionPairs = Math.max(0, project.clips.length - 1)
  const clipsWithAudio = project.clips.filter((clip) => clip.audioMediaId).length
  const hasAudioPlan = Boolean(audioMix && (audioMix.soundtrackMediaId || clipsWithAudio > 0 || audioMix.clipOverrides.length > 0))

  const checks: PublishCheck[] = [
    {
      key: 'clip-count',
      label: 'Estructura mínima',
      passed: project.clips.length >= 3,
      weight: 8,
      detail: `${project.clips.length} clip(s) en el proyecto.`,
    },
    {
      key: 'duration-window',
      label: 'Duración publicable',
      passed: duration >= 5 && duration <= 60,
      weight: 10,
      detail: `${round(duration)} s de duración total.`,
    },
    {
      key: 'media-coverage',
      label: 'Cobertura visual',
      passed: clipsWithMedia === project.clips.length,
      weight: 10,
      detail: `${clipsWithMedia}/${project.clips.length} clip(s) con media visual.`,
    },
    {
      key: 'text-coverage',
      label: 'Copy base del proyecto',
      passed: clipsWithText === project.clips.length,
      weight: 10,
      detail: `${clipsWithText}/${project.clips.length} clip(s) con headline o caption.`,
    },
    {
      key: 'roles-hook',
      label: 'Gancho definido',
      passed: hasHook,
      weight: 10,
      detail: hasHook ? 'Hay al menos un clip marcado como hook.' : 'Todavía no hay hook asignado.',
    },
    {
      key: 'roles-body',
      label: 'Cuerpo narrativo',
      passed: hasNarrativeBody,
      weight: 8,
      detail: hasNarrativeBody ? 'Hay clips con función narrativa de desarrollo.' : 'Falta cuerpo narrativo claro.',
    },
    {
      key: 'roles-cta',
      label: 'Cierre o CTA',
      passed: hasCta,
      weight: 10,
      detail: hasCta ? 'Hay al menos un clip marcado como CTA.' : 'Falta un cierre o CTA claro.',
    },
    {
      key: 'subtitles',
      label: 'Subtítulos base',
      passed: subtitles.length >= project.clips.length && subtitles.every((cue) => cue.text.trim().length > 0),
      weight: 10,
      detail: `${subtitles.length} cue(s) generables desde el contenido actual.`,
    },
    {
      key: 'transitions',
      label: 'Transiciones pensadas',
      passed: transitionPairs === 0 || projectTransitions.length >= transitionPairs,
      weight: 6,
      detail: `${projectTransitions.length}/${transitionPairs} transición(es) planificadas.`,
    },
    {
      key: 'audio-plan',
      label: 'Plan de audio',
      passed: hasAudioPlan,
      weight: 8,
      detail: hasAudioPlan ? 'Hay mezcla o audio planificado.' : 'Falta mezcla o decisión de audio.',
    },
    {
      key: 'timeline',
      label: 'Timeline sana',
      passed: timelineIssues.length === 0,
      weight: 10,
      detail: timelineIssues.length === 0 ? 'No se detectan huecos ni solapes.' : `${timelineIssues.length} incidencia(s) temporal(es) detectadas.`,
    },
  ]

  const score = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0)
  const state: PublishReadinessReport['state'] = score >= 80 ? 'ready' : score >= 55 ? 'nearly-ready' : 'draft'

  const recommendations = checks
    .filter((check) => !check.passed)
    .map((check) => {
      if (check.key === 'media-coverage') return 'Completa la media visual de todos los clips antes de publicar.'
      if (check.key === 'text-coverage') return 'Rellena headlines o captions en todos los clips.'
      if (check.key === 'roles-hook') return 'Marca un clip como hook para abrir más fuerte.'
      if (check.key === 'roles-body') return 'Añade clips de desarrollo, prueba o solución para dar cuerpo.'
      if (check.key === 'roles-cta') return 'Define un CTA claro para cerrar mejor el vídeo.'
      if (check.key === 'subtitles') return 'Genera subtítulos o completa el texto para tener cues exportables.'
      if (check.key === 'transitions') return 'Planifica las transiciones entre clips para pulir la salida.'
      if (check.key === 'audio-plan') return 'Decide mezcla, música o audio principal antes del render.'
      if (check.key === 'timeline') return 'Repara la timeline para eliminar huecos, solapes o tiempos raros.'
      if (check.key === 'duration-window') return 'Ajusta la duración total a una ventana más publicable.'
      return `Revisa: ${check.label}.`
    })

  return {
    score,
    state,
    checks,
    recommendations,
  }
}
