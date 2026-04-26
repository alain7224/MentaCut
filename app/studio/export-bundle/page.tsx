'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readProjectAudioMixes, type ProjectAudioMix } from '@/lib/local-audio-mix'
import { readClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readProjectSubtitleStyles, type ProjectSubtitleStyle } from '@/lib/local-subtitle-style'
import { readTransitionPlans, type ClipTransitionPlan } from '@/lib/local-transitions'
import { buildPublishBundle } from '@/lib/publish-bundle'

export default function StudioExportBundlePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [transitions, setTransitions] = useState<ClipTransitionPlan[]>([])
  const [audioMixes, setAudioMixes] = useState<ProjectAudioMix[]>([])
  const [subtitleStyles, setSubtitleStyles] = useState<ProjectSubtitleStyle[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setRoles(readClipRoles())
    setTransitions(readTransitionPlans())
    setAudioMixes(readProjectAudioMixes())
    setSubtitleStyles(readProjectSubtitleStyles())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeAudioMix = useMemo(() => audioMixes.find((item) => item.projectId === activeProjectId) ?? null, [audioMixes, activeProjectId])
  const activeSubtitleStyle = useMemo(() => subtitleStyles.find((item) => item.projectId === activeProjectId) ?? null, [subtitleStyles, activeProjectId])

  const bundle = useMemo(() => {
    if (!activeProject) return null
    return buildPublishBundle({
      project: activeProject,
      roles,
      transitions,
      audioMix: activeAudioMix,
      subtitleStyle: activeSubtitleStyle,
    })
  }, [activeProject, roles, transitions, activeAudioMix, activeSubtitleStyle])

  function exportBundle() {
    if (!bundle) return
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${bundle.project.name.replace(/\s+/g, '-').toLowerCase()}-publish-bundle.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Bundle de publicación exportado en JSON')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Export Bundle</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/publish" className="nav-link">Publish</Link>
          <Link href="/studio/subtitle-style" className="nav-link">Subtitle style</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Paquete de publicación del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Saca un bundle con todo lo importante.</h1>
            <p className="sub">
              Esta zona exporta un JSON con proyecto, guion, subtítulos, roles, transiciones, mezcla, estilo de captions y readiness para mover el trabajo entre etapas.
            </p>
            <div className="action-row">
              <Link href="/studio/publish" className="btn btn-primary">Abrir publish</Link>
              <Link href="/studio/subtitle-style" className="btn">Abrir subtitle style</Link>
              <button className="btn" onClick={exportBundle} disabled={!bundle}>Exportar bundle</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y exporta su paquete de publicación.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto activo</h2>
                <div className="timeline-label">Bundle fuente</div>
              </div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              {bundle ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{bundle.stats.clips}</strong></p></article>
                  <article className="panel card"><h3>Duración</h3><p><strong>{bundle.stats.duration.toFixed(2)} s</strong></p></article>
                  <article className="panel card"><h3>Subtítulos</h3><p><strong>{bundle.stats.subtitleCues}</strong></p></article>
                  <article className="panel card"><h3>Readiness</h3><p><strong>{bundle.readiness.score}/100</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Contenido del bundle</h2>
                <div className="timeline-label">Bloques incluidos</div>
              </div>
              {bundle ? (
                <div className="project-list">
                  <div className="project-item"><strong>Proyecto</strong><div className="timeline-label">Estructura completa de clips y tiempos.</div></div>
                  <div className="project-item"><strong>Guion</strong><div className="timeline-label">Texto corrido y por clip.</div></div>
                  <div className="project-item"><strong>Subtítulos</strong><div className="timeline-label">Cues segmentados listos para exportación.</div></div>
                  <div className="project-item"><strong>Roles / transiciones / audio</strong><div className="timeline-label">Plan de narrativa, uniones y mezcla.</div></div>
                  <div className="project-item"><strong>Readiness</strong><div className="timeline-label">Puntuación y recomendaciones del estado actual.</div></div>
                </div>
              ) : <div className="empty">No hay bundle disponible.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
