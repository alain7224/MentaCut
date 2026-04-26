'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readProjectSubtitleStyles, type ProjectSubtitleStyle } from '@/lib/local-subtitle-style'
import { evaluateSubtitleSafeZones } from '@/lib/safe-zone-check'

export default function StudioSafeZonesPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [styles, setStyles] = useState<ProjectSubtitleStyle[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setStyles(readProjectSubtitleStyles())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeStyle = useMemo(() => styles.find((item) => item.projectId === activeProjectId) ?? null, [styles, activeProjectId])
  const issues = useMemo(() => activeProject ? evaluateSubtitleSafeZones(activeProject, activeStyle) : [], [activeProject, activeStyle])
  const counts = useMemo(() => ({
    total: issues.length,
    high: issues.filter((item) => item.severity === 'high').length,
    medium: issues.filter((item) => item.severity === 'medium').length,
    low: issues.filter((item) => item.severity === 'low').length,
  }), [issues])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Safe Zones</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/subtitle-style" className="nav-link">Subtitle style</Link>
          <Link href="/studio/framing" className="nav-link">Framing</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Chequeo de safe zones</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Detecta choques entre framing y subtítulos.</h1>
            <p className="sub">Esta zona revisa el reencuadre de los clips frente al estilo de subtítulos del proyecto y avisa de posibles colisiones visuales.</p>
            <div className="action-row">
              <Link href="/studio/subtitle-style" className="btn btn-primary">Abrir subtitle style</Link>
              <Link href="/studio/framing" className="btn">Abrir framing</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto y estilo</h2><div className="timeline-label">Base del chequeo</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <div className="project-list">
                <div className="project-item"><strong>Posición subtítulos</strong><div className="timeline-label">{activeStyle?.position ?? 'No definida'}</div></div>
                <div className="project-item"><strong>Alineación</strong><div className="timeline-label">{activeStyle?.align ?? 'No definida'}</div></div>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Resumen</h2><div className="timeline-label">Incidencias</div></div>
              <div className="cards">
                <article className="panel card"><h3>Total</h3><p><strong>{counts.total}</strong></p></article>
                <article className="panel card"><h3>Alta</h3><p><strong>{counts.high}</strong></p></article>
                <article className="panel card"><h3>Media</h3><p><strong>{counts.medium}</strong></p></article>
                <article className="panel card"><h3>Baja</h3><p><strong>{counts.low}</strong></p></article>
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Problemas detectados</h2><div className="timeline-label">{issues.length} aviso(s)</div></div>
            <div className="project-list">
              {issues.length === 0 ? <div className="empty">No se detectan choques claros entre framing y subtítulos.</div> : null}
              {issues.map((issue, index) => (
                <div key={`${issue.clipId}-${index}`} className="project-item">
                  <strong>{issue.severity === 'high' ? 'Alta' : issue.severity === 'medium' ? 'Media' : 'Baja'} · {issue.clipTitle}</strong>
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
