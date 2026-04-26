'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import { createProjectSnapshot, readProjectSnapshots, restoreProjectFromSnapshot, writeProjectSnapshots, type ProjectSnapshot } from '@/lib/local-snapshots'

export default function StudioSnapshotsPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [snapshotName, setSnapshotName] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveId(nextProjects[0]?.id ?? null)
    setSnapshots(readProjectSnapshots())
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])
  const activeSnapshots = useMemo(
    () => snapshots.filter((snapshot) => snapshot.projectId === activeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [snapshots, activeId],
  )

  function persistProjects(nextProjects: LocalProject[], nextStatus: string) {
    setProjects(nextProjects)
    writeLocalProjects(nextProjects)
    setStatus(nextStatus)
  }

  function persistSnapshots(nextSnapshots: ProjectSnapshot[], nextStatus: string) {
    setSnapshots(nextSnapshots)
    writeProjectSnapshots(nextSnapshots)
    setStatus(nextStatus)
  }

  function saveSnapshot() {
    if (!active) return
    const snapshot = createProjectSnapshot(active, snapshotName || `${active.name} ${new Date().toLocaleString()}`)
    const next = [snapshot, ...snapshots]
    persistSnapshots(next, `Snapshot guardado: ${snapshot.name}`)
    setSnapshotName('')
  }

  function restoreSnapshot(snapshotId: string) {
    if (!active) return
    const snapshot = snapshots.find((item) => item.id === snapshotId)
    if (!snapshot) return
    const restored = restoreProjectFromSnapshot(snapshot)
    const nextProjects = projects.map((project) => project.id === active.id ? touchProject(restored) : project)
    persistProjects(nextProjects, `Proyecto restaurado desde snapshot: ${snapshot.name}`)
  }

  function duplicateFromSnapshot(snapshotId: string) {
    const snapshot = snapshots.find((item) => item.id === snapshotId)
    if (!snapshot) return
    const restored = restoreProjectFromSnapshot(snapshot)
    const duplicate: LocalProject = {
      ...restored,
      id: crypto.randomUUID(),
      name: `${restored.name} copia snapshot`,
      updatedAt: new Date().toISOString(),
      clips: restored.clips.map((clip) => ({ ...clip, id: crypto.randomUUID() })),
    }
    const nextProjects = [duplicate, ...projects]
    persistProjects(nextProjects, `Proyecto duplicado desde snapshot: ${snapshot.name}`)
  }

  function deleteSnapshot(snapshotId: string) {
    const next = snapshots.filter((item) => item.id !== snapshotId)
    persistSnapshots(next, 'Snapshot eliminado')
  }

  const coverage = useMemo(() => {
    if (!active) return null
    return {
      clips: active.clips.length,
      snapshots: activeSnapshots.length,
      duration: active.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0),
    }
  }, [active, activeSnapshots])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Snapshots</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/compare" className="nav-link">Comparar</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Versiones locales del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Guarda estados antes de tocar cosas grandes.</h1>
            <p className="sub">
              Esta zona te deja crear snapshots del proyecto activo para restaurar o duplicar estados anteriores sin depender del backup global completo.
            </p>
            <div className="action-row">
              <Link href="/studio/projects" className="btn btn-primary">Abrir proyectos</Link>
              <Link href="/studio/compare" className="btn">Abrir comparar</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Crea snapshots antes de cambios de pacing, batch o texto masivo.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto activo</h2>
                <div className="timeline-label">Base de snapshots</div>
              </div>
              <div className="form">
                <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <input className="input" value={snapshotName} onChange={(event) => setSnapshotName(event.target.value)} placeholder="Nombre del snapshot" />
                <button className="btn btn-primary" onClick={saveSnapshot} disabled={!active}>Guardar snapshot</button>
              </div>
              {coverage ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{coverage.clips}</strong></p></article>
                  <article className="panel card"><h3>Snapshots</h3><p><strong>{coverage.snapshots}</strong></p></article>
                  <article className="panel card"><h3>Duración</h3><p><strong>{coverage.duration.toFixed(1)} s</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Cuándo usar snapshots</h2>
                <div className="timeline-label">Flujo recomendado</div>
              </div>
              <div className="project-list">
                <div className="project-item"><strong>Antes de batch</strong><div className="timeline-label">Guarda un estado antes de aplicar cambios globales.</div></div>
                <div className="project-item"><strong>Antes de pacing</strong><div className="timeline-label">Conserva una versión previa al rebalanceo de duraciones.</div></div>
                <div className="project-item"><strong>Antes de text tools</strong><div className="timeline-label">Protege el copy original antes de reemplazos masivos.</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Snapshots del proyecto</h2>
              <div className="timeline-label">{activeSnapshots.length} snapshot(s)</div>
            </div>
            <div className="project-list">
              {activeSnapshots.length === 0 ? <div className="empty">Este proyecto aún no tiene snapshots.</div> : null}
              {activeSnapshots.map((snapshot) => (
                <div key={snapshot.id} className="project-item" style={{ display: 'grid', gap: 10 }}>
                  <div className="row-head">
                    <div>
                      <strong>{snapshot.name}</strong>
                      <div className="timeline-label">{new Date(snapshot.createdAt).toLocaleString()} · {snapshot.project.clips.length} clips</div>
                    </div>
                  </div>
                  <div className="action-row">
                    <button className="btn btn-primary" onClick={() => restoreSnapshot(snapshot.id)}>Restaurar sobre proyecto</button>
                    <button className="btn" onClick={() => duplicateFromSnapshot(snapshot.id)}>Duplicar como proyecto</button>
                    <button className="btn" onClick={() => deleteSnapshot(snapshot.id)}>Borrar snapshot</button>
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
