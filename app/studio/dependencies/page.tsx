'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { auditProjectDependencies } from '@/lib/project-dependency-audit'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioDependenciesPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    void listLocalMedia().then(setLibrary).catch(() => setLibrary([]))
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const issues = useMemo(() => activeProject ? auditProjectDependencies(activeProject, library) : [], [activeProject, library])
  const counts = useMemo(() => ({
    high: issues.filter((item) => item.severity === 'high').length,
    medium: issues.filter((item) => item.severity === 'medium').length,
    low: issues.filter((item) => item.severity === 'low').length,
  }), [issues])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Dependencies</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/import-queue" className="nav-link">Import queue</Link>
          <Link href="/studio/relink" className="nav-link">Relink</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Auditoría de dependencias</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Revisa si faltan medias o enlaces internos.</h1>
            <p className="sub">Esta zona detecta clips rotos, audios perdidos, templateId vacíos y copy faltante antes de seguir editando o exportar.</p>
            <div className="action-row">
              <Link href="/studio/import-queue" className="btn btn-primary">Abrir import queue</Link>
              <Link href="/studio/relink" className="btn">Abrir relink</Link>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Chequeo</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <div className="cards">
                <article className="panel card"><h3>Alta</h3><p><strong>{counts.high}</strong></p></article>
                <article className="panel card"><h3>Media</h3><p><strong>{counts.medium}</strong></p></article>
                <article className="panel card"><h3>Baja</h3><p><strong>{counts.low}</strong></p></article>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Librería</h2><div className="timeline-label">Media local</div></div>
              <div className="cards">
                <article className="panel card"><h3>Recursos</h3><p><strong>{library.length}</strong></p></article>
                <article className="panel card"><h3>Clips</h3><p><strong>{activeProject?.clips.length ?? 0}</strong></p></article>
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Problemas detectados</h2><div className="timeline-label">{issues.length} issue(s)</div></div>
            <div className="project-list">
              {issues.length === 0 ? <div className="empty">No se detectan problemas claros en este proyecto.</div> : null}
              {issues.map((issue, index) => (
                <div key={`${issue.clipId}-${index}`} className="project-item">
                  <strong>{issue.severity.toUpperCase()} · {issue.clipTitle}</strong>
                  <div className="timeline-label">{issue.type}</div>
                  <div className="timeline-label">{issue.message}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
