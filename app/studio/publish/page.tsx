'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readProjectAudioMixes, type ProjectAudioMix } from '@/lib/local-audio-mix'
import { readClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readTransitionPlans, type ClipTransitionPlan } from '@/lib/local-transitions'
import { evaluateProjectPublishReadiness } from '@/lib/publish-readiness'

export default function StudioPublishPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
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
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeAudioMix = useMemo(() => audioMixes.find((item) => item.projectId === activeProjectId) ?? null, [audioMixes, activeProjectId])

  const report = useMemo(() => {
    if (!activeProject) return null
    return evaluateProjectPublishReadiness({
      project: activeProject,
      roles,
      transitions,
      audioMix: activeAudioMix,
    })
  }, [activeProject, roles, transitions, activeAudioMix])

  const stateLabel = useMemo(() => {
    if (!report) return 'Sin proyecto'
    if (report.state === 'ready') return 'Listo para salir'
    if (report.state === 'nearly-ready') return 'Casi listo'
    return 'En borrador'
  }, [report])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Publish</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/roles" className="nav-link">Roles</Link>
          <Link href="/studio/subtitles" className="nav-link">Subtitles</Link>
          <Link href="/studio/audio-mix" className="nav-link">Audio mix</Link>
          <Link href="/studio/transitions" className="nav-link">Transitions</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Publish readiness del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Mide si ya está listo para salir.</h1>
            <p className="sub">
              Esta zona cruza estructura, copy, roles, subtítulos, transiciones, audio y continuidad temporal para darte una lectura más real del estado del proyecto antes de publicarlo.
            </p>
            <div className="action-row">
              <Link href="/studio/roles" className="btn btn-primary">Abrir roles</Link>
              <Link href="/studio/subtitles" className="btn">Abrir subtitles</Link>
              <Link href="/studio/audio-mix" className="btn">Abrir audio mix</Link>
              <Link href="/studio/timeline-repair" className="btn">Reparar timeline</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto activo</h2>
                <div className="timeline-label">Chequeo de salida</div>
              </div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              {report ? (
                <div className="cards">
                  <article className="panel card"><h3>Puntuación</h3><p><strong>{report.score}/100</strong></p></article>
                  <article className="panel card"><h3>Estado</h3><p><strong>{stateLabel}</strong></p></article>
                  <article className="panel card"><h3>Checks OK</h3><p><strong>{report.checks.filter((item) => item.passed).length}</strong></p></article>
                  <article className="panel card"><h3>Checks pendientes</h3><p><strong>{report.checks.filter((item) => !item.passed).length}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Interpretación rápida</h2>
                <div className="timeline-label">Lectura del score</div>
              </div>
              <div className="project-list">
                <div className="project-item"><strong>80–100</strong><div className="timeline-label">Proyecto bastante sólido para preparar salida.</div></div>
                <div className="project-item"><strong>55–79</strong><div className="timeline-label">El proyecto ya tiene base, pero aún le faltan bloques importantes.</div></div>
                <div className="project-item"><strong>0–54</strong><div className="timeline-label">Todavía está en borrador y conviene reforzarlo antes de publicar.</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Checks del proyecto</h2>
                <div className="timeline-label">Bloque por bloque</div>
              </div>
              <div className="project-list">
                {report?.checks.length ? report.checks.map((check) => (
                  <div key={check.key} className="project-item">
                    <strong>{check.passed ? 'OK' : 'Pendiente'} · {check.label}</strong>
                    <div className="timeline-label">Peso: {check.weight}</div>
                    <div className="timeline-label">{check.detail}</div>
                  </div>
                )) : <div className="empty">No hay checks para mostrar.</div>}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Recomendaciones</h2>
                <div className="timeline-label">Qué compensa arreglar ahora</div>
              </div>
              <div className="project-list">
                {report?.recommendations.length ? report.recommendations.map((item, index) => (
                  <div key={`${item}-${index}`} className="project-item">
                    <strong>Paso {index + 1}</strong>
                    <div className="timeline-label">{item}</div>
                  </div>
                )) : <div className="empty">No hay recomendaciones pendientes en este proyecto.</div>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
