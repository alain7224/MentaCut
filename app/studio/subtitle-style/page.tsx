'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { buildSegmentedSubtitleCues } from '@/lib/subtitle-utils'
import {
  createDefaultProjectSubtitleStyle,
  readProjectSubtitleStyles,
  upsertProjectSubtitleStyle,
  writeProjectSubtitleStyles,
  type ProjectSubtitleStyle,
  type SubtitleAlign,
  type SubtitlePosition,
} from '@/lib/local-subtitle-style'

export default function StudioSubtitleStylePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [styles, setStyles] = useState<ProjectSubtitleStyle[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setStyles(readProjectSubtitleStyles())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeStyle = useMemo(() => {
    if (!activeProject) return null
    return styles.find((item) => item.projectId === activeProject.id) ?? createDefaultProjectSubtitleStyle(activeProject.id)
  }, [styles, activeProject])

  const previewText = useMemo(() => {
    if (!activeProject) return 'PREVIEW SUBTITLE'
    const cue = buildSegmentedSubtitleCues(activeProject, 'mixed', 38)[0]
    const raw = cue?.text || activeProject.clips[0]?.headlineText || 'Preview subtitle'
    return activeStyle?.uppercase ? raw.toUpperCase() : raw
  }, [activeProject, activeStyle])

  function updateStyle(patch: Partial<ProjectSubtitleStyle>, nextStatus: string) {
    if (!activeStyle) return
    const nextStyle = { ...activeStyle, ...patch }
    const next = upsertProjectSubtitleStyle(styles, nextStyle)
    setStyles(next)
    writeProjectSubtitleStyles(next)
    setStatus(nextStatus)
  }

  const previewPositionStyle = useMemo(() => {
    if (!activeStyle) return { left: '50%', bottom: '12%', top: 'auto', transform: 'translateX(-50%)' }
    const left = activeStyle.align === 'left' ? `${activeStyle.safeMargin}%` : activeStyle.align === 'right' ? `${100 - activeStyle.safeMargin}%` : '50%'
    const transform = activeStyle.align === 'center' ? 'translateX(-50%)' : activeStyle.align === 'right' ? 'translateX(-100%)' : 'none'
    if (activeStyle.position === 'top') return { left, top: `${activeStyle.safeMargin}%`, bottom: 'auto', transform }
    if (activeStyle.position === 'center') return { left, top: '50%', bottom: 'auto', transform: `${transform} translateY(-50%)`.trim() }
    return { left, bottom: `${activeStyle.safeMargin}%`, top: 'auto', transform }
  }, [activeStyle])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Subtitle Style</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/subtitles" className="nav-link">Subtitles</Link>
          <Link href="/studio/script" className="nav-link">Script</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Estilo de subtítulos del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Define cómo se verán los captions.</h1>
            <p className="sub">
              Esta zona guarda una configuración visual por proyecto para subtítulos, con posición, alineación, tamaño, mayúsculas, fondo y sombra.
            </p>
            <div className="action-row">
              <Link href="/studio/subtitles" className="btn btn-primary">Abrir subtitles</Link>
              <Link href="/studio/script" className="btn">Abrir script</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y ajusta su estilo de subtítulos.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Configuración</h2>
                <div className="timeline-label">Proyecto activo</div>
              </div>
              {activeStyle ? (
                <div className="form">
                  <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                    ))}
                  </select>
                  <select className="input" value={activeStyle.position} onChange={(event) => updateStyle({ position: event.target.value as SubtitlePosition }, 'Posición actualizada')}>
                    <option value="top">Arriba</option>
                    <option value="center">Centro</option>
                    <option value="bottom">Abajo</option>
                  </select>
                  <select className="input" value={activeStyle.align} onChange={(event) => updateStyle({ align: event.target.value as SubtitleAlign }, 'Alineación actualizada')}>
                    <option value="left">Izquierda</option>
                    <option value="center">Centro</option>
                    <option value="right">Derecha</option>
                  </select>
                  <label className="form">
                    <span className="timeline-label">Tamaño: {activeStyle.fontSize}px</span>
                    <input className="input" type="range" min="20" max="72" step="1" value={activeStyle.fontSize} onChange={(event) => updateStyle({ fontSize: Number(event.target.value) }, 'Tamaño actualizado')} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Líneas máximas: {activeStyle.maxLines}</span>
                    <input className="input" type="range" min="1" max="4" step="1" value={activeStyle.maxLines} onChange={(event) => updateStyle({ maxLines: Number(event.target.value) }, 'Líneas máximas actualizadas')} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Margen seguro: {activeStyle.safeMargin}%</span>
                    <input className="input" type="range" min="4" max="20" step="1" value={activeStyle.safeMargin} onChange={(event) => updateStyle({ safeMargin: Number(event.target.value) }, 'Margen seguro actualizado')} />
                  </label>
                  <div className="editor-grid-2">
                    <input className="input" value={activeStyle.textColor} onChange={(event) => updateStyle({ textColor: event.target.value }, 'Color de texto actualizado')} placeholder="#FFFFFF" />
                    <input className="input" value={activeStyle.backgroundColor} onChange={(event) => updateStyle({ backgroundColor: event.target.value }, 'Color de fondo actualizado')} placeholder="rgba(0,0,0,0.65)" />
                  </div>
                  <label className="project-item" style={{ cursor: 'pointer' }}>
                    <strong>Mayúsculas</strong>
                    <div className="timeline-label">{activeStyle.uppercase ? 'Activo' : 'Inactivo'}</div>
                    <input type="checkbox" checked={activeStyle.uppercase} onChange={(event) => updateStyle({ uppercase: event.target.checked }, 'Mayúsculas actualizadas')} />
                  </label>
                  <label className="project-item" style={{ cursor: 'pointer' }}>
                    <strong>Fondo</strong>
                    <div className="timeline-label">{activeStyle.backgroundEnabled ? 'Activo' : 'Inactivo'}</div>
                    <input type="checkbox" checked={activeStyle.backgroundEnabled} onChange={(event) => updateStyle({ backgroundEnabled: event.target.checked }, 'Fondo actualizado')} />
                  </label>
                  <label className="project-item" style={{ cursor: 'pointer' }}>
                    <strong>Sombra</strong>
                    <div className="timeline-label">{activeStyle.shadowEnabled ? 'Activo' : 'Inactivo'}</div>
                    <input type="checkbox" checked={activeStyle.shadowEnabled} onChange={(event) => updateStyle({ shadowEnabled: event.target.checked }, 'Sombra actualizada')} />
                  </label>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview visual</h2>
                <div className="timeline-label">Mock del caption</div>
              </div>
              {activeStyle ? (
                <div className="panel" style={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
                  <div style={{ position: 'relative', width: '72%', aspectRatio: '9 / 16', borderRadius: 24, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: '8%', border: '1px dashed rgba(255,255,255,.12)', borderRadius: 18 }} />
                    <div
                      style={{
                        position: 'absolute',
                        maxWidth: '72%',
                        padding: activeStyle.backgroundEnabled ? '10px 14px' : '0',
                        borderRadius: 14,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        color: activeStyle.textColor,
                        background: activeStyle.backgroundEnabled ? activeStyle.backgroundColor : 'transparent',
                        textAlign: activeStyle.align,
                        fontSize: `${Math.max(14, activeStyle.fontSize / 3)}px`,
                        textShadow: activeStyle.shadowEnabled ? '0 2px 12px rgba(0,0,0,.55)' : 'none',
                        whiteSpace: 'pre-wrap',
                        ...previewPositionStyle,
                      }}
                    >
                      {previewText}
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
