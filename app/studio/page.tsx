'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createProject, readLocalProjects, type LocalProject, writeLocalProjects } from '@/lib/local-store'

export default function StudioPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [name, setName] = useState('Proyecto MentaCut')
  const [format, setFormat] = useState<LocalProject['format']>('9:16')
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const initial = readLocalProjects()
    setProjects(initial)
    setActiveId(initial[0]?.id ?? null)
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])

  function createLocalProject() {
    const next = createProject(name.trim() || 'Proyecto MentaCut', format)
    const updated = [next, ...projects]
    setProjects(updated)
    setActiveId(next.id)
    writeLocalProjects(updated)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Studio</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <button className="btn btn-primary" onClick={createLocalProject}>Crear proyecto local</button>
        </nav>
      </header>

      <main className="main studio-layout">
        <aside className="panel sidebar">
          <h2 className="section-title">Nuevo proyecto</h2>
          <div className="form">
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del proyecto" />
            <select className="input" value={format} onChange={(event) => setFormat(event.target.value as LocalProject['format'])}>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
              <option value="4:5">4:5</option>
              <option value="16:9">16:9</option>
            </select>
            <button className="btn btn-primary" onClick={createLocalProject}>Guardar en navegador</button>
          </div>

          <div className="project-list">
            {projects.length === 0 ? <div className="empty">Aún no hay proyectos locales.</div> : null}
            {projects.map((project) => (
              <button key={project.id} className={`project-item ${project.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(project.id)}>
                <strong>{project.name}</strong>
                <div className="timeline-label">{project.format} · {project.clips.length} clips</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="studio-main">
          <div className="panel toolbar">
            <div>
              <div className="eyebrow">Base local-first</div>
              <h1 className="section-title">{active?.name ?? 'Sin proyecto activo'}</h1>
            </div>
          </div>

          <div className="panel stage">
            <div className="stage-preview" />
            <div className="kv">
              <div className="panel metric"><div className="eyebrow">Formato</div><strong>{active?.format ?? '—'}</strong></div>
              <div className="panel metric"><div className="eyebrow">Clips locales</div><strong>{active?.clips.length ?? 0}</strong></div>
            </div>
          </div>

          <div className="panel timeline">
            <h2 className="section-title">Timeline inicial</h2>
            {(active?.clips ?? []).map((clip) => (
              <div key={clip.id} className="timeline-row">
                <div className="timeline-label">{clip.title} · {clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</div>
                <div className="timeline-bar"><span style={{ left: `${clip.start * 4}%`, width: `${Math.max((clip.end - clip.start) * 4, 12)}%` }} /></div>
              </div>
            ))}
            {!active ? <div className="empty">Crea un proyecto local para empezar.</div> : null}
          </div>
        </section>
      </main>
    </div>
  )
}
