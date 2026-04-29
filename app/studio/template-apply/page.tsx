'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { applyFunctionalTemplate, type FunctionalTemplateId } from '@/lib/functional-templates'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioTemplateApplyPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<FunctionalTemplateId>('hook-crystal')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const preview = useMemo(() => activeProject ? applyFunctionalTemplate(activeProject, templateId) : null, [activeProject, templateId])

  function applyNow() {
    if (!activeProject || !preview) return
    const updated = projects.map((project) => project.id === activeProject.id ? touchProject(preview) : project)
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(`Plantilla aplicada: ${templateId}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Template Apply</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/player" className="nav-link">Player</Link>
          <Link href="/studio/roles" className="nav-link">Roles</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Plantillas funcionales</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Aplica una plantilla real al proyecto.</h1>
            <p className="sub">Esta zona aplica reglas funcionales que modifican titulares, captions y algunos ajustes del montaje base.</p>
            <div className="action-row">
              <Link href="/studio/player" className="btn btn-primary">Abrir player</Link>
              <Link href="/studio/roles" className="btn">Abrir roles</Link>
              <button className="btn" onClick={applyNow} disabled={!preview}>Aplicar plantilla</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona proyecto y plantilla.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Configuración</h2><div className="timeline-label">Plantilla</div></div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <select className="input" value={templateId} onChange={(event) => setTemplateId(event.target.value as FunctionalTemplateId)}>
                  <option value="hook-crystal">hook-crystal</option>
                  <option value="problem-solution">problem-solution</option>
                  <option value="proof-cta">proof-cta</option>
                </select>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preview de cambios</h2><div className="timeline-label">Clips</div></div>
              <div className="project-list">
                {preview?.clips.length ? preview.clips.map((clip, index) => (
                  <div key={clip.id} className="project-item">
                    <strong>#{index + 1} · {clip.title}</strong>
                    <div className="timeline-label">Headline: {clip.headlineText}</div>
                    <div className="timeline-label">Caption: {clip.captionText}</div>
                    <div className="timeline-label">Template: {clip.templateId}</div>
                  </div>
                )) : <div className="empty">No hay preview disponible.</div>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
