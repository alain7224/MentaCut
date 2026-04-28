'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getProjectHistoryBundle, moveProjectHistoryCursor, pushProjectHistoryState, readProjectHistoryBundles, writeProjectHistoryBundles, type ProjectHistoryBundle } from '@/lib/local-project-history'
import { readLocalProjects, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioHistoryPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [bundles, setBundles] = useState<ProjectHistoryBundle[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setBundles(readProjectHistoryBundles())
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const bundle = useMemo(() => activeProjectId ? getProjectHistoryBundle(bundles, activeProjectId) : null, [bundles, activeProjectId])
  const currentState = useMemo(() => bundle?.states[bundle.cursor] ?? null, [bundle])

  function persistBundles(next: ProjectHistoryBundle[], nextStatus: string) {
    setBundles(next)
    writeProjectHistoryBundles(next)
    setStatus(nextStatus)
  }

  function captureState() {
    if (!activeProject) return
    const next = pushProjectHistoryState(bundles, activeProject, note || 'Snapshot manual')
    persistBundles(next, 'Estado guardado en historial')
    setNote('')
  }

  function restoreFromHistory(direction: 'undo' | 'redo') {
    if (!activeProjectId) return
    const moved = moveProjectHistoryCursor(bundles, activeProjectId, direction)
    const movedBundle = getProjectHistoryBundle(moved, activeProjectId)
    const snapshot = movedBundle?.states[movedBundle.cursor]?.project
    if (!snapshot) return
    const updatedProjects = projects.map((project) => project.id === activeProjectId ? snapshot : project)
    setProjects(updatedProjects)
    writeLocalProjects(updatedProjects)
    persistBundles(moved, direction === 'undo' ? 'Undo aplicado' : 'Redo aplicado')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut History</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/snapshots" className="nav-link">Snapshots</Link>
          <Link href="/studio/player" className="nav-link">Player</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Historial undo / redo</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Guarda estados y vuelve atrás.</h1>
            <p className="sub">Esta zona conserva estados del proyecto y permite restaurar uno anterior o avanzar otra vez si ya existe historial.</p>
            <div className="action-row">
              <Link href="/studio/snapshots" className="btn btn-primary">Abrir snapshots</Link>
              <Link href="/studio/player" className="btn">Abrir player</Link>
              <button className="btn" onClick={() => restoreFromHistory('undo')} disabled={!bundle || bundle.cursor <= 0}>Undo</button>
              <button className="btn" onClick={() => restoreFromHistory('redo')} disabled={!bundle || bundle.cursor >= bundle.states.length - 1}>Redo</button>
            </div>
            <div className="timeline-label">{status || 'Guarda estados antes de cambios fuertes para poder volver atrás.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base del historial</div></div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota del estado" />
                <button className="btn btn-primary" onClick={captureState} disabled={!activeProject}>Guardar estado</button>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Estados</h3><p><strong>{bundle?.states.length ?? 0}</strong></p></article>
                <article className="panel card"><h3>Cursor</h3><p><strong>{bundle ? bundle.cursor + 1 : 0}</strong></p></article>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Estado actual</h2><div className="timeline-label">Historial seleccionado</div></div>
              {currentState ? (
                <div className="project-list">
                  <div className="project-item"><strong>{currentState.note || 'Sin nota'}</strong><div className="timeline-label">{currentState.createdAt}</div></div>
                </div>
              ) : <div className="empty">Todavía no hay estados guardados.</div>}
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Historial del proyecto</h2><div className="timeline-label">{bundle?.states.length ?? 0} estado(s)</div></div>
            <div className="project-list">
              {bundle?.states.length ? bundle.states.map((state, index) => (
                <div key={state.id} className="project-item" style={{ outline: bundle.cursor === index ? '1px solid rgba(255,255,255,.22)' : 'none' }}>
                  <strong>{index + 1}. {state.note || 'Sin nota'}</strong>
                  <div className="timeline-label">{state.createdAt}</div>
                  <div className="timeline-label">Clips: {state.project.clips.length}</div>
                </div>
              )) : <div className="empty">No hay historial para este proyecto.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
