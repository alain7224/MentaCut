'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

const NUDGES = [0.1, 0.25, 0.5, 1]

export default function StudioTrimPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeClipId, setActiveClipId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setActiveClipId(next[0]?.clips[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeClip = useMemo(() => activeProject?.clips.find((clip) => clip.id === activeClipId) ?? null, [activeProject, activeClipId])

  useEffect(() => {
    if (!activeProject) {
      setActiveClipId(null)
      return
    }
    const exists = activeProject.clips.some((clip) => clip.id === activeClipId)
    if (!exists) setActiveClipId(activeProject.clips[0]?.id ?? null)
  }, [activeProject, activeClipId])

  function persistProject(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function updateClipTiming(clipId: string, nextStart: number, nextEnd: number, nextStatus: string) {
    if (!activeProject) return
    const safeStart = Math.max(0, Number(nextStart.toFixed(3)))
    const safeEnd = Math.max(safeStart + 0.1, Number(nextEnd.toFixed(3)))

    persistProject(
      activeProject.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => clip.id === clipId ? { ...clip, start: safeStart, end: safeEnd } : clip),
      }),
      nextStatus,
    )
  }

  function nudgeStart(delta: number) {
    if (!activeClip) return
    const nextStart = activeClip.start + delta
    updateClipTiming(activeClip.id, Math.min(nextStart, activeClip.end - 0.1), activeClip.end, `Inicio ajustado ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}s`)
  }

  function nudgeEnd(delta: number) {
    if (!activeClip) return
    const nextEnd = activeClip.end + delta
    updateClipTiming(activeClip.id, activeClip.start, Math.max(activeClip.start + 0.1, nextEnd), `Fin ajustado ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}s`)
  }

  function setDuration(duration: number) {
    if (!activeClip) return
    const safeDuration = Math.max(0.1, duration)
    updateClipTiming(activeClip.id, activeClip.start, activeClip.start + safeDuration, 'Duración del clip actualizada')
  }

  function trimToPreset(duration: number) {
    if (!activeClip) return
    setDuration(duration)
  }

  function rippleFromClip() {
    if (!activeProject || !activeClip) return
    const clipIndex = activeProject.clips.findIndex((clip) => clip.id === activeClip.id)
    if (clipIndex < 0) return

    const updatedProject: LocalProject = {
      ...activeProject,
      clips: activeProject.clips.map((clip) => ({ ...clip })),
    }

    for (let i = clipIndex + 1; i < updatedProject.clips.length; i += 1) {
      const prev = updatedProject.clips[i - 1]
      const current = updatedProject.clips[i]
      const duration = Math.max(0.1, current.end - current.start)
      current.start = Number(prev.end.toFixed(3))
      current.end = Number((current.start + duration).toFixed(3))
    }

    persistProject(activeProject.id, () => updatedProject, 'Ripple aplicado desde el clip activo')
  }

  const stats = useMemo(() => {
    if (!activeProject || !activeClip) return null
    const duration = Math.max(0.1, activeClip.end - activeClip.start)
    const totalDuration = activeProject.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0)
    return {
      clips: activeProject.clips.length,
      clipDuration: duration,
      totalDuration,
      start: activeClip.start,
      end: activeClip.end,
    }
  }, [activeProject, activeClip])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Trim</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/pacing" className="nav-link">Pacing</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Trim fino del clip</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Ajusta tiempos con precisión.</h1>
            <p className="sub">
              Esta vista sirve para tocar el inicio, el final y la duración exacta del clip activo con nudges pequeños, presets rápidos y ripple hacia adelante.
            </p>
            <div className="action-row">
              <Link href="/studio/pacing" className="btn btn-primary">Abrir pacing</Link>
              <Link href="/studio/storyboard" className="btn">Abrir storyboard</Link>
              <button className="btn" onClick={rippleFromClip} disabled={!activeClip}>Aplicar ripple</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona proyecto y clip para ajustar tiempos finos.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y clip</h2>
                <div className="timeline-label">Selección activa</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={activeClipId ?? ''} onChange={(event) => setActiveClipId(event.target.value)}>
                  {activeProject?.clips.map((clip) => (
                    <option key={clip.id} value={clip.id}>{clip.title}</option>
                  ))}
                </select>
              </div>
              {stats ? (
                <div className="cards">
                  <article className="panel card"><h3>Inicio</h3><p><strong>{stats.start.toFixed(3)} s</strong></p></article>
                  <article className="panel card"><h3>Fin</h3><p><strong>{stats.end.toFixed(3)} s</strong></p></article>
                  <article className="panel card"><h3>Duración clip</h3><p><strong>{stats.clipDuration.toFixed(3)} s</strong></p></article>
                  <article className="panel card"><h3>Duración proyecto</h3><p><strong>{stats.totalDuration.toFixed(3)} s</strong></p></article>
                </div>
              ) : <div className="empty">No hay clip seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Duraciones rápidas</h2>
                <div className="timeline-label">Presets</div>
              </div>
              <div className="preset-chip-wrap">
                {[0.5, 1, 2, 3, 5, 8, 10].map((seconds) => (
                  <button key={seconds} className="preset-chip" onClick={() => trimToPreset(seconds)} disabled={!activeClip}>{seconds}s</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Nudges de inicio</h2>
                <div className="timeline-label">Mover corte izquierdo</div>
              </div>
              <div className="action-row" style={{ flexWrap: 'wrap' }}>
                {NUDGES.map((step) => (
                  <>
                    <button key={`start-minus-${step}`} className="btn" onClick={() => nudgeStart(-step)} disabled={!activeClip}>-{step}s</button>
                    <button key={`start-plus-${step}`} className="btn" onClick={() => nudgeStart(step)} disabled={!activeClip}>+{step}s</button>
                  </>
                ))}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Nudges de fin</h2>
                <div className="timeline-label">Mover corte derecho</div>
              </div>
              <div className="action-row" style={{ flexWrap: 'wrap' }}>
                {NUDGES.map((step) => (
                  <>
                    <button key={`end-minus-${step}`} className="btn" onClick={() => nudgeEnd(-step)} disabled={!activeClip}>-{step}s</button>
                    <button key={`end-plus-${step}`} className="btn" onClick={() => nudgeEnd(step)} disabled={!activeClip}>+{step}s</button>
                  </>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
