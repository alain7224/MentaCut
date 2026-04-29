export type MobileEditorPrefs = {
  compactPanels: boolean
  largeTouchTargets: boolean
  floatingTransport: boolean
  simplifiedSidebars: boolean
}

const KEY = 'mentacut.mobile.editor.prefs'

export function readMobileEditorPrefs(): MobileEditorPrefs {
  if (typeof window === 'undefined') {
    return { compactPanels: true, largeTouchTargets: true, floatingTransport: true, simplifiedSidebars: true }
  }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { compactPanels: true, largeTouchTargets: true, floatingTransport: true, simplifiedSidebars: true }
    return { compactPanels: true, largeTouchTargets: true, floatingTransport: true, simplifiedSidebars: true, ...(JSON.parse(raw) as Partial<MobileEditorPrefs>) }
  } catch {
    return { compactPanels: true, largeTouchTargets: true, floatingTransport: true, simplifiedSidebars: true }
  }
}

export function writeMobileEditorPrefs(prefs: MobileEditorPrefs) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(prefs))
}
