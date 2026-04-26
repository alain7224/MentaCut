'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'
import { STICKER_PRESETS } from '@/lib/overlay-presets'
import { GRAPHIC_OVERLAY_PRESETS } from '@/lib/graphic-overlay-presets'

export default function StudioInspectorPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveId(nextProjects[0]?.id ?? null)
    void listLocalMedia().then(setLibrary).catch(() => setLibrary([]))
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])

  const stats = useMemo(() => {
    if (!active) {
      return {
        duration: 0,
        clips: 0,
        withMedia: 0,
        withAudio: 0,
        templates: 0,
        stickers: 0,
        overlays: 0,
      }
    }

    const uniqueTemplates = new Set(active.clips.map((clip) => clip.templateId).filter(Boolean))
    const uniqueStickers = new Set(active.clips.map((clip) => clip.stickerId).filter(Boolean))
    const uniqueOverlays = new Set(active.clips.map((clip) => clip.graphicOverlayId).filter(Boolean))

    return {
      duration: active.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0),
      clips: active.clips.length,
      withMedia: active.clips.filter((clip) => clip.mediaId).length,
      withAudio: active.clips.filter((clip) => clip.audioMediaId).length,
      templates: uniqueTemplates.size,
      stickers: uniqueStickers.size,
      overlays: uniqueOverlays.size,
    }
  }, [active])

  function exportActiveProject() {
    if (!active) return
    const payload = {
      app: 'MentaCut',
      kind: 'single-project-export',
      exportedAt: new Date().toISOString(),
      project: active,
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${active.name.replace(/\s+/g, '-').toLowerCase()}-mentacut-project.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus(`Proyecto exportado: ${active.name}`)
  }

  function getMediaName(mediaId: string | null) {
    if (!mediaId) return 'Sin media'
    return library.find((item) => item.id === mediaId)?.name ?? 'Media no encontrada'
  }

  function getTemplateName(templateId: string | null) {
    if (!templateId) return 'Sin plantilla'
    return TEMPLATE_PRESETS.find((item) => item.id === templateId)?.name ?? templateId
  }

  function getStickerName(stickerId: string | null) {
    if (!stickerId) return 'Sin sticker'
    return STICKER_PRESETS.find((item) => item.id === stickerId)?.label ?? stickerId
  }

  function getOverlayName(overlayId: string | null) {
    if (!overlayId) return 'Sin overlay'
    return GRAPHIC_OVERLAY_PRESETS.find((item) => item.id === overlayId)?.name ?? overlayId
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Inspector</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/backup" className="nav-link">Backup</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Revisión técnica del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Inspecciona lo que ya tiene tu proyecto.</h1>
            <p className="sub">
              Esta zona sirve para revisar duración, clips, recursos usados y exportar un proyecto individual en JSON sin mezclarlo con el backup global.
            </p>
            <div className="action-row">
              <Link href="/studio/workspace" className="btn btn-primary">Abrir workspace</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
              <button className="btn" onClick={exportActiveProject} disabled={!active}>Exportar proyecto</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto para revisar su estado actual.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Seleccionar proyecto</h2>
                <div className="timeline-label">{projects.length} proyecto(s)</div>
              </div>
              <div className="project-list">
                {projects.length === 0 ? <div className="empty">No hay proyectos locales todavía.</div> : null}
                {projects.map((project) => (
                  <button key={project.id} className={`project-item ${project.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(project.id)}>
                    <strong>{project.name}</strong>
                    <div className="timeline-label">{project.format} · {project.clips.length} clips · {new Date(project.updatedAt).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen del proyecto</h2>
                <div className="timeline-label">{active?.format ?? 'Sin selección'}</div>
              </div>
              {active ? (
                <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <article className="panel card"><h3>Duración total</h3><p><strong>{stats.duration.toFixed(1)} s</strong></p></article>
                  <article className="panel card"><h3>Clips</h3><p><strong>{stats.clips}</strong></p></article>
                  <article className="panel card"><h3>Con media</h3><p><strong>{stats.withMedia}</strong></p></article>
                  <article className="panel card"><h3>Con audio</h3><p><strong>{stats.withAudio}</strong></p></article>
                  <article className="panel card"><h3>Plantillas usadas</h3><p><strong>{stats.templates}</strong></p></article>
                  <article className="panel card"><h3>Overlays usados</h3><p><strong>{stats.overlays}</strong></p></article>
                </div>
              ) : <div className="empty">Selecciona un proyecto.</div>}
            </div>
          </div>
        </section>

        {active ? (
          <section className="section">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Detalle de clips</h2>
                <div className="timeline-label">Revisión interna</div>
              </div>
              <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {active.clips.map((clip) => (
                  <article key={clip.id} className="panel card">
                    <h3>{clip.title}</h3>
                    <p><strong>Tiempo:</strong> {clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</p>
                    <p><strong>Media:</strong> {getMediaName(clip.mediaId)}</p>
                    <p><strong>Audio:</strong> {getMediaName(clip.audioMediaId)}</p>
                    <p><strong>Plantilla:</strong> {getTemplateName(clip.templateId)}</p>
                    <p><strong>Sticker:</strong> {getStickerName(clip.stickerId)}</p>
                    <p><strong>Overlay:</strong> {getOverlayName(clip.graphicOverlayId)}</p>
                    <p><strong>Headline:</strong> {clip.headlineText || '—'}</p>
                    <p><strong>Caption:</strong> {clip.captionText || '—'}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}
