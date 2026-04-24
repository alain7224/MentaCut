'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createProject, readLocalProjects, touchProject, type LocalProject, type ProjectFormat, writeLocalProjects } from '@/lib/local-store'

const FORMATS: ProjectFormat[] = ['9:16', '1:1', '4:5', '16:9']

function cloneProject(project: LocalProject): LocalProject {
  return {
    ...touchProject(project),
    id: crypto.randomUUID(),
    name: `${project.name} copia`,
    clips: project.clips.map((clip) => ({ ...clip, id: crypto.randomUUID() })),
  }
}

export default function StudioProjectsPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [name, setName] = useState('Proyecto MentaCut')
  const [format, setFormat] = useState<ProjectFormat>('9:16')
  const [status, setStatus] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
  }, [])

  function persist(next: LocalProject[]) {
    setProjects(next)
    writeLocalProjects(next)
  }

  function handleCreate() {
    const nextProject = createProject(name.trim() || 'Proyecto MentaCut', format)
    persist([nextProject, ...projects])
    setStatus('Proyecto creado localmente')
  }

  function handleDelete(projectId: string) {
    const next = projects.filter((item) => item.id !== projectId)
    persist(next)
    setStatus('Proyecto eliminado')
    if (editingId === projectId) {
      setEditingId(null)
      setEditingName('')
    }
  }

  function handleDuplicate(projectId: string) {
    const source = projects.find((item) => item.id === projectId)
    if (!source) return
    persist([cloneProject(source), ...projects])
    setStatus('Proyecto duplicado')
  }

  function startRename(project: LocalProject) {
    setEditingId(project.id)
    setEditingName(project.name)
  }

  function saveRename(projectId: string) {
    const next = projects.map((item) => item.id === projectId ? touchProject({ ...item, name: editingName.trim() || item.name }) : item)
    persist(next)
    setEditingId(null)
    setEditingName('')
    setStatus('Nombre actualizado')
  }

  const totals = useMemo(() => ({
    projects: projects.length,
    clips: projects.reduce((sum, item) => sum + item.clips.length, 0),
    latest: projects[0]?.updatedAt ?? null,
  }), [projects])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Proyectos</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
          <Link href="/studio/library" className="nav-link">Biblioteca</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
          <Link href="/studio/backup" className="nav-link">Backup</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Gestión local de proyectos</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Organiza tus proyectos antes de editar.</h1>
            <p className="sub">
              Esta zona separa la gestión del proyecto del editor principal: crea nuevas bases, duplica estructuras, renombra y limpia proyectos locales del navegador.
            </p>
            <div className="action-row">
              <Link href="/studio" className="btn btn-primary">Abrir estudio</Link>
              <Link href="/studio/backup" className="btn">Abrir backup</Link>
            </div>
            <div className="timeline-label">{status || 'Tus cambios aquí afectan a la lista local de proyectos.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="cards">
            <article className="panel card"><h3>Proyectos</h3><p><strong>{totals.projects}</strong> guardados</p></article>
            <article className="panel card"><h3>Clips</h3><p><strong>{totals.clips}</strong> en total</p></article>
            <article className="panel card"><h3>Última actividad</h3><p>{totals.latest ? new Date(totals.latest).toLocaleString() : 'Sin datos'}</p></article>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Crear proyecto</h2>
              <div className="timeline-label">Base nueva para seguir editando</div>
            </div>
            <div className="timeline-edit-row advanced-row">
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del proyecto" />
              <select className="input" value={format} onChange={(event) => setFormat(event.target.value as ProjectFormat)}>
                {FORMATS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <div className="input input-readonly">Formato inicial</div>
              <button className="btn btn-primary" onClick={handleCreate}>Crear</button>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Lista de proyectos</h2>
              <div className="timeline-label">{projects.length} proyecto(s)</div>
            </div>
            <div className="project-list">
              {projects.length === 0 ? <div className="empty">No hay proyectos locales todavía.</div> : null}
              {projects.map((project) => (
                <div key={project.id} className="project-item" style={{ display: 'grid', gap: 12 }}>
                  <div className="row-head">
                    <div>
                      <strong>{project.name}</strong>
                      <div className="timeline-label">{project.format} · {project.clips.length} clips · {new Date(project.updatedAt).toLocaleString()}</div>
                    </div>
                    <div className="action-row">
                      <button className="btn" onClick={() => startRename(project)}>Renombrar</button>
                      <button className="btn" onClick={() => handleDuplicate(project.id)}>Duplicar</button>
                      <button className="btn" onClick={() => handleDelete(project.id)}>Borrar</button>
                    </div>
                  </div>
                  {editingId === project.id ? (
                    <div className="timeline-edit-row advanced-row">
                      <input className="input" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                      <div className="input input-readonly">{project.format}</div>
                      <div className="input input-readonly">{project.clips.length} clips</div>
                      <button className="btn btn-primary" onClick={() => saveRename(project.id)}>Guardar nombre</button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
