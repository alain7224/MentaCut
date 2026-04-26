'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { previewSplitClip, splitClipInProject, type SplitParts } from '@/lib/clip-split-utils'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioSplitPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeClipId, setActiveClipId] = useState<string | null>(null)
  const [parts, setParts] = useState<SplitParts>(2)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setActiveClipId(next[0]?.clips[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeClip = useMemo(() => activeProject?.clips.find((clip) => clip.id === activeClipId) ?? null, [activeProject, activeClipId])
  const preview = useMemo(() => activeClip ? previewSplitClip(activeClip, parts) : [], [activeClip, parts])

  useEffect(() => {
    if (!activeProject) {
      setActiveClipId(null)
      return
    }
    const exists = activeProject.clips.some((clip) => clip.id === activeClipId)
    if (!exists) setActiveClipId(activeProject.clips[0]?.id ?? null)
  }, [activeProject, activeClipId])

  function applySplit() {
    if (!activeProject || !activeClip) return
    const updated = projects.map((project) => {
      if (project.id !== activeProject.id) return project
      return touchProject(splitClipInProject(project, activeClip.id, parts))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(`Clip dividido en ${parts} partes`) 
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Split</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/trim" className="nav-link">Trim</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Dividir clip en partes</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Parte un clip sin recalcularlo a mano.</h1>
            <p className="sub">
              Esta zona divide el clip activo en 2, 3 o 4 bloques iguales, manteniendo copy, media y duración total del original para seguir editando más fino.
            </p>
            <div className="action-row">
              <Link href="/studio/trim" className="btn btn-primary">Abrir trim</Link>
              <Link href="/studio/storyboard" className="btn">Abrir storyboard</Link>
              <button className="btn" onClick={applySplit} disabled={!activeClip}>Aplicar división</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un clip y cuántas partes quieres crear.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y clip</h2>
                <div className="timeline-label">Base activa</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <select className="input" value={activeClipId ?? ''} onChange={(event) => setActiveClipId(event.target.value)}>
                  {activeProject?.clips.map((clip) => <option key={clip.id} value={clip.id}>{clip.title}</option>)}
                </select>
                <select className="input" value={parts} onChange={(event) => setParts(Number(event.target.value) as SplitParts)}>
                  <option value={2}>2 partes</option>
                  <option value={3}>3 partes</option>
                  <option value={4}>4 partes</option>
                </select>
              </div>
              {activeClip ? (
                <div className="cards">
                  <article className="panel card"><h3>Original</h3><p><strong>{(activeClip.end - activeClip.start).toFixed(3)} s</strong></p></article>
                  <article className="panel card"><h3>Partes</h3><p><strong>{parts}</strong></p></article>
                  <article className="panel card"><h3>Cada parte aprox.</h3><p><strong>{((activeClip.end - activeClip.start) / parts).toFixed(3)} s</strong></p></article>
                </div>
              ) : <div className="empty">No hay clip seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview de la división</h2>
                <div className="timeline-label">{preview.length} clip(s)</div>
              </div>
              <div className="project-list">
                {preview.length === 0 ? <div className="empty">No hay preview disponible.</div> : null}
                {preview.map((clip) => (
                  <div key={clip.id} className="project-item">
                    <strong>{clip.title}</strong>
                    <div className="timeline-label">{clip.start.toFixed(3)}s → {clip.end.toFixed(3)}s</div>
                    <div className="timeline-label">Duración: {(clip.end - clip.start).toFixed(3)} s</div>
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
