'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { addProjectTag, readProjectTags, removeProjectTag, writeProjectTags, type ProjectTagEntry } from '@/lib/local-project-tags'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioTagsPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [tags, setTags] = useState<ProjectTagEntry[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setTags(readProjectTags())
  }, [])

  const projectTags = useMemo(() => tags.filter((item) => item.projectId === activeProjectId), [tags, activeProjectId])

  function persist(next: ProjectTagEntry[], nextStatus: string) {
    setTags(next)
    writeProjectTags(next)
    setStatus(nextStatus)
  }

  function handleAdd() {
    if (!activeProjectId || !newTag.trim()) return
    persist(addProjectTag(tags, activeProjectId, newTag), 'Tag añadida')
    setNewTag('')
  }

  function handleRemove(tagId: string) {
    persist(removeProjectTag(tags, tagId), 'Tag eliminada')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Tags</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/archive" className="nav-link">Archive</Link>
          <Link href="/studio/finder" className="nav-link">Finder</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Tags por proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Organiza proyectos por etiquetas.</h1>
            <p className="sub">Esta zona sirve para clasificar proyectos con tags como cliente, campaña, formato o estado.</p>
            <div className="action-row">
              <Link href="/studio/archive" className="btn btn-primary">Abrir archive</Link>
              <Link href="/studio/finder" className="btn">Abrir finder</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y añade sus tags.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base de tags</div></div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <div className="editor-grid-2">
                  <input className="input" value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="Nuevo tag" />
                  <button className="btn btn-primary" onClick={handleAdd} disabled={!activeProjectId || !newTag.trim()}>Añadir tag</button>
                </div>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Tags del proyecto</h2><div className="timeline-label">{projectTags.length} tag(s)</div></div>
              <div className="project-list">
                {projectTags.length === 0 ? <div className="empty">Este proyecto todavía no tiene tags.</div> : null}
                {projectTags.map((tag) => (
                  <div key={tag.id} className="project-item">
                    <strong>{tag.value}</strong>
                    <div className="action-row"><button className="btn" onClick={() => handleRemove(tag.id)}>Quitar</button></div>
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
