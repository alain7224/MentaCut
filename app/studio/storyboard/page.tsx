'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export default function StudioStoryboardPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveId(next[0]?.id ?? null)
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])

  const totalDuration = useMemo(
    () => active?.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0) ?? 0,
    [active],
  )

  function persistProject(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function moveClip(index: number, direction: 'up' | 'down') {
    if (!active) return
    const target = direction === 'up' ? Math.max(0, index - 1) : Math.min(active.clips.length - 1, index + 1)
    if (target === index) return
    persistProject(
      active.id,
      (project) => ({
        ...project,
        clips: moveItem(project.clips, index, target),
      }),
      'Orden del storyboard actualizado',
    )
  }

  function updateClipText(clipId: string, field: 'headlineText' | 'captionText' | 'title', value: string) {
    if (!active) return
    persistProject(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => clip.id === clipId ? { ...clip, [field]: value } : clip),
      }),
      'Texto del clip actualizado',
    )
  }

  function duplicateClip(clipId: string) {
    if (!active) return
    const index = active.clips.findIndex((clip) => clip.id === clipId)
    if (index < 0) return
    const source = active.clips[index]
    const duplicate = {
      ...source,
      id: crypto.randomUUID(),
      title: `${source.title} copia`,
    }
    persistProject(
      active.id,
      (project) => ({
        ...project,
        clips: [...project.clips.slice(0, index + 1), duplicate, ...project.clips.slice(index + 1)],
      }),
      'Clip duplicado en storyboard',
    )
  }

  function removeClip(clipId: string) {
    if (!active) return
    persistProject(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.filter((clip) => clip.id !== clipId),
      }),
      'Clip eliminado del storyboard',
    )
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Storyboard</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/planner" className="nav-link">Planner</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Storyboard visual del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Ordena y retoca la historia fuera de la timeline.</h1>
            <p className="sub">
              Esta vista sirve para reorganizar clips, ajustar títulos, headlines y captions con una lectura más narrativa antes de volver al editor principal.
            </p>
            <div className="action-row">
              <Link href="/studio" className="btn btn-primary">Abrir estudio</Link>
              <Link href="/studio/planner" className="btn">Abrir planner</Link>
              <Link href="/studio/projects" className="btn">Abrir proyectos</Link>
            </div>
            <div className="timeline-label">{status || 'Usa storyboard para ordenar rápido la secuencia del contenido.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Seleccionar proyecto</h2>
                <div className="timeline-label">{projects.length} proyecto(s)</div>
              </div>
              <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              {active ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{active.clips.length}</strong></p></article>
                  <article className="panel card"><h3>Duración</h3><p><strong>{totalDuration.toFixed(1)} s</strong></p></article>
                  <article className="panel card"><h3>Formato</h3><p><strong>{active.format}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Cómo usar storyboard</h2>
                <div className="timeline-label">Flujo recomendado</div>
              </div>
              <div className="project-list">
                <div className="project-item"><strong>1. Ordena</strong><div className="timeline-label">Mueve clips arriba o abajo hasta tener una secuencia clara.</div></div>
                <div className="project-item"><strong>2. Refuerza el hook</strong><div className="timeline-label">Edita título, headline y caption sin entrar en la timeline.</div></div>
                <div className="project-item"><strong>3. Duplica o elimina</strong><div className="timeline-label">Prueba versiones rápidas del relato antes de editar fino.</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Tarjetas del storyboard</h2>
              <div className="timeline-label">{active?.clips.length ?? 0} clip(s)</div>
            </div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {active?.clips.length ? active.clips.map((clip, index) => (
                <article key={clip.id} className="panel card">
                  <div className="row-head">
                    <h3>#{index + 1} · {clip.title}</h3>
                    <div className="timeline-label">{clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</div>
                  </div>
                  <div className="form">
                    <input className="input" value={clip.title} onChange={(event) => updateClipText(clip.id, 'title', event.target.value)} placeholder="Título del clip" />
                    <input className="input" value={clip.headlineText} onChange={(event) => updateClipText(clip.id, 'headlineText', event.target.value)} placeholder="Headline" />
                    <textarea className="textarea" rows={3} value={clip.captionText} onChange={(event) => updateClipText(clip.id, 'captionText', event.target.value)} placeholder="Caption" />
                  </div>
                  <div className="action-row">
                    <button className="btn" onClick={() => moveClip(index, 'up')} disabled={index === 0}>Subir</button>
                    <button className="btn" onClick={() => moveClip(index, 'down')} disabled={index === active.clips.length - 1}>Bajar</button>
                    <button className="btn" onClick={() => duplicateClip(clip.id)}>Duplicar</button>
                    <button className="btn" onClick={() => removeClip(clip.id)}>Borrar</button>
                  </div>
                </article>
              )) : <div className="empty">No hay clips para mostrar en storyboard.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
