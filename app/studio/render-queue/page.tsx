'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createRenderQueueItem, readRenderQueue, upsertRenderQueueItem, writeRenderQueue, type RenderQueueItem, type RenderQueueStatus, type RenderTarget } from '@/lib/local-render-queue'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioRenderQueuePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [queue, setQueue] = useState<RenderQueueItem[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setQueue(readRenderQueue())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  function persist(nextQueue: RenderQueueItem[], nextStatus: string) {
    setQueue(nextQueue)
    writeRenderQueue(nextQueue)
    setStatus(nextStatus)
  }

  function addToQueue() {
    if (!activeProject) return
    persist([createRenderQueueItem(activeProject.id, activeProject.name, activeProject.format), ...queue], `Proyecto añadido a cola: ${activeProject.name}`)
  }

  function updateItem(item: RenderQueueItem, patch: Partial<RenderQueueItem>, nextStatus: string) {
    persist(upsertRenderQueueItem(queue, { ...item, ...patch }), nextStatus)
  }

  const stats = useMemo(() => ({
    total: queue.length,
    queued: queue.filter((item) => item.status === 'queued').length,
    ready: queue.filter((item) => item.status === 'ready').length,
    exported: queue.filter((item) => item.status === 'exported').length,
  }), [queue])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Render Queue</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/publish" className="nav-link">Publish</Link>
          <Link href="/studio/export-bundle" className="nav-link">Export bundle</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Cola local de render / export</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Organiza qué proyecto sale después.</h1>
            <p className="sub">Esta zona sirve para planificar exportes pendientes por plataforma, resolución, fps y estado, aunque el render final aún se haga fuera.</p>
            <div className="action-row">
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)} style={{ minWidth: 280 }}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <button className="btn btn-primary" onClick={addToQueue} disabled={!activeProject}>Añadir a cola</button>
              <Link href="/studio/publish" className="btn">Abrir publish</Link>
            </div>
            <div className="timeline-label">{status || 'Añade proyectos y marca su estado de salida.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="cards">
            <article className="panel card"><h3>Total</h3><p><strong>{stats.total}</strong></p></article>
            <article className="panel card"><h3>Queued</h3><p><strong>{stats.queued}</strong></p></article>
            <article className="panel card"><h3>Ready</h3><p><strong>{stats.ready}</strong></p></article>
            <article className="panel card"><h3>Exported</h3><p><strong>{stats.exported}</strong></p></article>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Items de la cola</h2><div className="timeline-label">{queue.length} item(s)</div></div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {queue.length === 0 ? <div className="empty">No hay renders en cola todavía.</div> : null}
              {queue.map((item) => (
                <article key={item.id} className="panel card">
                  <div className="row-head"><h3>{item.projectName}</h3><div className="timeline-label">{item.format}</div></div>
                  <div className="form">
                    <select className="input" value={item.target} onChange={(event) => updateItem(item, { target: event.target.value as RenderTarget }, 'Target actualizado')}>
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram Reels">Instagram Reels</option>
                      <option value="YouTube Shorts">YouTube Shorts</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Generic">Generic</option>
                    </select>
                    <select className="input" value={item.resolution} onChange={(event) => updateItem(item, { resolution: event.target.value as RenderQueueItem['resolution'] }, 'Resolución actualizada')}>
                      <option value="1080p">1080p</option>
                      <option value="1440p">1440p</option>
                      <option value="2160p">2160p</option>
                    </select>
                    <select className="input" value={item.fps} onChange={(event) => updateItem(item, { fps: Number(event.target.value) as RenderQueueItem['fps'] }, 'FPS actualizado')}>
                      <option value={24}>24 fps</option>
                      <option value={25}>25 fps</option>
                      <option value={30}>30 fps</option>
                      <option value={60}>60 fps</option>
                    </select>
                    <select className="input" value={item.status} onChange={(event) => updateItem(item, { status: event.target.value as RenderQueueStatus }, 'Estado actualizado')}>
                      <option value="queued">Queued</option>
                      <option value="ready">Ready</option>
                      <option value="exported">Exported</option>
                    </select>
                    <textarea className="textarea" rows={3} value={item.notes} onChange={(event) => updateItem(item, { notes: event.target.value }, 'Notas de cola actualizadas')} placeholder="Notas del export" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
