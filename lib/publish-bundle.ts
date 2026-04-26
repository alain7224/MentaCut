import type { ProjectAudioMix } from '@/lib/local-audio-mix'
import type { ClipRoleEntry } from '@/lib/local-clip-roles'
import type { LocalProject } from '@/lib/local-store'
import type { ProjectSubtitleStyle } from '@/lib/local-subtitle-style'
import type { ClipTransitionPlan } from '@/lib/local-transitions'
import { evaluateProjectPublishReadiness } from '@/lib/publish-readiness'
import { buildSegmentedSubtitleCues } from '@/lib/subtitle-utils'

export type PublishBundle = {
  app: 'MentaCut'
  kind: 'publish-bundle'
  exportedAt: string
  project: LocalProject
  readiness: ReturnType<typeof evaluateProjectPublishReadiness>
  subtitleStyle: ProjectSubtitleStyle | null
  audioMix: ProjectAudioMix | null
  transitions: ClipTransitionPlan[]
  roles: ClipRoleEntry[]
  script: {
    clipId: string
    clipTitle: string
    start: number
    end: number
    text: string
  }[]
  subtitles: ReturnType<typeof buildSegmentedSubtitleCues>
  stats: {
    clips: number
    duration: number
    subtitleCues: number
    transitions: number
    roles: number
  }
}

export function buildPublishBundle(input: {
  project: LocalProject
  roles: ClipRoleEntry[]
  transitions: ClipTransitionPlan[]
  audioMix: ProjectAudioMix | null
  subtitleStyle: ProjectSubtitleStyle | null
}): PublishBundle {
  const { project, roles, transitions, audioMix, subtitleStyle } = input
  const projectRoles = roles.filter((item) => item.projectId === project.id)
  const projectTransitions = transitions.filter((item) => item.projectId === project.id)
  const subtitles = buildSegmentedSubtitleCues(project, 'mixed', 42)
  const script = project.clips.map((clip, index) => ({
    clipId: clip.id,
    clipTitle: clip.title,
    start: clip.start,
    end: clip.end,
    text: [clip.headlineText || `Clip ${index + 1}`, clip.captionText].filter(Boolean).join('. ').trim(),
  }))
  const readiness = evaluateProjectPublishReadiness({
    project,
    roles: projectRoles,
    transitions: projectTransitions,
    audioMix,
  })
  const duration = project.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0)

  return {
    app: 'MentaCut',
    kind: 'publish-bundle',
    exportedAt: new Date().toISOString(),
    project,
    readiness,
    subtitleStyle,
    audioMix,
    transitions: projectTransitions,
    roles: projectRoles,
    script,
    subtitles,
    stats: {
      clips: project.clips.length,
      duration,
      subtitleCues: subtitles.length,
      transitions: projectTransitions.length,
      roles: projectRoles.length,
    },
  }
}
