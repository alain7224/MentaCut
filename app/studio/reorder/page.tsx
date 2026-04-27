'use client'

import Link from 'next/link'
import { DragEvent, useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

function rebaseSequential(project: LocalProject): LocalProject {
  let cursor = 0
  return {
    ...project,
    clips: project.clips.map((clip) => {
      const duration = Math.max(0.1, clip.end - clip.start)
      const next = { ...clip, start: Number(cursor.toFixed(3)), end: Number((cursor + duration).toFixed(3)) }
      cursor = next.end
      return next
    }),
  }
}

function moveClip(project: LocalProject, sourceId: string, targetId: string): LocalProject {
  const from = project.clips.findIndex((clip) => clip.id === sourceId)
  const to = project.clips.findIndex((clip) => clip.id === targetId)
  if (from < 0 || to < 0 || from === to) return project
  const clips = [...project.clips]
  const [item] = clips.splice(from, 1)
  clips.splice(to, 0, item)
  return rebaseSequential({ ...project, clips })
}

export default function StudioReorderPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  function persist(updatedProject: LocalProject, nextStatus: string) {
    const updated = projects.map((project) => project.id === updatedProject.id ? touchProject(updatedProject) : project)
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function handleDrop(targetId: string) {
    if (!activeProject || !draggedClipId) return
    persist(moveClip(activeProject, draggedClipId, targetId), 'Orden de clips actualizado')
    setDraggedClipId(null)
  }

  function moveByButtons(clipId: string, direction: 'up' | 'down') {
    if (!activeProject) return
    const index = activeProject.clips.findIndex((clip) => clip.id === clipId)
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || targetIndex < 0 || targetIndex >= activeProject.clips.length) return
    const targetId = activeProject.clips[targetIndex].id
    persist(moveClip(activeProject, clipId, targetId), 'Orden actualizado con botones')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Reorder</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio/player" className="nav-link">Player</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Reordenado real drag & drop</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Mueve clips con arrastre.</h1>
            <p className="sub">Esta zona te deja reordenar clips arrastrándolos en la lista y recalcula la timeline manteniendo duraciones.</p>
            <div className="action-row">
              <Link href="/studio/storyboard" className="btn btn-primary">Abrir storyboard</Link>
              <Link href="/studio/player" className="btn">Abrir player</Link>
            </div>
            <div className="timeline-label">{status || 'Arrastra un clip y suéltalo sobre otro para cambiar el orden.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Reordenado</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Clips del proyecto</h2><div className="timeline-label">{activeProject?.clips.length ?? 0} clip(s)</div></div>
            <div className="project-list">
              {activeProject?.clips.length ? activeProject.clips.map((clip, index) => (
                <div
                  key={clip.id}
                  className="project-item"
                  draggable
                  onDragStart={() => setDraggedClipId(clip.id)}
                  onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
                  onDrop={() => handleDrop(clip.id)}
                  style={{ cursor: 'grab' }}
                >
                  <strong>#{index + 1} · {clip.title}</strong>
                  <div className="timeline-label">{clip.start.toFixed(3)}s → {clip.end.toFixed(3)}s</div>
                  <div className="action-row">
                    <button className="btn" onClick={() => moveByButtons(clip.id, 'up')} disabled={index === 0}>Subir</button>
                    <button className="btn" onClick={() => moveByButtons(clip.id, 'down')} disabled={index === activeProject.clips.length - 1}>Bajar</button>
                  </div>
                </div>
              )) : <div className="empty">No hay clips para reordenar.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
