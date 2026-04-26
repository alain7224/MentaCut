'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

type FramePreset = {
  label: string
  x: number
  y: number
  scale: number
}

const PRESETS: FramePreset[] = [
  { label: 'Centro', x: 50, y: 50, scale: 1 },
  { label: 'Izquierda', x: 35, y: 50, scale: 1 },
  { label: 'Derecha', x: 65, y: 50, scale: 1 },
  { label: 'Arriba', x: 50, y: 35, scale: 1 },
  { label: 'Abajo', x: 50, y: 65, scale: 1 },
  { label: 'Zoom suave', x: 50, y: 50, scale: 1.12 },
  { label: 'Zoom fuerte', x: 50, y: 50, scale: 1.25 },
]

export default function StudioFramingPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeClipId, setActiveClipId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setActiveClipId(nextProjects[0]?.clips[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeClip = useMemo(() => activeProject?.clips.find((clip) => clip.id === activeClipId) ?? null, [activeProject, activeClipId])

  useEffect(() => {
    if (!activeProject) {
      setActiveClipId(null)
      return
    }
    const exists = activeProject.clips.some((clip) => clip.id === activeClipId)
    if (!exists) {
      setActiveClipId(activeProject.clips[0]?.id ?? null)
    }
  }, [activeProject, activeClipId])

  function persistProject(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function updateClipFrame(clipId: string, patch: { frameX?: number; frameY?: number; frameScale?: number }, nextStatus: string) {
    if (!activeProject) return
    persistProject(
      activeProject.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => clip.id === clipId ? { ...clip, ...patch } : clip),
      }),
      nextStatus,
    )
  }

  function applyPresetToClip(preset: FramePreset) {
    if (!activeClip) return
    updateClipFrame(activeClip.id, { frameX: preset.x, frameY: preset.y, frameScale: preset.scale }, `Preset aplicado al clip: ${preset.label}`)
  }

  function applyCurrentToAll() {
    if (!activeProject || !activeClip) return
    persistProject(
      activeProject.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => ({
          ...clip,
          frameX: activeClip.frameX,
          frameY: activeClip.frameY,
          frameScale: activeClip.frameScale,
        })),
      }),
      'Reencuadre del clip activo aplicado a todo el proyecto',
    )
  }

  const stats = useMemo(() => {
    if (!activeProject) return null
    const averageScale = activeProject.clips.length
      ? activeProject.clips.reduce((sum, clip) => sum + clip.frameScale, 0) / activeProject.clips.length
      : 0
    return {
      clips: activeProject.clips.length,
      averageScale,
      format: activeProject.format,
    }
  }, [activeProject])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Framing</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio/variants" className="nav-link">Variantes</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Reencuadre y framing del clip</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Mueve y escala sin entrar al editor completo.</h1>
            <p className="sub">
              Esta pantalla sirve para ajustar posición y escala de los clips de forma rápida, con presets útiles y opción de copiar el framing activo al resto del proyecto.
            </p>
            <div className="action-row">
              <Link href="/studio/storyboard" className="btn btn-primary">Abrir storyboard</Link>
              <Link href="/studio/variants" className="btn">Abrir variantes</Link>
              <button className="btn" onClick={applyCurrentToAll} disabled={!activeClip}>Aplicar framing a todo</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un clip y ajusta X, Y y Scale.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y clip</h2>
                <div className="timeline-label">Base activa</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={activeClipId ?? ''} onChange={(event) => setActiveClipId(event.target.value)}>
                  {activeProject?.clips.map((clip) => (
                    <option key={clip.id} value={clip.id}>{clip.title}</option>
                  ))}
                </select>
              </div>
              {stats ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{stats.clips}</strong></p></article>
                  <article className="panel card"><h3>Formato</h3><p><strong>{stats.format}</strong></p></article>
                  <article className="panel card"><h3>Scale medio</h3><p><strong>{stats.averageScale.toFixed(2)}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview del framing</h2>
                <div className="timeline-label">Vista simplificada</div>
              </div>
              {activeClip ? (
                <div className="panel" style={{ minHeight: 280, display: 'grid', placeItems: 'center' }}>
                  <div style={{ position: 'relative', width: '80%', aspectRatio: '9 / 16', borderRadius: 22, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: '10%', border: '1px dashed rgba(255,255,255,.18)', borderRadius: 18 }} />
                    <div
                      style={{
                        position: 'absolute',
                        width: `${34 * activeClip.frameScale}%`,
                        height: `${34 * activeClip.frameScale}%`,
                        left: `calc(${activeClip.frameX}% - ${17 * activeClip.frameScale}%)`,
                        top: `calc(${activeClip.frameY}% - ${17 * activeClip.frameScale}%)`,
                        borderRadius: 18,
                        border: '1px solid rgba(255,255,255,.25)',
                        background: 'rgba(255,255,255,.10)',
                        display: 'grid',
                        placeItems: 'center',
                        textAlign: 'center',
                        padding: 12,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <strong style={{ fontSize: 12 }}>{activeClip.title}</strong>
                    </div>
                  </div>
                </div>
              ) : <div className="empty">Selecciona un clip para ver el preview.</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Controles</h2>
                <div className="timeline-label">X, Y y Scale</div>
              </div>
              {activeClip ? (
                <div className="form">
                  <label className="form">
                    <span className="timeline-label">Posición X: {activeClip.frameX.toFixed(1)}%</span>
                    <input className="input" type="range" min="0" max="100" step="1" value={activeClip.frameX} onChange={(event) => updateClipFrame(activeClip.id, { frameX: Number(event.target.value) }, 'Posición X actualizada')} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Posición Y: {activeClip.frameY.toFixed(1)}%</span>
                    <input className="input" type="range" min="0" max="100" step="1" value={activeClip.frameY} onChange={(event) => updateClipFrame(activeClip.id, { frameY: Number(event.target.value) }, 'Posición Y actualizada')} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Scale: {activeClip.frameScale.toFixed(2)}</span>
                    <input className="input" type="range" min="0.5" max="2" step="0.01" value={activeClip.frameScale} onChange={(event) => updateClipFrame(activeClip.id, { frameScale: Number(event.target.value) }, 'Scale actualizado')} />
                  </label>
                </div>
              ) : <div className="empty">No hay clip activo.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Presets rápidos</h2>
                <div className="timeline-label">Aplicación inmediata</div>
              </div>
              <div className="preset-chip-wrap">
                {PRESETS.map((preset) => (
                  <button key={preset.label} className="preset-chip" onClick={() => applyPresetToClip(preset)} disabled={!activeClip}>{preset.label}</button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
