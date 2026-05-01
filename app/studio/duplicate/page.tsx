'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { duplicateProject } from '@/lib/project-duplicate'
import { readLocalProjects, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioDuplicatePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [suffix, setSuffix] = useState('variante')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  function handleDuplicate() {
    if (!activeProject) return
    const copy = duplicateProject(activeProject, suffix)
    const next = [copy, ...projects]
    setProjects(next)
    writeLocalProjects(next)
    setStatus(`Proyecto duplicado: ${copy.name}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Duplicate</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/snapshots" className="nav-link">Snapshots</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Duplicador de proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Crea variantes sin tocar el original.</h1>
            <p className="sub">Esta zona duplica el proyecto completo con nuevos IDs de clips para hacer versiones, tests o entregas alternativas.</p>
            <div className="action-row">
              <Link href="/studio/projects" className="btn btn-primary">Abrir proyectos</Link>
              <Link href="/studio/snapshots" className="btn">Abrir snapshots</Link>
              <button className="btn" onClick={handleDuplicate} disabled={!activeProject}>Duplicar proyecto</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y crea su variante.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Configuración</h2><div className="timeline-label">Copia</div></div>
            <div className="form">
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <input className="input" value={suffix} onChange={(event) => setSuffix(event.target.value)} placeholder="Sufijo de la variante" />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
