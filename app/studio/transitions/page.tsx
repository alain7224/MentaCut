'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { createDefaultTransitionPlan, readTransitionPlans, upsertTransitionPlan, writeTransitionPlans, type ClipTransitionPlan, type TransitionCurve, type TransitionType } from '@/lib/local-transitions'

const TRANSITION_TYPES: TransitionType[] = ['cut', 'fade', 'slide-left', 'slide-right', 'zoom', 'blur', 'flash']
const TRANSITION_CURVES: TransitionCurve[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out']

export default function StudioTransitionsPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [plans, setPlans] = useState<ClipTransitionPlan[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveId(nextProjects[0]?.id ?? null)
    setPlans(readTransitionPlans())
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])

  const clipPairs = useMemo(() => {
    if (!active) return []
    return active.clips.slice(0, -1).map((clip, index) => ({
      from: clip,
      to: active.clips[index + 1],
    }))
  }, [active])

  function savePlan(plan: ClipTransitionPlan, nextStatus: string) {
    const nextPlans = upsertTransitionPlan(plans, plan)
    setPlans(nextPlans)
    writeTransitionPlans(nextPlans)
    setStatus(nextStatus)
  }

  function getPlan(fromClipId: string, toClipId: string) {
    if (!active) return null
    return plans.find((item) => item.projectId === active.id && item.fromClipId === fromClipId && item.toClipId === toClipId) ?? null
  }

  function updatePlan(fromClipId: string, toClipId: string, patch: Partial<ClipTransitionPlan>) {
    if (!active) return
    const current = getPlan(fromClipId, toClipId) ?? createDefaultTransitionPlan(active.id, fromClipId, toClipId)
    savePlan({ ...current, ...patch }, 'Plan de transición actualizado')
  }

  const summary = useMemo(() => {
    if (!active) return null
    const activePlans = plans.filter((item) => item.projectId === active.id)
    const average = activePlans.length ? activePlans.reduce((sum, item) => sum + item.duration, 0) / activePlans.length : 0
    return {
      pairs: clipPairs.length,
      planned: activePlans.length,
      average,
      nonCut: activePlans.filter((item) => item.type !== 'cut').length,
    }
  }, [active, plans, clipPairs.length])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Transitions</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio/pacing" className="nav-link">Pacing</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Planificador de transiciones</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Define la unión entre clips sin pelearte con toda la timeline.</h1>
            <p className="sub">
              Esta vista sirve para decidir cómo entra un clip en el siguiente, ajustar duración, curva y notas visuales antes de pulir la edición más fina.
            </p>
            <div className="action-row">
              <Link href="/studio/storyboard" className="btn btn-primary">Abrir storyboard</Link>
              <Link href="/studio/pacing" className="btn">Abrir pacing</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona proyecto y ajusta las uniones clip a clip.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto activo</h2>
                <div className="timeline-label">Base de transición</div>
              </div>
              <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              {summary ? (
                <div className="cards">
                  <article className="panel card"><h3>Pares</h3><p><strong>{summary.pairs}</strong></p></article>
                  <article className="panel card"><h3>Planificados</h3><p><strong>{summary.planned}</strong></p></article>
                  <article className="panel card"><h3>No corte</h3><p><strong>{summary.nonCut}</strong></p></article>
                  <article className="panel card"><h3>Media duración</h3><p><strong>{summary.average.toFixed(2)} s</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Cómo usar transiciones</h2>
                <div className="timeline-label">Flujo práctico</div>
              </div>
              <div className="project-list">
                <div className="project-item"><strong>Cut</strong><div className="timeline-label">Cambio rápido y directo para mantener ritmo alto.</div></div>
                <div className="project-item"><strong>Fade / blur</strong><div className="timeline-label">Suaviza paso entre ideas o escenas.</div></div>
                <div className="project-item"><strong>Slide / zoom / flash</strong><div className="timeline-label">Sirve para energía, reveal o transición llamativa.</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Uniones de clips</h2>
              <div className="timeline-label">{clipPairs.length} transición(es)</div>
            </div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {clipPairs.length === 0 ? <div className="empty">Este proyecto no tiene suficientes clips para planificar transiciones.</div> : null}
              {clipPairs.map(({ from, to }) => {
                const plan = getPlan(from.id, to.id) ?? createDefaultTransitionPlan(active?.id ?? 'temp', from.id, to.id)
                return (
                  <article key={`${from.id}-${to.id}`} className="panel card">
                    <div className="row-head">
                      <h3>{from.title} → {to.title}</h3>
                      <div className="timeline-label">{from.end.toFixed(1)}s → {to.start.toFixed(1)}s</div>
                    </div>
                    <div className="form">
                      <select className="input" value={plan.type} onChange={(event) => updatePlan(from.id, to.id, { type: event.target.value as TransitionType })}>
                        {TRANSITION_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <label className="form">
                        <span className="timeline-label">Duración: {plan.duration.toFixed(2)} s</span>
                        <input className="input" type="range" min="0.1" max="2.5" step="0.05" value={plan.duration} onChange={(event) => updatePlan(from.id, to.id, { duration: Number(event.target.value) })} />
                      </label>
                      <select className="input" value={plan.curve} onChange={(event) => updatePlan(from.id, to.id, { curve: event.target.value as TransitionCurve })}>
                        {TRANSITION_CURVES.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <textarea className="textarea" rows={3} value={plan.note} onChange={(event) => updatePlan(from.id, to.id, { note: event.target.value })} placeholder="Nota visual o intención de esta transición" />
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
