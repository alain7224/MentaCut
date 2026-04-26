'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createDefaultClipSpeedPlan, getClipSpeedPlan, getEffectiveClipDuration, readClipSpeedPlans, upsertClipSpeedPlan, writeClipSpeedPlans, type ClipSpeedPlan } from '@/lib/local-clip-speed'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioSpeedPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [plans, setPlans] = useState<ClipSpeedPlan[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setPlans(readClipSpeedPlans())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  function updatePlan(clipId: string, patch: Partial<ClipSpeedPlan>, nextStatus: string) {
    if (!activeProject) return
    const current = getClipSpeedPlan(plans, activeProject.id, clipId) ?? createDefaultClipSpeedPlan(activeProject.id, clipId)
    const next = upsertClipSpeedPlan(plans, { ...current, ...patch })
    setPlans(next)
    writeClipSpeedPlans(next)
    setStatus(nextStatus)
  }

  const stats = useMemo(() => {
    if (!activeProject) return null
    const entries = activeProject.clips.map((clip) => getClipSpeedPlan(plans, activeProject.id, clip.id) ?? createDefaultClipSpeedPlan(activeProject.id, clip.id))
    const avg = entries.length ? entries.reduce((sum, item) => sum + item.speed, 0) / entries.length : 1
    const effective = activeProject.clips.reduce((sum, clip) => {
      const entry = getClipSpeedPlan(plans, activeProject.id, clip.id) ?? createDefaultClipSpeedPlan(activeProject.id, clip.id)
      return sum + getEffectiveClipDuration(clip.start, clip.end, entry.speed)
    }, 0)
    return { clips: activeProject.clips.length, avg, effective }
  }, [activeProject, plans])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Speed</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/trim" className="nav-link">Trim</Link>
          <Link href="/studio/audio-mix" className="nav-link">Audio mix</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Velocidad por clip</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Planifica cámara rápida o lenta.</h1>
            <p className="sub">Esta zona guarda una velocidad por clip y calcula la duración efectiva si aceleras o ralentizas el material.</p>
            <div className="action-row">
              <Link href="/studio/trim" className="btn btn-primary">Abrir trim</Link>
              <Link href="/studio/audio-mix" className="btn">Abrir audio mix</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y ajusta la velocidad clip por clip.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto y resumen</h2><div className="timeline-label">Base activa</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              {stats ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{stats.clips}</strong></p></article>
                  <article className="panel card"><h3>Speed media</h3><p><strong>{stats.avg.toFixed(2)}x</strong></p></article>
                  <article className="panel card"><h3>Duración efectiva</h3><p><strong>{stats.effective.toFixed(2)} s</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Referencia rápida</h2><div className="timeline-label">Lectura</div></div>
              <div className="project-list">
                <div className="project-item"><strong>0.5x</strong><div className="timeline-label">Más lento, duración más larga.</div></div>
                <div className="project-item"><strong>1x</strong><div className="timeline-label">Velocidad normal.</div></div>
                <div className="project-item"><strong>2x</strong><div className="timeline-label">Más rápido, duración más corta.</div></div>
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Clips y velocidad</h2><div className="timeline-label">{activeProject?.clips.length ?? 0} clip(s)</div></div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {activeProject?.clips.length ? activeProject.clips.map((clip) => {
                const plan = getClipSpeedPlan(plans, activeProject.id, clip.id) ?? createDefaultClipSpeedPlan(activeProject.id, clip.id)
                return (
                  <article key={clip.id} className="panel card">
                    <div className="row-head"><h3>{clip.title}</h3><div className="timeline-label">{clip.start.toFixed(2)}s → {clip.end.toFixed(2)}s</div></div>
                    <div className="form">
                      <label className="form">
                        <span className="timeline-label">Velocidad: {plan.speed.toFixed(2)}x</span>
                        <input className="input" type="range" min="0.25" max="3" step="0.05" value={plan.speed} onChange={(event) => updatePlan(clip.id, { speed: Number(event.target.value) }, `Velocidad actualizada en ${clip.title}`)} />
                      </label>
                      <div className="timeline-label">Duración efectiva: {getEffectiveClipDuration(clip.start, clip.end, plan.speed).toFixed(3)} s</div>
                      <label className="project-item" style={{ cursor: 'pointer' }}>
                        <strong>Preservar pitch</strong>
                        <div className="timeline-label">{plan.preservePitch ? 'Sí' : 'No'}</div>
                        <input type="checkbox" checked={plan.preservePitch} onChange={(event) => updatePlan(clip.id, { preservePitch: event.target.checked }, `Pitch actualizado en ${clip.title}`)} />
                      </label>
                    </div>
                  </article>
                )
              }) : <div className="empty">No hay clips para ajustar.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
