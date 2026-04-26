'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { touchProject, readLocalProjects, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import { deleteSelectedClips, duplicateSelectedClips, exportSelectedClips, getSelectedClips, renumberClipTitles } from '@/lib/clip-batch-utils'

export default function StudioClipBatchPage() {
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
    const clipSet = new Set(activeProject.clips.map((clip) => clip.id))
    setSelectedClipIds((current) => current.filter((id) => clipSet.has(id)))
  }, [activeProject])

  const selectedClips = useMemo(
    () => activeProject ? getSelectedClips(activeProject, selectedClipIds) : [],
    [activeProject, selectedClipIds],
  )

  const stats = useMemo(() => {
    const selectedDuration = selectedClips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0)
    return {
      selected: selectedClips.length,
      duration: selectedDuration,
      total: activeProject?.clips.length ?? 0,
    }
  }, [selectedClips, activeProject])

  function persistProject(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string, clearSelection = false) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
    if (clearSelection) setSelectedClipIds([])
  }

  function toggleClip(clipId: string) {
    setSelectedClipIds((current) => current.includes(clipId) ? current.filter((id) => id !== clipId) : [...current, clipId])
  }

  function selectAll() {
    if (!activeProject) return
    setSelectedClipIds(activeProject.clips.map((clip) => clip.id))
  }

  function clearSelection() {
    setSelectedClipIds([])
  }

  function duplicateSelection() {
    if (!activeProject || selectedClipIds.length === 0) return
    persistProject(activeProject.id, (project) => duplicateSelectedClips(project, selectedClipIds), `Clips duplicados: ${selectedClipIds.length}`)
  }

  function deleteSelection() {
    if (!activeProject || selectedClipIds.length === 0) return
    persistProject(activeProject.id, (project) => renumberClipTitles(deleteSelectedClips(project, selectedClipIds)), `Clips borrados: ${selectedClipIds.length}`, true)
  }

  function exportSelection() {
    if (!activeProject || selectedClipIds.length === 0) return
    const json = exportSelectedClips(activeProject, selectedClipIds)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}-selected-clips.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus(`Selección exportada: ${selectedClipIds.length} clip(s)`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Clip Batch</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio/batch" className="nav-link">Batch global</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Multiselección de clips</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Borra, duplica y exporta por lote.</h1>
            <p className="sub">
              Esta zona te deja seleccionar varios clips del mismo proyecto para aplicar acciones masivas sin entrar uno por uno, útil para limpieza, duplicados o exportes parciales.
            </p>
            <div className="action-row">
              <Link href="/studio/storyboard" className="btn btn-primary">Abrir storyboard</Link>
              <Link href="/studio/batch" className="btn">Abrir batch global</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona varios clips y aplica acciones de lote.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y selección</h2>
                <div className="timeline-label">Lote activo</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <div className="action-row">
                  <button className="btn btn-primary" onClick={selectAll} disabled={!activeProject}>Seleccionar todo</button>
                  <button className="btn" onClick={clearSelection} disabled={selectedClipIds.length === 0}>Limpiar selección</button>
                </div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Seleccionados</h3><p><strong>{stats.selected}</strong></p></article>
                <article className="panel card"><h3>Duración lote</h3><p><strong>{stats.duration.toFixed(2)} s</strong></p></article>
                <article className="panel card"><h3>Total clips</h3><p><strong>{stats.total}</strong></p></article>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Acciones por lote</h2>
                <div className="timeline-label">Aplicación inmediata</div>
              </div>
              <div className="action-row" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={duplicateSelection} disabled={selectedClipIds.length === 0}>Duplicar selección</button>
                <button className="btn" onClick={deleteSelection} disabled={selectedClipIds.length === 0}>Borrar selección</button>
                <button className="btn" onClick={exportSelection} disabled={selectedClipIds.length === 0}>Exportar selección</button>
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
              {activeProject?.clips.length ? activeProject.clips.map((clip) => {
                const selected = selectedClipIds.includes(clip.id)
                return (
                  <article key={clip.id} className={`panel card ${selected ? 'active' : ''}`}>
                    <div className="row-head">
                      <h3>{clip.title}</h3>
                      <input type="checkbox" checked={selected} onChange={() => toggleClip(clip.id)} />
                    </div>
                    <p><strong>Tiempo:</strong> {clip.start.toFixed(2)}s → {clip.end.toFixed(2)}s</p>
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
