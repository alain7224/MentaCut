'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readMobileEditorPrefs, writeMobileEditorPrefs, type MobileEditorPrefs } from '@/lib/mobile-editor-prefs'

export default function StudioMobileEditorPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<MobileEditorPrefs>(readMobileEditorPrefs())
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setPrefs(readMobileEditorPrefs())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  function updatePrefs(patch: Partial<MobileEditorPrefs>, nextStatus: string) {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    writeMobileEditorPrefs(next)
    setStatus(nextStatus)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Mobile Editor</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/player" className="nav-link">Player</Link>
          <Link href="/studio/direct-framing" className="nav-link">Direct framing</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Modo editor móvil compacto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Optimiza el editor para iPhone y Android.</h1>
            <p className="sub">Esta zona guarda preferencias de paneles compactos, targets grandes y transporte flotante para una edición táctil más cómoda.</p>
            <div className="action-row">
              <Link href="/studio/player" className="btn btn-primary">Abrir player</Link>
              <Link href="/studio/direct-framing" className="btn">Abrir direct framing</Link>
            </div>
            <div className="timeline-label">{status || 'Activa las preferencias que quieras para el editor móvil.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Contexto</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <div className="cards">
                <article className="panel card"><h3>Proyecto</h3><p><strong>{activeProject?.name ?? '—'}</strong></p></article>
                <article className="panel card"><h3>Clips</h3><p><strong>{activeProject?.clips.length ?? 0}</strong></p></article>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preferencias</h2><div className="timeline-label">Touch friendly</div></div>
              <div className="project-list">
                <label className="project-item" style={{ cursor: 'pointer' }}><strong>Compact panels</strong><div className="timeline-label">{prefs.compactPanels ? 'Activo' : 'Inactivo'}</div><input type="checkbox" checked={prefs.compactPanels} onChange={(e) => updatePrefs({ compactPanels: e.target.checked }, 'Compact panels actualizados')} /></label>
                <label className="project-item" style={{ cursor: 'pointer' }}><strong>Large touch targets</strong><div className="timeline-label">{prefs.largeTouchTargets ? 'Activo' : 'Inactivo'}</div><input type="checkbox" checked={prefs.largeTouchTargets} onChange={(e) => updatePrefs({ largeTouchTargets: e.target.checked }, 'Touch targets actualizados')} /></label>
                <label className="project-item" style={{ cursor: 'pointer' }}><strong>Floating transport</strong><div className="timeline-label">{prefs.floatingTransport ? 'Activo' : 'Inactivo'}</div><input type="checkbox" checked={prefs.floatingTransport} onChange={(e) => updatePrefs({ floatingTransport: e.target.checked }, 'Floating transport actualizado')} /></label>
                <label className="project-item" style={{ cursor: 'pointer' }}><strong>Simplified sidebars</strong><div className="timeline-label">{prefs.simplifiedSidebars ? 'Activo' : 'Inactivo'}</div><input type="checkbox" checked={prefs.simplifiedSidebars} onChange={(e) => updatePrefs({ simplifiedSidebars: e.target.checked }, 'Sidebars actualizados')} /></label>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
