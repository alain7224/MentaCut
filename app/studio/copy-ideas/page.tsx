'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { buildCopyIdeas } from '@/lib/copy-ideas'
import { readProjectBriefs, type ProjectBrief } from '@/lib/local-project-briefs'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioCopyIdeasPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [briefs, setBriefs] = useState<ProjectBrief[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setBriefs(readProjectBriefs())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeBrief = useMemo(() => briefs.find((item) => item.projectId === activeProjectId) ?? null, [briefs, activeProjectId])
  const ideas = useMemo(() => activeProject ? buildCopyIdeas(activeProject, activeBrief) : { hooks: [], ctas: [], captions: [] }, [activeProject, activeBrief])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Copy Ideas</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/brief" className="nav-link">Brief</Link>
          <Link href="/studio/text-tools" className="nav-link">Text tools</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Ideas de copy desde el brief</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Saca hooks, captions y CTA base.</h1>
            <p className="sub">Esta zona toma el brief del proyecto y propone textos base para abrir, desarrollar y cerrar mejor el video.</p>
            <div className="action-row">
              <Link href="/studio/brief" className="btn btn-primary">Abrir brief</Link>
              <Link href="/studio/text-tools" className="btn">Abrir text tools</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base de ideas</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Hooks</h2><div className="timeline-label">Arranque</div></div>
              <div className="project-list">
                {ideas.hooks.length ? ideas.hooks.map((item, index) => <div key={`${item}-${index}`} className="project-item"><strong>Hook {index + 1}</strong><div className="timeline-label">{item}</div></div>) : <div className="empty">Faltan datos en el brief para generar hooks.</div>}
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">CTA</h2><div className="timeline-label">Cierre</div></div>
              <div className="project-list">
                {ideas.ctas.length ? ideas.ctas.map((item, index) => <div key={`${item}-${index}`} className="project-item"><strong>CTA {index + 1}</strong><div className="timeline-label">{item}</div></div>) : <div className="empty">Faltan datos en el brief para generar CTA.</div>}
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Captions sugeridas</h2><div className="timeline-label">Desarrollo</div></div>
            <div className="project-list">
              {ideas.captions.length ? ideas.captions.map((item, index) => <div key={`${item}-${index}`} className="project-item"><strong>Caption {index + 1}</strong><div className="timeline-label">{item}</div></div>) : <div className="empty">Faltan datos en el brief para generar captions.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
