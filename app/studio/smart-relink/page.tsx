'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import { buildSmartRelinkSuggestions } from '@/lib/smart-relink'

export default function StudioSmartRelinkPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    void listLocalMedia().then(setLibrary).catch(() => setLibrary([]))
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const suggestions = useMemo(() => activeProject ? buildSmartRelinkSuggestions(activeProject, library) : [], [activeProject, library])

  function applySuggestion(clipId: string, field: 'mediaId' | 'audioMediaId', suggestionId: string) {
    if (!activeProject) return
    const updated = projects.map((project) => project.id === activeProject.id ? touchProject({
      ...project,
      clips: project.clips.map((clip) => clip.id === clipId ? { ...clip, [field]: suggestionId } : clip),
    }) : project)
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus('Relink sugerido aplicado')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Smart Relink</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/relink" className="nav-link">Relink</Link>
          <Link href="/studio/dependencies" className="nav-link">Dependencies</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Smart relink</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Sugiere reconexiones por nombre.</h1>
            <p className="sub">Esta zona intenta proponer un archivo local cuando un clip tiene una referencia rota y existe una media con nombre parecido.</p>
            <div className="action-row">
              <Link href="/studio/relink" className="btn btn-primary">Abrir relink</Link>
              <Link href="/studio/dependencies" className="btn">Abrir dependencies</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto para ver sugerencias automáticas.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Sugerencias</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Coincidencias</h2><div className="timeline-label">{suggestions.length} sugerencia(s)</div></div>
            <div className="project-list">
              {suggestions.length === 0 ? <div className="empty">No hay sugerencias automáticas para este proyecto.</div> : null}
              {suggestions.map((item, index) => (
                <div key={`${item.clipId}-${index}`} className="project-item">
                  <strong>{item.clipTitle}</strong>
                  <div className="timeline-label">Campo: {item.field} · ID rota: {item.missingId}</div>
                  <div className="timeline-label">Sugerencia: {item.suggestionName || 'Sin coincidencia'}</div>
                  {item.suggestionId ? <div className="action-row"><button className="btn btn-primary" onClick={() => applySuggestion(item.clipId, item.field, item.suggestionId!)}>Aplicar sugerencia</button></div> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
