'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import { insertMediaIntoProject, type InsertMode } from '@/lib/project-media-insert'

export default function StudioInsertMediaPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([])
  const [fallbackDuration, setFallbackDuration] = useState(3.5)
  const [mode, setMode] = useState<InsertMode>('append')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    void listLocalMedia().then(setLibrary).catch(() => setLibrary([]))
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const visuals = useMemo(() => library.filter((item) => item.kind === 'image' || item.kind === 'video'), [library])
  const selectedVisuals = useMemo(() => visuals.filter((item) => selectedMediaIds.includes(item.id)), [visuals, selectedMediaIds])

  const stats = useMemo(() => ({
    selected: selectedVisuals.length,
    duration: selectedVisuals.reduce((sum, item) => {
      if (item.kind === 'video' && item.duration && item.duration > 0) return sum + item.duration
      return sum + fallbackDuration
    }, 0),
  }), [selectedVisuals, fallbackDuration])

  function toggleMedia(id: string) {
    setSelectedMediaIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function selectAll() {
    setSelectedMediaIds(visuals.map((item) => item.id))
  }

  function clearSelection() {
    setSelectedMediaIds([])
  }

  function applyInsert() {
    if (!activeProject || selectedVisuals.length === 0) return

    const updated = projects.map((project) => {
      if (project.id !== activeProject.id) return project
      return touchProject(insertMediaIntoProject(project, selectedVisuals, mode, fallbackDuration))
    })

    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(`Media insertada en ${activeProject.name}: ${selectedVisuals.length} clip(s)`)
    setSelectedMediaIds([])
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Insert Media</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
          <Link href="/studio/assemble" className="nav-link">Assemble</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Insertar media en proyecto existente</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Convierte media local en clips dentro del proyecto.</h1>
            <p className="sub">
              Esta zona sirve para coger imágenes o vídeos ya guardados y meterlos en un proyecto existente al inicio o al final, sin crear un proyecto nuevo.
            </p>
            <div className="action-row">
              <Link href="/studio/media" className="btn btn-primary">Abrir media</Link>
              <Link href="/studio/assemble" className="btn">Abrir assemble</Link>
              <button className="btn" onClick={applyInsert} disabled={!activeProject || selectedVisuals.length === 0}>Insertar media</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona media visual y el proyecto destino.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Destino e inserción</h2>
                <div className="timeline-label">Proyecto activo</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={mode} onChange={(event) => setMode(event.target.value as InsertMode)}>
                  <option value="append">Insertar al final</option>
                  <option value="prepend">Insertar al principio</option>
                </select>
                <label className="form">
                  <span className="timeline-label">Duración fallback para imágenes: {fallbackDuration.toFixed(1)} s</span>
                  <input className="input" type="range" min="1" max="10" step="0.5" value={fallbackDuration} onChange={(event) => setFallbackDuration(Number(event.target.value))} />
                </label>
                <div className="action-row">
                  <button className="btn btn-primary" onClick={selectAll}>Seleccionar todo</button>
                  <button className="btn" onClick={clearSelection} disabled={selectedMediaIds.length === 0}>Limpiar selección</button>
                </div>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen</h2>
                <div className="timeline-label">Selección actual</div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Seleccionados</h3><p><strong>{stats.selected}</strong></p></article>
                <article className="panel card"><h3>Duración aprox.</h3><p><strong>{stats.duration.toFixed(2)} s</strong></p></article>
                <article className="panel card"><h3>Proyecto</h3><p><strong>{activeProject?.name ?? '—'}</strong></p></article>
                <article className="panel card"><h3>Modo</h3><p><strong>{mode === 'append' ? 'Final' : 'Inicio'}</strong></p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Media visual disponible</h2>
              <div className="timeline-label">{visuals.length} recurso(s)</div>
            </div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {visuals.length === 0 ? <div className="empty">No hay imágenes o vídeos locales todavía.</div> : null}
              {visuals.map((item) => {
                const selected = selectedMediaIds.includes(item.id)
                return (
                  <article key={item.id} className={`panel card ${selected ? 'active' : ''}`}>
                    <div className="row-head">
                      <h3>{item.name}</h3>
                      <input type="checkbox" checked={selected} onChange={() => toggleMedia(item.id)} />
                    </div>
                    <p><strong>Tipo:</strong> {item.kind}</p>
                    <p><strong>Duración/base:</strong> {item.kind === 'video' && item.duration ? `${item.duration.toFixed(2)} s` : `${fallbackDuration.toFixed(2)} s`}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
