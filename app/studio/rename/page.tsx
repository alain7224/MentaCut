'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { renameProjectClips, type ClipRenameMode } from '@/lib/clip-rename-utils'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioRenamePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [mode, setMode] = useState<ClipRenameMode>('replace')
  const [value, setValue] = useState('Escena')
  const [startNumber, setStartNumber] = useState(1)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const preview = useMemo(() => activeProject ? renameProjectClips(activeProject, { mode, value, startNumber }) : null, [activeProject, mode, value, startNumber])

  function applyRename() {
    if (!activeProject || !preview) return
    const updated = projects.map((project) => project.id === activeProject.id ? touchProject(preview) : project)
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus('Renombrado masivo aplicado')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Rename</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/clip-batch" className="nav-link">Clip batch</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Renombrado masivo de clips</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Cambia títulos de golpe.</h1>
            <p className="sub">Esta zona sirve para renombrar todos los clips del proyecto con una regla única y ver preview antes de aplicar.</p>
            <div className="action-row">
              <Link href="/studio/clip-batch" className="btn btn-primary">Abrir clip batch</Link>
              <Link href="/studio/storyboard" className="btn">Abrir storyboard</Link>
              <button className="btn" onClick={applyRename} disabled={!preview}>Aplicar renombrado</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y define la regla de títulos.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Configuración</h2><div className="timeline-label">Proyecto activo</div></div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <select className="input" value={mode} onChange={(event) => setMode(event.target.value as ClipRenameMode)}>
                  <option value="replace">Reemplazar títulos</option>
                  <option value="prefix-number">Prefijo numerado</option>
                  <option value="suffix-number">Sufijo numerado</option>
                </select>
                <input className="input" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Texto base" />
                <label className="form">
                  <span className="timeline-label">Empezar numeración en: {startNumber}</span>
                  <input className="input" type="range" min="1" max="100" step="1" value={startNumber} onChange={(event) => setStartNumber(Number(event.target.value))} />
                </label>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preview</h2><div className="timeline-label">Antes de aplicar</div></div>
              <div className="project-list">
                {preview?.clips.length ? preview.clips.map((clip, index) => (
                  <div key={clip.id} className="project-item">
                    <strong>#{index + 1} · {clip.title}</strong>
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
