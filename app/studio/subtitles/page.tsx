'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import { buildSubtitleCues, exportCuesToSrt, type SubtitleMode } from '@/lib/subtitle-utils'

export default function StudioSubtitlesPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mode, setMode] = useState<SubtitleMode>('mixed')
  const [uppercase, setUppercase] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveId(next[0]?.id ?? null)
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])

  const cues = useMemo(() => {
    if (!active) return []
    return buildSubtitleCues(active, mode).map((cue) => ({
      ...cue,
      text: uppercase ? cue.text.toUpperCase() : cue.text,
    }))
  }, [active, mode, uppercase])

  const srtText = useMemo(() => exportCuesToSrt(cues), [cues])

  const stats = useMemo(() => ({
    cues: cues.length,
    words: srtText.trim() ? srtText.replace(/\d+\n/g, '').split(/\s+/).filter(Boolean).length : 0,
    duration: active?.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0) ?? 0,
  }), [cues, srtText, active])

  function exportSrt() {
    if (!active) return
    const blob = new Blob([srtText], { type: 'application/x-subrip;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${active.name.replace(/\s+/g, '-').toLowerCase()}-subtitles.srt`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Subtítulos exportados en SRT')
  }

  function exportJson() {
    if (!active) return
    const payload = {
      app: 'MentaCut',
      kind: 'project-subtitles',
      exportedAt: new Date().toISOString(),
      projectId: active.id,
      projectName: active.name,
      mode,
      uppercase,
      cues,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${active.name.replace(/\s+/g, '-').toLowerCase()}-subtitles.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Subtítulos exportados en JSON')
  }

  function applyCuesToCaptions() {
    if (!active) return
    const updated = projects.map((project) => {
      if (project.id !== active.id) return project
      return touchProject({
        ...project,
        clips: project.clips.map((clip, index) => ({
          ...clip,
          captionText: cues[index]?.text || clip.captionText,
        })),
      })
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus('Subtítulos aplicados a captions del proyecto')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Subtitles</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/script" className="nav-link">Script</Link>
          <Link href="/studio/text-tools" className="nav-link">Text tools</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Generador de subtítulos del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Saca cues listos para SRT o JSON.</h1>
            <p className="sub">
              Esta pantalla convierte el contenido del proyecto en subtítulos temporizados por clip, útiles para revisión, subtitulado base o preparación de voz en off.
            </p>
            <div className="action-row">
              <Link href="/studio/script" className="btn btn-primary">Abrir script</Link>
              <Link href="/studio/text-tools" className="btn">Abrir text tools</Link>
              <button className="btn" onClick={applyCuesToCaptions} disabled={!active}>Aplicar a captions</button>
            </div>
            <div className="timeline-label">{status || 'Elige modo y exporta los subtítulos del proyecto.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Configuración</h2>
                <div className="timeline-label">Generación de cues</div>
              </div>
              <div className="form">
                <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={mode} onChange={(event) => setMode(event.target.value as SubtitleMode)}>
                  <option value="headline">Usar headlines</option>
                  <option value="caption">Usar captions</option>
                  <option value="mixed">Mezclar headline + caption</option>
                </select>
                <label className="project-item" style={{ cursor: 'pointer' }}>
                  <strong>Forzar mayúsculas</strong>
                  <div className="timeline-label">{uppercase ? 'Activo' : 'Inactivo'}</div>
                  <input type="checkbox" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} />
                </label>
                <div className="action-row">
                  <button className="btn btn-primary" onClick={exportSrt} disabled={!active}>Exportar SRT</button>
                  <button className="btn" onClick={exportJson} disabled={!active}>Exportar JSON</button>
                </div>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen</h2>
                <div className="timeline-label">Proyecto activo</div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Cues</h3><p><strong>{stats.cues}</strong></p></article>
                <article className="panel card"><h3>Palabras</h3><p><strong>{stats.words}</strong></p></article>
                <article className="panel card"><h3>Duración total</h3><p><strong>{stats.duration.toFixed(1)} s</strong></p></article>
                <article className="panel card"><h3>Modo</h3><p><strong>{mode === 'headline' ? 'Headlines' : mode === 'caption' ? 'Captions' : 'Mixto'}</strong></p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview de cues</h2>
                <div className="timeline-label">Clip por clip</div>
              </div>
              <div className="project-list">
                {cues.length === 0 ? <div className="empty">No hay cues para mostrar.</div> : null}
                {cues.map((cue) => (
                  <div key={cue.id} className="project-item">
                    <strong>#{cue.index} · {cue.clipTitle}</strong>
                    <div className="timeline-label">{cue.start.toFixed(1)}s → {cue.end.toFixed(1)}s</div>
                    <div className="timeline-label">{cue.text || 'Sin texto'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Salida SRT</h2>
                <div className="timeline-label">Preview exportable</div>
              </div>
              <textarea className="textarea" rows={22} value={srtText} readOnly />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
