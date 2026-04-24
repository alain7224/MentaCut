'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DEFAULT_PREFERENCES, readLocalPreferences, resetLocalPreferences, writeLocalPreferences, type LocalPreferences } from '@/lib/local-preferences'

const STARTUP_ROUTES: LocalPreferences['startupRoute'][] = ['/studio/workspace', '/studio', '/studio/projects', '/studio/new']
const DENSITIES: LocalPreferences['uiDensity'][] = ['comfortable', 'compact']
const FORMATS: LocalPreferences['defaultProjectFormat'][] = ['9:16', '1:1', '4:5', '16:9']

export default function StudioSettingsPage() {
  const [preferences, setPreferences] = useState<LocalPreferences>(DEFAULT_PREFERENCES)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setPreferences(readLocalPreferences())
  }, [])

  function updatePreference<K extends keyof LocalPreferences>(key: K, value: LocalPreferences[K]) {
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    writeLocalPreferences(next)
    setStatus('Preferencias guardadas localmente')
  }

  function handleReset() {
    resetLocalPreferences()
    setPreferences(DEFAULT_PREFERENCES)
    setStatus('Preferencias restablecidas')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Ajustes</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Preferencias locales del estudio</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Configura cómo se comporta MentaCut.</h1>
            <p className="sub">
              Estos ajustes viven en tu navegador y preparan la base del producto para una experiencia más personal sin tocar todavía la parte cloud.
            </p>
            <div className="action-row">
              <Link href="/studio/workspace" className="btn btn-primary">Abrir workspace</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
              <button className="btn" onClick={handleReset}>Restablecer</button>
            </div>
            <div className="timeline-label">{status || 'Las preferencias se guardan en localStorage.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Comportamiento general</h2>
                <div className="timeline-label">Base de experiencia</div>
              </div>
              <div className="form">
                <label className="form">
                  <span className="timeline-label">Ruta inicial recomendada</span>
                  <select className="input" value={preferences.startupRoute} onChange={(event) => updatePreference('startupRoute', event.target.value as LocalPreferences['startupRoute'])}>
                    {STARTUP_ROUTES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="form">
                  <span className="timeline-label">Densidad de UI</span>
                  <select className="input" value={preferences.uiDensity} onChange={(event) => updatePreference('uiDensity', event.target.value as LocalPreferences['uiDensity'])}>
                    {DENSITIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="form">
                  <span className="timeline-label">Formato por defecto para proyectos nuevos</span>
                  <select className="input" value={preferences.defaultProjectFormat} onChange={(event) => updatePreference('defaultProjectFormat', event.target.value as LocalPreferences['defaultProjectFormat'])}>
                    {FORMATS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Controles de edición</h2>
                <div className="timeline-label">Preferencias base</div>
              </div>
              <div className="project-list">
                <button className={`project-item ${preferences.reducedMotion ? 'active' : ''}`} onClick={() => updatePreference('reducedMotion', !preferences.reducedMotion)}>
                  <strong>Reducir movimiento</strong>
                  <div className="timeline-label">{preferences.reducedMotion ? 'Activo' : 'Inactivo'}</div>
                </button>
                <button className={`project-item ${preferences.autoplayPreview ? 'active' : ''}`} onClick={() => updatePreference('autoplayPreview', !preferences.autoplayPreview)}>
                  <strong>Autoplay de preview</strong>
                  <div className="timeline-label">{preferences.autoplayPreview ? 'Activo' : 'Inactivo'}</div>
                </button>
                <button className={`project-item ${preferences.snapTimeline ? 'active' : ''}`} onClick={() => updatePreference('snapTimeline', !preferences.snapTimeline)}>
                  <strong>Snap de timeline</strong>
                  <div className="timeline-label">{preferences.snapTimeline ? 'Activo' : 'Inactivo'}</div>
                </button>
                <button className={`project-item ${preferences.showTips ? 'active' : ''}`} onClick={() => updatePreference('showTips', !preferences.showTips)}>
                  <strong>Mostrar tips del estudio</strong>
                  <div className="timeline-label">{preferences.showTips ? 'Activo' : 'Inactivo'}</div>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
