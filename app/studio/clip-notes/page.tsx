'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createDefaultClipNote, getClipNoteEntry, readClipNotes, upsertClipNote, writeClipNotes, type ClipNoteEntry } from '@/lib/local-clip-notes'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioClipNotesPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [notes, setNotes] = useState<ClipNoteEntry[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setNotes(readClipNotes())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  function updateClipNote(clipId: string, patch: Partial<ClipNoteEntry>, nextStatus: string) {
    if (!activeProject) return
    const current = getClipNoteEntry(notes, activeProject.id, clipId) ?? createDefaultClipNote(activeProject.id, clipId)
    const next = upsertClipNote(notes, { ...current, ...patch })
    setNotes(next)
    writeClipNotes(next)
    setStatus(nextStatus)
  }

  const stats = useMemo(() => {
    if (!activeProject) return null
    const entries = activeProject.clips.map((clip) => getClipNoteEntry(notes, activeProject.id, clip.id)).filter(Boolean) as ClipNoteEntry[]
    return {
      clips: activeProject.clips.length,
      noted: entries.filter((item) => item.note.trim() || item.shotIdea.trim()).length,
      reshoots: entries.filter((item) => item.reshoot).length,
    }
  }, [activeProject, notes])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Clip Notes</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/roles" className="nav-link">Roles</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Notas y reshoots por clip</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Guarda ideas y pendientes de cada clip.</h1>
            <p className="sub">Esta zona sirve para apuntar intención visual, ideas de toma y marcar qué clips necesitan reshoot.</p>
            <div className="action-row">
              <Link href="/studio/roles" className="btn btn-primary">Abrir roles</Link>
              <Link href="/studio/storyboard" className="btn">Abrir storyboard</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y documenta sus clips.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto y resumen</h2><div className="timeline-label">Base activa</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              {stats ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{stats.clips}</strong></p></article>
                  <article className="panel card"><h3>Con notas</h3><p><strong>{stats.noted}</strong></p></article>
                  <article className="panel card"><h3>Reshoots</h3><p><strong>{stats.reshoots}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Cómo usarlo</h2><div className="timeline-label">Flujo</div></div>
              <div className="project-list">
                <div className="project-item"><strong>Nota</strong><div className="timeline-label">Qué debe transmitir o corregir el clip.</div></div>
                <div className="project-item"><strong>Shot idea</strong><div className="timeline-label">Tipo de toma o recurso que falta.</div></div>
                <div className="project-item"><strong>Reshoot</strong><div className="timeline-label">Marca si hay que volver a grabarlo.</div></div>
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Notas del proyecto</h2><div className="timeline-label">{activeProject?.clips.length ?? 0} clip(s)</div></div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {activeProject?.clips.length ? activeProject.clips.map((clip) => {
                const entry = getClipNoteEntry(notes, activeProject.id, clip.id) ?? createDefaultClipNote(activeProject.id, clip.id)
                return (
                  <article key={clip.id} className="panel card">
                    <div className="row-head"><h3>{clip.title}</h3><div className="timeline-label">{clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</div></div>
                    <div className="form">
                      <textarea className="textarea" rows={3} value={entry.note} onChange={(event) => updateClipNote(clip.id, { note: event.target.value }, `Nota actualizada en ${clip.title}`)} placeholder="Nota general del clip" />
                      <textarea className="textarea" rows={3} value={entry.shotIdea} onChange={(event) => updateClipNote(clip.id, { shotIdea: event.target.value }, `Shot idea actualizada en ${clip.title}`)} placeholder="Idea de toma, plano o recurso visual" />
                      <label className="project-item" style={{ cursor: 'pointer' }}>
                        <strong>Marcar para reshoot</strong>
                        <div className="timeline-label">{entry.reshoot ? 'Sí' : 'No'}</div>
                        <input type="checkbox" checked={entry.reshoot} onChange={(event) => updateClipNote(clip.id, { reshoot: event.target.checked }, `Reshoot actualizado en ${clip.title}`)} />
                      </label>
                    </div>
                  </article>
                )
              }) : <div className="empty">No hay clips para anotar.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
