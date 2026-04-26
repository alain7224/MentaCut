'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import {
  closeTimelineGaps,
  distributeTimelineGap,
  inspectTimeline,
  normalizeTimelineFromZero,
  removeTimelineOverlaps,
  type TimelineIssue,
} from '@/lib/timeline-repair'

export default function StudioTimelineRepairPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [gapSeconds, setGapSeconds] = useState(0.25)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const issues = useMemo<TimelineIssue[]>(() => activeProject ? inspectTimeline(activeProject) : [], [activeProject])

  const counts = useMemo(() => ({
    total: issues.length,
    gaps: issues.filter((issue) => issue.type === 'gap').length,
    overlaps: issues.filter((issue) => issue.type === 'overlap').length,
    invalid: issues.filter((issue) => issue.type === 'invalid-duration').length,
    negative: issues.filter((issue) => issue.type === 'negative-start').length,
  }), [issues])

  function persistProject(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function applyNormalize() {
    if (!activeProject) return
    persistProject(activeProject.id, normalizeTimelineFromZero, 'Timeline normalizada desde 0')
  }

  function applyCloseGaps() {
    if (!activeProject) return
    persistProject(activeProject.id, closeTimelineGaps, 'Huecos cerrados en la timeline')
  }

  function applyRemoveOverlaps() {
    if (!activeProject) return
    persistProject(activeProject.id, removeTimelineOverlaps, 'Solapes corregidos en la timeline')
  }

  function applyDistributeGap() {
    if (!activeProject) return
    persistProject(activeProject.id, (project) => distributeTimelineGap(project, gapSeconds), `Separación uniforme aplicada: ${gapSeconds.toFixed(2)}s`)
  }

  const timelineRows = useMemo(() => {
    if (!activeProject) return []
    return activeProject.clips.map((clip, index) => {
      const previous = activeProject.clips[index - 1]
      const delta = previous ? Number((clip.start - previous.end).toFixed(3)) : clip.start
      return {
        id: clip.id,
        title: clip.title,
        start: clip.start,
        end: clip.end,
        duration: Number((clip.end - clip.start).toFixed(3)),
        delta,
      }
    })
  }, [activeProject])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Timeline Repair</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/trim" className="nav-link">Trim</Link>
          <Link href="/studio/pacing" className="nav-link">Pacing</Link>
          <Link href="/studio/qa" className="nav-link">QA</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Reparación de timeline</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Corrige huecos y solapes sin rehacer todo.</h1>
            <p className="sub">
              Esta zona analiza la continuidad temporal del proyecto y te deja normalizar, cerrar huecos, quitar solapes o imponer una separación uniforme entre clips.
            </p>
            <div className="action-row">
              <Link href="/studio/trim" className="btn btn-primary">Abrir trim</Link>
              <Link href="/studio/pacing" className="btn">Abrir pacing</Link>
              <Link href="/studio/qa" className="btn">Abrir QA</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y aplica la reparación que necesites.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto activo</h2>
                <div className="timeline-label">Base de reparación</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <div className="action-row">
                  <button className="btn btn-primary" onClick={applyNormalize} disabled={!activeProject}>Normalizar desde 0</button>
                  <button className="btn" onClick={applyCloseGaps} disabled={!activeProject}>Cerrar huecos</button>
                  <button className="btn" onClick={applyRemoveOverlaps} disabled={!activeProject}>Quitar solapes</button>
                </div>
                <label className="form">
                  <span className="timeline-label">Separación uniforme: {gapSeconds.toFixed(2)} s</span>
                  <input className="input" type="range" min="0" max="2" step="0.05" value={gapSeconds} onChange={(event) => setGapSeconds(Number(event.target.value))} />
                </label>
                <button className="btn" onClick={applyDistributeGap} disabled={!activeProject}>Distribuir separación uniforme</button>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen de incidencias</h2>
                <div className="timeline-label">Timeline actual</div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Total</h3><p><strong>{counts.total}</strong></p></article>
                <article className="panel card"><h3>Huecos</h3><p><strong>{counts.gaps}</strong></p></article>
                <article className="panel card"><h3>Solapes</h3><p><strong>{counts.overlaps}</strong></p></article>
                <article className="panel card"><h3>Duración inválida</h3><p><strong>{counts.invalid}</strong></p></article>
                <article className="panel card"><h3>Inicio negativo</h3><p><strong>{counts.negative}</strong></p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Incidencias detectadas</h2>
                <div className="timeline-label">{issues.length} incidencia(s)</div>
              </div>
              <div className="project-list">
                {issues.length === 0 ? <div className="empty">No se detectaron problemas de continuidad en este proyecto.</div> : null}
                {issues.map((issue, index) => (
                  <div key={`${issue.clipId}-${issue.type}-${index}`} className="project-item">
                    <strong>{issue.clipTitle}</strong>
                    <div className="timeline-label">{issue.message}</div>
                    <div className="timeline-label">Magnitud: {issue.amount.toFixed(3)} s</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Lectura de la timeline</h2>
                <div className="timeline-label">Clip por clip</div>
              </div>
              <div className="project-list">
                {timelineRows.length === 0 ? <div className="empty">No hay clips para mostrar.</div> : null}
                {timelineRows.map((row, index) => (
                  <div key={row.id} className="project-item">
                    <strong>#{index + 1} · {row.title}</strong>
                    <div className="timeline-label">{row.start.toFixed(3)}s → {row.end.toFixed(3)}s</div>
                    <div className="timeline-label">Duración: {row.duration.toFixed(3)} s</div>
                    <div className="timeline-label">Delta con anterior: {row.delta >= 0 ? '+' : ''}{row.delta.toFixed(3)} s</div>
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
