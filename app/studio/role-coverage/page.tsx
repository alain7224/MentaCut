'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { buildRoleCoverage } from '@/lib/role-coverage'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioRoleCoveragePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setRoles(readClipRoles())
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const rows = useMemo(() => activeProject ? buildRoleCoverage(activeProject, roles) : [], [activeProject, roles])
  const totalDuration = useMemo(() => rows.reduce((sum, row) => sum + row.duration, 0), [rows])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Role Coverage</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/roles" className="nav-link">Roles</Link>
          <Link href="/studio/timeline-map" className="nav-link">Timeline map</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Cobertura narrativa por roles</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Mide cuánto ocupa cada rol en el montaje.</h1>
            <p className="sub">Esta zona resume los clips y la duración acumulada por rol narrativo para detectar desequilibrios en el proyecto.</p>
            <div className="action-row">
              <Link href="/studio/roles" className="btn btn-primary">Abrir roles</Link>
              <Link href="/studio/timeline-map" className="btn">Abrir timeline map</Link>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Cobertura</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <div className="cards">
                <article className="panel card"><h3>Roles</h3><p><strong>{rows.length}</strong></p></article>
                <article className="panel card"><h3>Duración total</h3><p><strong>{totalDuration.toFixed(2)} s</strong></p></article>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Distribución</h2><div className="timeline-label">Por rol</div></div>
              <div className="project-list">
                {rows.length === 0 ? <div className="empty">No hay datos de roles para este proyecto.</div> : null}
                {rows.map((row) => (
                  <div key={row.role} className="project-item">
                    <strong>{row.role}</strong>
                    <div className="timeline-label">Clips: {row.clips} · Duración: {row.duration.toFixed(2)} s</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
