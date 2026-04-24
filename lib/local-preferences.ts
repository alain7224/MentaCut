export type StartupRoute = '/studio/workspace' | '/studio' | '/studio/projects' | '/studio/new'
export type UiDensity = 'comfortable' | 'compact'
export type DefaultProjectFormat = '9:16' | '1:1' | '4:5' | '16:9'

export type LocalPreferences = {
  startupRoute: StartupRoute
  uiDensity: UiDensity
  defaultProjectFormat: DefaultProjectFormat
  reducedMotion: boolean
  autoplayPreview: boolean
  snapTimeline: boolean
  showTips: boolean
}

const KEY = 'mentacut.local.preferences'

export const DEFAULT_PREFERENCES: LocalPreferences = {
  startupRoute: '/studio/workspace',
  uiDensity: 'comfortable',
  defaultProjectFormat: '9:16',
  reducedMotion: false,
  autoplayPreview: false,
  snapTimeline: true,
  showTips: true,
}

export function readLocalPreferences(): LocalPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<LocalPreferences>
    return {
      startupRoute: parsed.startupRoute ?? DEFAULT_PREFERENCES.startupRoute,
      uiDensity: parsed.uiDensity ?? DEFAULT_PREFERENCES.uiDensity,
      defaultProjectFormat: parsed.defaultProjectFormat ?? DEFAULT_PREFERENCES.defaultProjectFormat,
      reducedMotion: parsed.reducedMotion ?? DEFAULT_PREFERENCES.reducedMotion,
      autoplayPreview: parsed.autoplayPreview ?? DEFAULT_PREFERENCES.autoplayPreview,
      snapTimeline: parsed.snapTimeline ?? DEFAULT_PREFERENCES.snapTimeline,
      showTips: parsed.showTips ?? DEFAULT_PREFERENCES.showTips,
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function writeLocalPreferences(preferences: LocalPreferences) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(preferences))
}

export function resetLocalPreferences() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(DEFAULT_PREFERENCES))
}
