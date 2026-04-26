'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createDefaultProjectBrief, readProjectBriefs, upsertProjectBrief, writeProjectBriefs, type ProjectBrief } from '@/lib/local-project-briefs'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioBriefPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [briefs, setBriefs] = useState<ProjectBrief[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setBriefs(readProjectBriefs())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeBrief = useMemo(() => {
    if (!activeProject) return null
    return briefs.find((item) => item.projectId === activeProject.id) ?? createDefaultProjectBrief(activeProject.id)
  }, [briefs, activeProject])

  function updateBrief(patch: Partial<ProjectBrief>, nextStatus: string) {
    if (!activeBrief) return
    const next = upsertProjectBrief(briefs, { ...activeBrief, ...patch })
    setBriefs(next)
    writeProjectBriefs(next)
    setStatus(nextStatus)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Brief</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/publish" className="nav-link">Publish</Link>
          <Link href="/studio/roles" className="nav-link">Roles</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Brief creativo del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Define para quién y para qué existe el vídeo.</h1>
            <p className="sub">
              Esta zona guarda el brief creativo del proyecto para alinear gancho, tono, CTA y dirección narrativa antes de seguir editando.
            </p>
            <div className="action-row">
              <Link href="/studio/publish" className="btn btn-primary">Abrir publish</Link>
              <Link href="/studio/roles" className="btn">Abrir roles</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y rellena su brief creativo.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Datos del brief</h2>
              <div className="timeline-label">Proyecto activo</div>
            </div>
            {activeBrief ? (
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <input className="input" value={activeBrief.audience} onChange={(event) => updateBrief({ audience: event.target.value }, 'Audiencia actualizada')} placeholder="Audiencia objetivo" />
                <input className="input" value={activeBrief.platform} onChange={(event) => updateBrief({ platform: event.target.value }, 'Plataforma actualizada')} placeholder="Plataforma" />
                <input className="input" value={activeBrief.objective} onChange={(event) => updateBrief({ objective: event.target.value }, 'Objetivo actualizado')} placeholder="Objetivo principal del vídeo" />
                <input className="input" value={activeBrief.offer} onChange={(event) => updateBrief({ offer: event.target.value }, 'Oferta actualizada')} placeholder="Oferta o promesa" />
                <input className="input" value={activeBrief.cta} onChange={(event) => updateBrief({ cta: event.target.value }, 'CTA actualizado')} placeholder="Llamada a la acción" />
                <input className="input" value={activeBrief.voice} onChange={(event) => updateBrief({ voice: event.target.value }, 'Tono actualizado')} placeholder="Voz / tono" />
                <textarea className="textarea" rows={8} value={activeBrief.notes} onChange={(event) => updateBrief({ notes: event.target.value }, 'Notas actualizadas')} placeholder="Notas estratégicas, ideas, ganchos, objeciones o referencias" />
              </div>
            ) : <div className="empty">No hay proyecto seleccionado.</div>}
          </div>
        </section>
      </main>
    </div>
  )
}
