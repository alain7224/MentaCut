'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readProjectAudioMixes, type ProjectAudioMix } from '@/lib/local-audio-mix'
import { readClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readTransitionPlans, type ClipTransitionPlan } from '@/lib/local-transitions'
import { evaluateFinalPass } from '@/lib/final-pass'

export default function StudioFinalPassPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [transitions, setTransitions] = useState<ClipTransitionPlan[]>([])
  const [audioMixes, setAudioMixes] = useState<ProjectAudioMix[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setRoles(readClipRoles())
    setTransitions(readTransitionPlans())
    setAudioMixes(readProjectAudioMixes())
    void listLocalMedia().then(setLibrary).catch(() => setLibrary([]))
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const projectRoles = useMemo(() => roles.filter((item) => item.projectId === activeProjectId), [roles, activeProjectId])
  const projectTransitions = useMemo(() => transitions.filter((item) => item.projectId === activeProjectId), [transitions, activeProjectId])
  const activeAudioMix = useMemo(() => audioMixes.find((item) => item.projectId === activeProjectId) ?? null, [audioMixes, activeProjectId])

  const result = useMemo(() => {
    if (!activeProject) return null
    return evaluateFinalPass({
      project: activeProject,
      mediaLibrary: library,
      roles: projectRoles,
      transitions: projectTransitions,
      audioMix: activeAudioMix,
    })
  }, [activeProject, library, projectRoles, projectTransitions, activeAudioMix])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Final Pass</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/pipeline-manifest" className="nav-link">Pipeline manifest</Link>
          <Link href="/studio/render-recipe" className="nav-link">Render recipe</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Chequeo final del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Valida el proyecto antes de sacarlo.</h1>
            <p className="sub">Esta zona hace un pase final y te dice si el proyecto está bloqueado o listo, combinando dependencias y publish readiness.</p>
            <div className="action-row">
              <Link href="/studio/pipeline-manifest" className="btn btn-primary">Abrir pipeline manifest</Link>
              <Link href="/studio/render-recipe" className="btn">Abrir render recipe</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Pase final</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              {result ? (
                <div className="cards">
                  <article className="panel card"><h3>Estado</h3><p><strong>{result.passed ? 'OK' : 'Bloqueado'}</strong></p></article>
                  <article className="panel card"><h3>Readiness</h3><p><strong>{result.readinessScore}/100</strong></p></article>
                  <article className="panel card"><h3>State</h3><p><strong>{result.readinessState}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Resumen</h2><div className="timeline-label">Bloqueos y avisos</div></div>
              {result ? (
                <div className="project-list">
                  <div className="project-item"><strong>Bloqueos</strong><div className="timeline-label">{result.blocking.length}</div></div>
                  <div className="project-item"><strong>Avisos</strong><div className="timeline-label">{result.warnings.length}</div></div>
                </div>
              ) : <div className="empty">No hay resumen todavía.</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Bloqueos</h2><div className="timeline-label">Imprescindibles</div></div>
              <div className="project-list">
                {!result?.blocking.length ? <div className="empty">No hay bloqueos duros.</div> : null}
                {result?.blocking.map((item, index) => (
                  <div key={index} className="project-item"><div className="timeline-label">{item}</div></div>
                ))}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Avisos</h2><div className="timeline-label">Mejoras recomendadas</div></div>
              <div className="project-list">
                {!result?.warnings.length ? <div className="empty">No hay avisos adicionales.</div> : null}
                {result?.warnings.map((item, index) => (
                  <div key={index} className="project-item"><div className="timeline-label">{item}</div></div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
