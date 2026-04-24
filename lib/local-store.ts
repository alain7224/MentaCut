export type ProjectFormat = '9:16' | '1:1' | '4:5' | '16:9'

export type LocalClip = {
  id: string
  title: string
  start: number
  end: number
  mediaId: string | null
  audioMediaId: string | null
  templateId: string | null
  frameX: number
  frameY: number
  frameScale: number
  headlineText: string
  captionText: string
  stickerId: string | null
  graphicOverlayId: string | null
}

export type LocalProject = {
  id: string
  name: string
  format: ProjectFormat
  updatedAt: string
  clips: LocalClip[]
}

const KEY = 'mentacut.local.projects'

export function readLocalProjects(): LocalProject[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalProject[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeLocalProjects(projects: LocalProject[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(projects))
}

function createBaseClip(title: string, start: number, end: number): LocalClip {
  return {
    id: crypto.randomUUID(),
    title,
    start,
    end,
    mediaId: null,
    audioMediaId: null,
    templateId: 'hook-crystal',
    frameX: 50,
    frameY: 50,
    frameScale: 1,
    headlineText: 'Gancho fuerte',
    captionText: 'Texto editable del clip',
    stickerId: null,
    graphicOverlayId: null,
  }
}

export function createProject(name: string, format: ProjectFormat): LocalProject {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    format,
    updatedAt: now,
    clips: [createBaseClip('Clip 1', 0, 5), createBaseClip('Clip 2', 5, 11)],
  }
}

export function touchProject(project: LocalProject): LocalProject {
  return { ...project, updatedAt: new Date().toISOString() }
}
