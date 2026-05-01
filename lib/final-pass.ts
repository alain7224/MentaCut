import type { ProjectAudioMix } from '@/lib/local-audio-mix'
import type { ClipRoleEntry } from '@/lib/local-clip-roles'
import type { LocalMediaRecord } from '@/lib/local-media'
import type { LocalProject } from '@/lib/local-store'
import type { ClipTransitionPlan } from '@/lib/local-transitions'
import { auditProjectDependencies } from '@/lib/project-dependency-audit'
import { evaluateProjectPublishReadiness } from '@/lib/publish-readiness'

export type FinalPassResult = {
  passed: boolean
  blocking: string[]
  warnings: string[]
  readinessScore: number
  readinessState: 'draft' | 'nearly-ready' | 'ready'
}

export function evaluateFinalPass(input: {
  project: LocalProject
  mediaLibrary: LocalMediaRecord[]
  roles: ClipRoleEntry[]
  transitions: ClipTransitionPlan[]
  audioMix: ProjectAudioMix | null
}): FinalPassResult {
  const deps = auditProjectDependencies(input.project, input.mediaLibrary)
  const readiness = evaluateProjectPublishReadiness({
    project: input.project,
    roles: input.roles,
    transitions: input.transitions,
    audioMix: input.audioMix,
  })

  const blocking = deps
    .filter((item) => item.severity === 'high')
    .map((item) => `${item.clipTitle}: ${item.message}`)

  if (readiness.score < 55) {
    blocking.push('El proyecto todavía no supera el umbral mínimo del chequeo final.')
  }

  const warnings = [
    ...deps.filter((item) => item.severity !== 'high').map((item) => `${item.clipTitle}: ${item.message}`),
    ...readiness.recommendations,
  ]

  return {
    passed: blocking.length === 0,
    blocking,
    warnings,
    readinessScore: readiness.score,
    readinessState: readiness.state,
  }
}
