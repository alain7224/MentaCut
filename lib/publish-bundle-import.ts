import type { ProjectAudioMix } from '@/lib/local-audio-mix'
import type { ClipRoleEntry } from '@/lib/local-clip-roles'
import type { LocalProject } from '@/lib/local-store'
import type { ProjectSubtitleStyle } from '@/lib/local-subtitle-style'
import type { ClipTransitionPlan } from '@/lib/local-transitions'
import type { PublishBundle } from '@/lib/publish-bundle'

export type ParsedPublishBundle = {
  project: LocalProject
  audioMix: ProjectAudioMix | null
  subtitleStyle: ProjectSubtitleStyle | null
  roles: ClipRoleEntry[]
  transitions: ClipTransitionPlan[]
}

export function parsePublishBundle(raw: string): ParsedPublishBundle {
  const parsed = JSON.parse(raw) as Partial<PublishBundle>
  if (!parsed || parsed.app !== 'MentaCut' || parsed.kind !== 'publish-bundle' || !parsed.project) {
    throw new Error('Bundle de publicación inválido')
  }

  return {
    project: parsed.project as LocalProject,
    audioMix: (parsed.audioMix as ProjectAudioMix | null) ?? null,
    subtitleStyle: (parsed.subtitleStyle as ProjectSubtitleStyle | null) ?? null,
    roles: Array.isArray(parsed.roles) ? parsed.roles as ClipRoleEntry[] : [],
    transitions: Array.isArray(parsed.transitions) ? parsed.transitions as ClipTransitionPlan[] : [],
  }
}

export function normalizeImportedPublishBundle(bundle: ParsedPublishBundle): ParsedPublishBundle {
  const newProjectId = crypto.randomUUID()
  const normalizedProject: LocalProject = {
    ...bundle.project,
    id: newProjectId,
    name: `${bundle.project.name} importado`,
    updatedAt: new Date().toISOString(),
    clips: bundle.project.clips.map((clip) => ({
      ...clip,
      id: crypto.randomUUID(),
    })),
  }

  const clipIdMap = new Map<string, string>()
  bundle.project.clips.forEach((clip, index) => {
    clipIdMap.set(clip.id, normalizedProject.clips[index].id)
  })

  const normalizedRoles = bundle.roles.map((entry) => ({
    ...entry,
    id: crypto.randomUUID(),
    projectId: newProjectId,
    clipId: clipIdMap.get(entry.clipId) ?? entry.clipId,
  }))

  const normalizedTransitions = bundle.transitions.map((entry) => ({
    ...entry,
    id: crypto.randomUUID(),
    projectId: newProjectId,
    fromClipId: clipIdMap.get(entry.fromClipId) ?? entry.fromClipId,
    toClipId: clipIdMap.get(entry.toClipId) ?? entry.toClipId,
  }))

  const normalizedAudioMix = bundle.audioMix ? {
    ...bundle.audioMix,
    id: crypto.randomUUID(),
    projectId: newProjectId,
    clipOverrides: bundle.audioMix.clipOverrides.map((override) => ({
      ...override,
      clipId: clipIdMap.get(override.clipId) ?? override.clipId,
    })),
  } : null

  const normalizedSubtitleStyle = bundle.subtitleStyle ? {
    ...bundle.subtitleStyle,
    id: crypto.randomUUID(),
    projectId: newProjectId,
  } : null

  return {
    project: normalizedProject,
    audioMix: normalizedAudioMix,
    subtitleStyle: normalizedSubtitleStyle,
    roles: normalizedRoles,
    transitions: normalizedTransitions,
  }
}
