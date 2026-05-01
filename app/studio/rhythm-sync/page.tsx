'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { alignProjectClipsToBeatMarkers } from '@/lib/beat-sync'
import { readProjectBeatMaps, type ProjectBeatMap } from '@/lib/local-beatmap'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioRhythmSyncPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [beatMaps, setBeatMaps] = useState<ProjectBeatMap[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setBeatMaps(readProjectBeatMaps())
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeBeatMap = useMemo(() => beatMaps.find((item) => item.projectId === activeProjectId) ?? null, [beatMaps, activeProjectId])
  const preview = useMemo(() => activeProject && activeBeatMap ? alignProjectClipsToBeatMarkers(activeProject, activeBeatMap.markers) : null, [activeProject, activeBeatMap])

  function applySync() {
    if (!activeProject || !preview) return
    const updated = projects.map((project) => project.id === activeProject.id ? touchProject(preview) : project)
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus('Clips alineados al ritmo')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Rhythm Sync</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/auto-beat" className="nav-link">Auto beat</Link>
          <Link href="/studio/beatmap" className="nav-link">Beat map</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Rhythm sync</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Alinea clips con markers.</h1>
            <p className="sub">Usa el mapa de ritmo del proyecto para ajustar inicios y finales de los clips.</p>
            <div className="action-row">
              <Link href="/studio/auto-beat" className="btn btn-primary">Abrir auto beat</Link>
              <Link href="/studio/beatmap" className="btn">Abrir beat map</Link>
              <button className="btn" onClick={applySync} disabled={!preview}>Aplicar sync</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto con mapa de ritmo.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <div className="cards">
                <article className="panel card"><h3>Markers</h3><p><strong>{activeBeatMap?.markers.length ?? 0}</strong></p></article>
                <article className="panel card"><h3>Clips</h3><p><strong>{activeProject?.clips.length ?? 0}</strong></p></article>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preview</h2><div className="timeline-label">Nuevos tiempos</div></div>
              <div className="project-list">
                {preview?.clips.length ? preview.clips.map((clip, index) => (
                  <div key={clip.id} className="project-item">
                    <strong>#{index + 1} · {clip.title}</strong>
                    <div className="timeline-label">{clip.start.toFixed(3)}s → {clip.end.toFixed(3)}s</div>
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
