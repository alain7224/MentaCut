'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createProjectSnapshot, readProjectSnapshots, writeProjectSnapshots, type ProjectSnapshot } from '@/lib/local-project-snapshots'
import { readLocalProjects, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioSnapshotsPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setSnapshots(readProjectSnapshots())
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const projectSnapshots = useMemo(() => snapshots.filter((item) => item.projectId === activeProjectId), [snapshots, activeProjectId])

  function persist(nextSnapshots: ProjectSnapshot[], nextStatus: string) {
    setSnapshots(nextSnapshots)
    writeProjectSnapshots(nextSnapshots)
    setStatus(nextStatus)
  }

  function createSnapshotNow() {
    if (!activeProject) return
    persist([createProjectSnapshot(activeProject, note || 'Versión manual'), ...snapshots], 'Snapshot creado')
    setNote('')
  }

  function restoreSnapshot(snapshot: ProjectSnapshot) {
    const updatedProjects = projects.map((project) => project.id === snapshot.projectId ? snapshot.project : project)
    setProjects(updatedProjects)
    writeLocalProjects(updatedProjects)
    setStatus(`Snapshot restaurado: ${snapshot.note || snapshot.createdAt}`)
  }

  function deleteSnapshot(snapshotId: string) {
    persist(snapshots.filter((item) => item.id !== snapshotId), 'Snapshot eliminado')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Snapshots</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/history" className="nav-link">History</Link>
          <Link href="/studio/export-bundle" className="nav-link">Export bundle</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Snapshots / versiones del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Guarda versiones antes de cambios grandes.</h1>
            <p className="sub">Esta zona crea copias del estado del proyecto para restaurarlas después si algo sale mal o si quieres comparar versiones.</p>
            <div className="action-row">
              <Link href="/studio/history" className="btn btn-primary">Abrir history</Link>
              <Link href="/studio/export-bundle" className="btn">Abrir export bundle</Link>
              <button className="btn" onClick={createSnapshotNow} disabled={!activeProject}>Crear snapshot</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y guarda versiones manuales.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base del snapshot</div></div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota de la versión" />
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Resumen</h2><div className="timeline-label">Versiones guardadas</div></div>
              <div className="cards">
                <article className="panel card"><h3>Snapshots</h3><p><strong>{projectSnapshots.length}</strong></p></article>
                <article className="panel card"><h3>Proyecto</h3><p><strong>{activeProject?.name ?? '—'}</strong></p></article>
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Snapshots del proyecto</h2><div className="timeline-label">{projectSnapshots.length} versión(es)</div></div>
            <div className="project-list">
              {projectSnapshots.length === 0 ? <div className="empty">Todavía no hay snapshots para este proyecto.</div> : null}
              {projectSnapshots.map((snapshot) => (
                <div key={snapshot.id} className="project-item">
                  <strong>{snapshot.note || 'Sin nota'}</strong>
                  <div className="timeline-label">{snapshot.createdAt}</div>
                  <div className="timeline-label">Clips: {snapshot.project.clips.length}</div>
                  <div className="action-row">
                    <button className="btn btn-primary" onClick={() => restoreSnapshot(snapshot)}>Restaurar</button>
                    <button className="btn" onClick={() => deleteSnapshot(snapshot.id)}>Borrar</button>
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
