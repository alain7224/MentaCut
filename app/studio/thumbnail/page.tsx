'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createDefaultThumbnailPlan, readProjectThumbnailPlans, upsertProjectThumbnailPlan, writeProjectThumbnailPlans, type ProjectThumbnailPlan, type ThumbnailStyle, type ThumbnailTextAlign } from '@/lib/local-thumbnail-plans'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioThumbnailPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [plans, setPlans] = useState<ProjectThumbnailPlan[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setPlans(readProjectThumbnailPlans())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activePlan = useMemo(() => {
    if (!activeProject) return null
    return plans.find((item) => item.projectId === activeProject.id) ?? createDefaultThumbnailPlan(activeProject.id)
  }, [plans, activeProject])

  function updatePlan(patch: Partial<ProjectThumbnailPlan>, nextStatus: string) {
    if (!activePlan) return
    const next = upsertProjectThumbnailPlan(plans, { ...activePlan, ...patch })
    setPlans(next)
    writeProjectThumbnailPlans(next)
    setStatus(nextStatus)
  }

  const alignStyle = useMemo(() => {
    if (!activePlan) return { left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const }
    if (activePlan.align === 'left') return { left: '10%', transform: 'none', textAlign: 'left' as const }
    if (activePlan.align === 'right') return { left: '90%', transform: 'translateX(-100%)', textAlign: 'right' as const }
    return { left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const }
  }, [activePlan])

  const titleSize = activePlan?.style === 'dramatic' ? 22 : activePlan?.style === 'clean' ? 18 : 20

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Thumbnail</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/publish" className="nav-link">Publish</Link>
          <Link href="/studio/brief" className="nav-link">Brief</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Planificador de miniatura / cover</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Define el thumbnail del proyecto.</h1>
            <p className="sub">Esta zona guarda la idea de portada por proyecto: clip base, texto principal, subtítulo, badge y estilo visual.</p>
            <div className="action-row">
              <Link href="/studio/publish" className="btn btn-primary">Abrir publish</Link>
              <Link href="/studio/brief" className="btn">Abrir brief</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y define su miniatura.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Configuración</h2><div className="timeline-label">Proyecto activo</div></div>
              {activePlan ? (
                <div className="form">
                  <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                  </select>
                  <select className="input" value={activePlan.clipId ?? ''} onChange={(event) => updatePlan({ clipId: event.target.value || null }, 'Clip base actualizado')}>
                    <option value="">Sin clip base</option>
                    {activeProject?.clips.map((clip) => <option key={clip.id} value={clip.id}>{clip.title}</option>)}
                  </select>
                  <input className="input" value={activePlan.title} onChange={(event) => updatePlan({ title: event.target.value }, 'Título de thumbnail actualizado')} placeholder="Título principal" />
                  <input className="input" value={activePlan.subtitle} onChange={(event) => updatePlan({ subtitle: event.target.value }, 'Subtítulo actualizado')} placeholder="Subtítulo" />
                  <input className="input" value={activePlan.badge} onChange={(event) => updatePlan({ badge: event.target.value }, 'Badge actualizado')} placeholder="Badge o etiqueta" />
                  <select className="input" value={activePlan.style} onChange={(event) => updatePlan({ style: event.target.value as ThumbnailStyle }, 'Estilo actualizado')}>
                    <option value="bold">Bold</option>
                    <option value="clean">Clean</option>
                    <option value="dramatic">Dramatic</option>
                  </select>
                  <select className="input" value={activePlan.align} onChange={(event) => updatePlan({ align: event.target.value as ThumbnailTextAlign }, 'Alineación actualizada')}>
                    <option value="left">Izquierda</option>
                    <option value="center">Centro</option>
                    <option value="right">Derecha</option>
                  </select>
                  <label className="form">
                    <span className="timeline-label">Oscurecer fondo: {activePlan.backgroundDim}%</span>
                    <input className="input" type="range" min="0" max="80" step="5" value={activePlan.backgroundDim} onChange={(event) => updatePlan({ backgroundDim: Number(event.target.value) }, 'Oscurecimiento actualizado')} />
                  </label>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preview</h2><div className="timeline-label">Mock de portada</div></div>
              {activePlan ? (
                <div className="panel" style={{ minHeight: 340, display: 'grid', placeItems: 'center' }}>
                  <div style={{ position: 'relative', width: '80%', aspectRatio: '16 / 9', borderRadius: 22, overflow: 'hidden', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(0deg, rgba(0,0,0,${activePlan.backgroundDim / 100}) 0%, rgba(0,0,0,${activePlan.backgroundDim / 200}) 100%)` }} />
                    {activePlan.badge ? <div style={{ position: 'absolute', top: '8%', right: '8%', padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,.14)', fontSize: 12, fontWeight: 700 }}>{activePlan.badge}</div> : null}
                    <div style={{ position: 'absolute', bottom: '10%', maxWidth: '78%', color: '#fff', ...alignStyle }}>
                      <div style={{ fontSize: titleSize, fontWeight: 900, lineHeight: 1.05 }}>{activePlan.title || 'TÍTULO DEL THUMBNAIL'}</div>
                      {activePlan.subtitle ? <div style={{ marginTop: 8, opacity: .9, fontSize: 13 }}>{activePlan.subtitle}</div> : null}
                    </div>
                  </div>
                </div>
              ) : <div className="empty">No hay preview disponible.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
