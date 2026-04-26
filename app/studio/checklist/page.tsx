'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  getChecklistForProject,
  readProjectChecklistItems,
  upsertChecklistItem,
  writeProjectChecklistItems,
  type ProjectChecklistItem,
} from '@/lib/local-project-checklists'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioChecklistPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [items, setItems] = useState<ProjectChecklistItem[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setItems(readProjectChecklistItems())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const checklist = useMemo(() => activeProject ? getChecklistForProject(items, activeProject.id) : [], [items, activeProject])

  function persist(nextItems: ProjectChecklistItem[], nextStatus: string) {
    setItems(nextItems)
    writeProjectChecklistItems(nextItems)
    setStatus(nextStatus)
  }

  function toggleItem(item: ProjectChecklistItem) {
    persist(upsertChecklistItem(items, { ...item, done: !item.done }), 'Checklist actualizada')
  }

  function addTask() {
    if (!activeProject || !newTask.trim()) return
    persist(upsertChecklistItem(items, { id: crypto.randomUUID(), projectId: activeProject.id, label: newTask.trim(), done: false }), 'Nueva tarea añadida')
    setNewTask('')
  }

  const stats = useMemo(() => ({
    total: checklist.length,
    done: checklist.filter((item) => item.done).length,
    pending: checklist.filter((item) => !item.done).length,
  }), [checklist])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Checklist</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/publish" className="nav-link">Publish</Link>
          <Link href="/studio/timeline-repair" className="nav-link">Timeline repair</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Checklist manual del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Marca lo que ya revisaste antes de salir.</h1>
            <p className="sub">
              Esta zona te da una lista manual de tareas por proyecto para no olvidar revisiones visuales, audio, subtítulos o validaciones finales.
            </p>
            <div className="action-row">
              <Link href="/studio/publish" className="btn btn-primary">Abrir publish</Link>
              <Link href="/studio/timeline-repair" className="btn">Abrir timeline repair</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y ve marcando su checklist.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y resumen</h2>
                <div className="timeline-label">Control manual</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <div className="editor-grid-2">
                  <input className="input" value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Nueva tarea personalizada" />
                  <button className="btn btn-primary" onClick={addTask} disabled={!activeProject || !newTask.trim()}>Añadir</button>
                </div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Total</h3><p><strong>{stats.total}</strong></p></article>
                <article className="panel card"><h3>Hechas</h3><p><strong>{stats.done}</strong></p></article>
                <article className="panel card"><h3>Pendientes</h3><p><strong>{stats.pending}</strong></p></article>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Tareas</h2>
                <div className="timeline-label">{checklist.length} ítem(s)</div>
              </div>
              <div className="project-list">
                {checklist.length === 0 ? <div className="empty">No hay checklist para mostrar.</div> : null}
                {checklist.map((item) => (
                  <label key={item.id} className="project-item" style={{ cursor: 'pointer' }}>
                    <strong>{item.done ? 'Hecho' : 'Pendiente'} · {item.label}</strong>
                    <div className="timeline-label">{item.done ? 'Marcado como completado' : 'Todavía falta revisarlo'}</div>
                    <input type="checkbox" checked={item.done} onChange={() => toggleItem(item)} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
