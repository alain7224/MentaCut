'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { canMergeAdjacentClips, mergeAdjacentClips } from '@/lib/clip-merge-utils'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioMergeClipsPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  useEffect(() => {
    if (!activeProject) {
      setSelectedClipIds([])
      return
    }
    const ids = new Set(activeProject.clips.map((clip) => clip.id))
    setSelectedClipIds((current) => current.filter((id) => ids.has(id)))
  }, [activeProject])

  const canMerge = useMemo(() => activeProject ? canMergeAdjacentClips(activeProject, selectedClipIds) : false, [activeProject, selectedClipIds])
  const selected = useMemo(() => activeProject?.clips.filter((clip) => selectedClipIds.includes(clip.id)) ?? [], [activeProject, selectedClipIds])

  function toggleClip(id: string) {
    setSelectedClipIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function mergeSelection() {
    if (!activeProject || !canMerge) return
    const updated = projects.map((project) => {
      if (project.id !== activeProject.id) return project
      return touchProject(mergeAdjacentClips(project, selectedClipIds))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setSelectedClipIds([])
    setStatus(`Clips fusionados: ${selected.length}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Merge Clips</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/split" className="nav-link">Split</Link>
          <Link href="/studio/clip-batch" className="nav-link">Clip batch</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Fusionar clips contiguos</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Une varios clips en uno solo.</h1>
            <p className="sub">
              Esta zona sirve para juntar clips contiguos del mismo proyecto y convertirlos en un bloque único, útil para simplificar montajes después de dividir o probar versiones.
            </p>
            <div className="action-row">
              <Link href="/studio/split" className="btn btn-primary">Abrir split</Link>
              <Link href="/studio/clip-batch" className="btn">Abrir clip batch</Link>
              <button className="btn" onClick={mergeSelection} disabled={!canMerge}>Fusionar selección</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona clips consecutivos para unirlos.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y reglas</h2>
                <div className="timeline-label">Selección activa</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
              </div>
              <div className="project-list">
                <div className="project-item"><strong>Selecciona 2 o más clips</strong><div className="timeline-label">La selección debe ser contigua en la timeline.</div></div>
                <div className="project-item"><strong>Sin huecos internos</strong><div className="timeline-label">No puede faltar un clip intermedio entre los elegidos.</div></div>
                <div className="project-item"><strong>Resultado</strong><div className="timeline-label">Se crea un clip único con texto combinado.</div></div>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen</h2>
                <div className="timeline-label">Estado de la selección</div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Seleccionados</h3><p><strong>{selected.length}</strong></p></article>
                <article className="panel card"><h3>Contiguos</h3><p><strong>{canMerge ? 'Sí' : 'No'}</strong></p></article>
                <article className="panel card"><h3>Duración</h3><p><strong>{selected.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0).toFixed(3)} s</strong></p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Clips del proyecto</h2>
              <div className="timeline-label">{activeProject?.clips.length ?? 0} clip(s)</div>
            </div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {activeProject?.clips.length ? activeProject.clips.map((clip, index) => {
                const selectedClip = selectedClipIds.includes(clip.id)
                return (
                  <article key={clip.id} className={`panel card ${selectedClip ? 'active' : ''}`}>
                    <div className="row-head">
                      <h3>#{index + 1} · {clip.title}</h3>
                      <input type="checkbox" checked={selectedClip} onChange={() => toggleClip(clip.id)} />
                    </div>
                    <p><strong>Tiempo:</strong> {clip.start.toFixed(3)}s → {clip.end.toFixed(3)}s</p>
                    <p><strong>Headline:</strong> {clip.headlineText || '—'}</p>
                    <p><strong>Caption:</strong> {clip.captionText || '—'}</p>
                  </article>
                )
              }) : <div className="empty">No hay clips en este proyecto.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
