'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { archiveProject, isProjectArchived, readArchivedProjects, restoreProject, writeArchivedProjects, type ArchivedProjectEntry } from '@/lib/local-project-archive'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioArchivePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [archived, setArchived] = useState<ArchivedProjectEntry[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setProjects(readLocalProjects())
    setArchived(readArchivedProjects())
  }, [])

  const visibleProjects = useMemo(
    () => projects.filter((project) => showArchived ? isProjectArchived(archived, project.id) : !isProjectArchived(archived, project.id)),
    [projects, archived, showArchived],
  )

  function persist(next: ArchivedProjectEntry[], nextStatus: string) {
    setArchived(next)
    writeArchivedProjects(next)
    setStatus(nextStatus)
  }

  function handleArchive(projectId: string, projectName: string) {
    persist(archiveProject(archived, projectId), `Proyecto archivado: ${projectName}`)
  }

  function handleRestore(projectId: string, projectName: string) {
    persist(restoreProject(archived, projectId), `Proyecto restaurado: ${projectName}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Archive</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/tags" className="nav-link">Tags</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Archivo local de proyectos</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Esconde proyectos viejos sin borrarlos.</h1>
            <p className="sub">Esta zona te deja archivar y restaurar proyectos locales para mantener el espacio de trabajo más limpio.</p>
            <div className="action-row">
              <button className="btn btn-primary" onClick={() => setShowArchived(false)}>Ver activos</button>
              <button className="btn" onClick={() => setShowArchived(true)}>Ver archivados</button>
              <Link href="/studio/projects" className="btn">Abrir proyectos</Link>
            </div>
            <div className="timeline-label">{status || 'Alterna entre proyectos activos y archivados.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">{showArchived ? 'Proyectos archivados' : 'Proyectos activos'}</h2><div className="timeline-label">{visibleProjects.length} proyecto(s)</div></div>
            <div className="project-list">
              {visibleProjects.length === 0 ? <div className="empty">No hay proyectos en esta vista.</div> : null}
              {visibleProjects.map((project) => (
                <div key={project.id} className="project-item">
                  <strong>{project.name}</strong>
                  <div className="timeline-label">{project.format} · {project.clips.length} clips</div>
                  <div className="action-row">
                    {showArchived ? (
                      <button className="btn btn-primary" onClick={() => handleRestore(project.id, project.name)}>Restaurar</button>
                    ) : (
                      <button className="btn" onClick={() => handleArchive(project.id, project.name)}>Archivar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
