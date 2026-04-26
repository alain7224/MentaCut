export type SubtitlePosition = 'top' | 'center' | 'bottom'
export type SubtitleAlign = 'left' | 'center' | 'right'

export type ProjectSubtitleStyle = {
  id: string
  projectId: string
  position: SubtitlePosition
  align: SubtitleAlign
  fontSize: number
  maxLines: number
  uppercase: boolean
  backgroundEnabled: boolean
  shadowEnabled: boolean
  textColor: string
  backgroundColor: string
  safeMargin: number
}

const KEY = 'mentacut.local.subtitle.styles'

export function readProjectSubtitleStyles(): ProjectSubtitleStyle[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectSubtitleStyle[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectSubtitleStyles(styles: ProjectSubtitleStyle[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(styles))
}

export function createDefaultProjectSubtitleStyle(projectId: string): ProjectSubtitleStyle {
  return {
    id: crypto.randomUUID(),
    projectId,
    position: 'bottom',
    align: 'center',
    fontSize: 42,
    maxLines: 2,
    uppercase: false,
    backgroundEnabled: true,
    shadowEnabled: true,
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.65)',
    safeMargin: 8,
  }
}

export function upsertProjectSubtitleStyle(styles: ProjectSubtitleStyle[], style: ProjectSubtitleStyle): ProjectSubtitleStyle[] {
  const index = styles.findIndex((item) => item.projectId === style.projectId)
  if (index < 0) return [style, ...styles]
  const next = [...styles]
  next[index] = style
  return next
}
