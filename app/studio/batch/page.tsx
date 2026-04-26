'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'
import { STICKER_PRESETS } from '@/lib/overlay-presets'
import { GRAPHIC_OVERLAY_PRESETS } from '@/lib/graphic-overlay-presets'

export default function StudioBatchPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState(TEMPLATE_PRESETS[0]?.id ?? 'hook-crystal')
  const [stickerId, setStickerId] = useState('')
  const [overlayId, setOverlayId] = useState('')
  const [headlinePrefix, setHeadlinePrefix] = useState('')
  const [captionSuffix, setCaptionSuffix] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveId(next[0]?.id ?? null)
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])

  function persist(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function applyTemplateToAll() {
    if (!active) return
    persist(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => ({ ...clip, templateId })),
      }),
      'Plantilla aplicada a todos los clips',
    )
  }

  function applyStickerToAll() {
    if (!active) return
    persist(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => ({ ...clip, stickerId: stickerId || null })),
      }),
      stickerId ? 'Sticker aplicado a todos los clips' : 'Sticker quitado de todos los clips',
    )
  }

  function applyOverlayToAll() {
    if (!active) return
    persist(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => ({ ...clip, graphicOverlayId: overlayId || null })),
      }),
      overlayId ? 'Overlay aplicado a todos los clips' : 'Overlay quitado de todos los clips',
    )
  }

  function applyHeadlinePrefix() {
    if (!active || !headlinePrefix.trim()) return
    persist(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => ({
          ...clip,
          headlineText: `${headlinePrefix.trim()} ${clip.headlineText}`.trim(),
        })),
      }),
      'Prefijo aplicado a todos los headlines',
    )
  }

  function applyCaptionSuffix() {
    if (!active || !captionSuffix.trim()) return
    persist(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => ({
          ...clip,
          captionText: `${clip.captionText}${clip.captionText ? ' ' : ''}${captionSuffix.trim()}`.trim(),
        })),
      }),
      'Sufijo aplicado a todas las captions',
    )
  }

  function renumberTitles() {
    if (!active) return
    persist(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip, index) => ({
          ...clip,
          title: `Clip ${index + 1}`,
        })),
      }),
      'Títulos renumerados por orden',
    )
  }

  function clearAllDecorative() {
    if (!active) return
    persist(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => ({
          ...clip,
          stickerId: null,
          graphicOverlayId: null,
        })),
      }),
      'Stickers y overlays quitados de todo el proyecto',
    )
  }

  const coverage = useMemo(() => {
    if (!active) return null
    return {
      clips: active.clips.length,
      templates: new Set(active.clips.map((clip) => clip.templateId).filter(Boolean)).size,
      stickers: active.clips.filter((clip) => clip.stickerId).length,
      overlays: active.clips.filter((clip) => clip.graphicOverlayId).length,
    }
  }, [active])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Batch</span>
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
            <span className="eyebrow">Acciones por lote del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Aplica cambios a todos los clips de golpe.</h1>
            <p className="sub">
              Esta zona te deja unificar plantilla, sticker, overlay y copy rápido para que no tengas que entrar clip por clip cuando quieres hacer cambios globales.
            </p>
            <div className="action-row">
              <Link href="/studio" className="btn btn-primary">Abrir estudio</Link>
              <Link href="/studio/storyboard" className="btn">Abrir storyboard</Link>
              <Link href="/studio/pacing" className="btn">Abrir pacing</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y aplica cambios globales.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y cobertura</h2>
                <div className="timeline-label">Base activa</div>
              </div>
              <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              {coverage ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{coverage.clips}</strong></p></article>
                  <article className="panel card"><h3>Plantillas activas</h3><p><strong>{coverage.templates}</strong></p></article>
                  <article className="panel card"><h3>Con sticker</h3><p><strong>{coverage.stickers}</strong></p></article>
                  <article className="panel card"><h3>Con overlay</h3><p><strong>{coverage.overlays}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Utilidades rápidas</h2>
                <div className="timeline-label">Cambios masivos</div>
              </div>
              <div className="action-row">
                <button className="btn" onClick={renumberTitles} disabled={!active}>Renumerar títulos</button>
                <button className="btn" onClick={clearAllDecorative} disabled={!active}>Quitar stickers y overlays</button>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Aplicar plantilla / sticker / overlay</h2>
                <div className="timeline-label">Identidad visual global</div>
              </div>
              <div className="form">
                <select className="input" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                  {TEMPLATE_PRESETS.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} · {item.category}</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={applyTemplateToAll} disabled={!active}>Aplicar plantilla a todos</button>

                <select className="input" value={stickerId} onChange={(event) => setStickerId(event.target.value)}>
                  <option value="">Sin sticker</option>
                  {STICKER_PRESETS.map((item) => (
                    <option key={item.id} value={item.id}>{item.emoji} {item.label}</option>
                  ))}
                </select>
                <button className="btn" onClick={applyStickerToAll} disabled={!active}>{stickerId ? 'Aplicar sticker a todos' : 'Quitar sticker a todos'}</button>

                <select className="input" value={overlayId} onChange={(event) => setOverlayId(event.target.value)}>
                  <option value="">Sin overlay</option>
                  {GRAPHIC_OVERLAY_PRESETS.map((item) => (
                    <option key={item.id} value={item.id}>{item.symbol} {item.name}</option>
                  ))}
                </select>
                <button className="btn" onClick={applyOverlayToAll} disabled={!active}>{overlayId ? 'Aplicar overlay a todos' : 'Quitar overlay a todos'}</button>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Aplicar copy masivo</h2>
                <div className="timeline-label">Texto compartido</div>
              </div>
              <div className="form">
                <input className="input" value={headlinePrefix} onChange={(event) => setHeadlinePrefix(event.target.value)} placeholder="Prefijo para todos los headlines" />
                <button className="btn btn-primary" onClick={applyHeadlinePrefix} disabled={!active || !headlinePrefix.trim()}>Aplicar prefijo</button>

                <textarea className="textarea" rows={4} value={captionSuffix} onChange={(event) => setCaptionSuffix(event.target.value)} placeholder="Sufijo o CTA común para todas las captions" />
                <button className="btn" onClick={applyCaptionSuffix} disabled={!active || !captionSuffix.trim()}>Aplicar sufijo de caption</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
