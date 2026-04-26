'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { readLocalProjects, writeLocalProjects, type LocalClip, type LocalProject, type ProjectFormat } from '@/lib/local-store'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'

const FORMATS: ProjectFormat[] = ['9:16', '1:1', '4:5', '16:9']

function buildClipsFromLines(lines: string[], durationPerClip: number, templateId: string): LocalClip[] {
  let cursor = 0

  return lines.map((rawLine, index) => {
    const [headlinePart, captionPart] = rawLine.split('|')
    const headline = (headlinePart || `Clip ${index + 1}`).trim()
    const caption = (captionPart || headlinePart || '').trim()
    const start = Number(cursor.toFixed(2))
    const end = Number((cursor + durationPerClip).toFixed(2))
    cursor = end

    return {
      id: crypto.randomUUID(),
      title: headline || `Clip ${index + 1}`,
      start,
      end,
      mediaId: null,
      audioMediaId: null,
      templateId,
      frameX: 50,
      frameY: 50,
      frameScale: 1,
      headlineText: headline || `Clip ${index + 1}`,
      captionText: caption || headline || 'Texto editable del clip',
      stickerId: null,
      graphicOverlayId: null,
    }
  })
}

export default function StudioPlannerPage() {
  const [name, setName] = useState('Plan de clips MentaCut')
  const [format, setFormat] = useState<ProjectFormat>('9:16')
  const [templateId, setTemplateId] = useState(TEMPLATE_PRESETS[0]?.id ?? 'hook-crystal')
  const [durationPerClip, setDurationPerClip] = useState(3.5)
  const [script, setScript] = useState([
    'Gancho inicial | Abre con la idea fuerte',
    'Problema | Señala el dolor rápido',
    'Solución | Enseña lo que cambia',
    'Cierre con CTA | Pide la acción final',
  ].join('\n'))
  const [status, setStatus] = useState('')

  const lines = useMemo(
    () => script.split('\n').map((line) => line.trim()).filter(Boolean),
    [script],
  )

  const previewClips = useMemo(
    () => buildClipsFromLines(lines, Math.max(0.5, durationPerClip), templateId),
    [lines, durationPerClip, templateId],
  )

  const totalDuration = useMemo(
    () => previewClips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0),
    [previewClips],
  )

  function handleCreateProject() {
    if (previewClips.length === 0) {
      setStatus('Escribe al menos una línea para crear clips.')
      return
    }

    const project: LocalProject = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Plan de clips MentaCut',
      format,
      updatedAt: new Date().toISOString(),
      clips: previewClips,
    }

    const existing = readLocalProjects()
    writeLocalProjects([project, ...existing])
    setStatus(`Proyecto creado con ${previewClips.length} clips: ${project.name}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Planner</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/new" className="nav-link">Nuevo</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Planificador de formato corto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Convierte ideas en clips secuenciales.</h1>
            <p className="sub">
              Escribe una línea por clip y MentaCut te genera un proyecto local con estructura, tiempos y texto base para empezar mucho más rápido.
            </p>
            <div className="action-row">
              <Link href="/studio" className="btn btn-primary">Abrir estudio</Link>
              <Link href="/studio/projects" className="btn">Abrir proyectos</Link>
              <button className="btn" onClick={handleCreateProject}>Crear proyecto desde plan</button>
            </div>
            <div className="timeline-label">{status || 'Usa el separador “|” para dividir headline y caption en cada línea.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Configurar plan</h2>
                <div className="timeline-label">Base del proyecto</div>
              </div>
              <div className="form">
                <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del proyecto" />
                <select className="input" value={format} onChange={(event) => setFormat(event.target.value as ProjectFormat)}>
                  {FORMATS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select className="input" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                  {TEMPLATE_PRESETS.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} · {item.category}</option>
                  ))}
                </select>
                <label className="form">
                  <span className="timeline-label">Duración base por clip: {Math.max(0.5, durationPerClip).toFixed(1)} s</span>
                  <input className="input" type="range" min="0.5" max="10" step="0.5" value={durationPerClip} onChange={(event) => setDurationPerClip(Number(event.target.value))} />
                </label>
                <textarea className="textarea" rows={12} value={script} onChange={(event) => setScript(event.target.value)} placeholder="Una línea por clip. Puedes usar: Headline | Caption" />
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview del plan</h2>
                <div className="timeline-label">{previewClips.length} clip(s) · {totalDuration.toFixed(1)} s</div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Clips</h3><p><strong>{previewClips.length}</strong></p></article>
                <article className="panel card"><h3>Duración total</h3><p><strong>{totalDuration.toFixed(1)} s</strong></p></article>
                <article className="panel card"><h3>Formato</h3><p><strong>{format}</strong></p></article>
                <article className="panel card"><h3>Plantilla base</h3><p><strong>{TEMPLATE_PRESETS.find((item) => item.id === templateId)?.name ?? templateId}</strong></p></article>
              </div>
              <div className="project-list">
                {previewClips.length === 0 ? <div className="empty">Todavía no hay clips generados.</div> : null}
                {previewClips.map((clip) => (
                  <div key={clip.id} className="project-item">
                    <strong>{clip.title}</strong>
                    <div className="timeline-label">{clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</div>
                    <div className="timeline-label">Headline: {clip.headlineText}</div>
                    <div className="timeline-label">Caption: {clip.captionText}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
