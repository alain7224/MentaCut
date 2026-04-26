'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createTimelineMarker, readTimelineMarkers, upsertTimelineMarker, writeTimelineMarkers, type TimelineMarker, type TimelineMarkerColor } from '@/lib/local-timeline-markers'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

const COLORS: TimelineMarkerColor[] = ['mint', 'amber', 'rose', 'sky', 'violet']

export default function StudioMarkersPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [markers, setMarkers] = useState<TimelineMarker[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setMarkers(readTimelineMarkers())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const projectDuration = useMemo(() => activeProject?.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0) ?? 0, [activeProject])
  const projectMarkers = useMemo(() => markers.filter((item) => item.projectId === activeProjectId).sort((a, b) => a.time - b.time), [markers, activeProjectId])

  function persist(nextMarkers: TimelineMarker[], nextStatus: string) {
    setMarkers(nextMarkers)
    writeTimelineMarkers(nextMarkers)
    setStatus(nextStatus)
  }

  function addMarker() {
    if (!activeProjectId) return
    const marker = createTimelineMarker(activeProjectId, 0)
    persist([marker, ...markers], 'Marker añadido')
  }

  function updateMarker(marker: TimelineMarker, patch: Partial<TimelineMarker>, nextStatus: string) {
    persist(upsertTimelineMarker(markers, { ...marker, ...patch }), nextStatus)
  }

  function removeMarker(markerId: string) {
    persist(markers.filter((item) => item.id !== markerId), 'Marker eliminado')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Markers</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/trim" className="nav-link">Trim</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Markers en timeline</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Marca momentos clave del proyecto.</h1>
            <p className="sub">Sirve para señalar beats, revisiones o puntos importantes dentro de la timeline.</p>
            <div className="action-row">
              <Link href="/studio/trim" className="btn btn-primary">Abrir trim</Link>
              <button className="btn" onClick={addMarker} disabled={!activeProjectId}>Añadir marker</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y documenta su timeline.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base de markers</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <div className="cards">
                <article className="panel card"><h3>Markers</h3><p><strong>{projectMarkers.length}</strong></p></article>
                <article className="panel card"><h3>Duración</h3><p><strong>{projectDuration.toFixed(2)} s</strong></p></article>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Markers del proyecto</h2><div className="timeline-label">{projectMarkers.length} item(s)</div></div>
              <div className="project-list">
                {projectMarkers.length === 0 ? <div className="empty">Todavía no hay markers.</div> : null}
                {projectMarkers.map((marker) => (
                  <div key={marker.id} className="project-item" style={{ display: 'grid', gap: 10 }}>
                    <input className="input" value={marker.label} onChange={(event) => updateMarker(marker, { label: event.target.value }, 'Etiqueta actualizada')} placeholder="Etiqueta" />
                    <label className="form">
                      <span className="timeline-label">Tiempo: {marker.time.toFixed(3)} s</span>
                      <input className="input" type="range" min="0" max={Math.max(1, projectDuration)} step="0.1" value={marker.time} onChange={(event) => updateMarker(marker, { time: Number(event.target.value) }, 'Tiempo actualizado')} />
                    </label>
                    <select className="input" value={marker.color} onChange={(event) => updateMarker(marker, { color: event.target.value as TimelineMarkerColor }, 'Color actualizado')}>
                      {COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                    </select>
                    <textarea className="textarea" rows={3} value={marker.note} onChange={(event) => updateMarker(marker, { note: event.target.value }, 'Nota actualizada')} placeholder="Comentario o contexto" />
                    <button className="btn" onClick={() => removeMarker(marker.id)}>Borrar marker</button>
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
