'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

type ScriptMode = 'headline' | 'caption' | 'mixed'

function buildScript(project: LocalProject, mode: ScriptMode) {
  return project.clips.map((clip, index) => {
    const headline = clip.headlineText?.trim() || ''
    const caption = clip.captionText?.trim() || ''
    const title = clip.title?.trim() || `Clip ${index + 1}`

    let text = ''
    if (mode === 'headline') text = headline || title
    if (mode === 'caption') text = caption || headline || title
    if (mode === 'mixed') text = [headline || title, caption].filter(Boolean).join('. ')

    return {
      index: index + 1,
      title,
      start: clip.start,
      end: clip.end,
      text: text.trim(),
    }
  })
}

export default function StudioScriptPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mode, setMode] = useState<ScriptMode>('mixed')
  const [intro, setIntro] = useState('')
  const [outro, setOutro] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveId(next[0]?.id ?? null)
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])

  const rows = useMemo(() => active ? buildScript(active, mode) : [], [active, mode])

  const combinedText = useMemo(() => {
    const parts = [intro.trim(), ...rows.map((row) => row.text).filter(Boolean), outro.trim()].filter(Boolean)
    return parts.join('\n\n')
  }, [intro, rows, outro])

  const estimatedWords = useMemo(() => {
    return combinedText.trim() ? combinedText.trim().split(/\s+/).length : 0
  }, [combinedText])

  const estimatedSpeechSeconds = useMemo(() => {
    if (!estimatedWords) return 0
    return (estimatedWords / 2.4)
  }, [estimatedWords])

  function persistProject(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function applyScriptToCaptions() {
    if (!active) return
    persistProject(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip, index) => ({
          ...clip,
          captionText: rows[index]?.text || clip.captionText,
        })),
      }),
      'Guion aplicado a captions del proyecto',
    )
  }

  function exportScriptTxt() {
    if (!active) return
    const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${active.name.replace(/\s+/g, '-').toLowerCase()}-script.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Guion exportado en TXT')
  }

  function exportScriptJson() {
    if (!active) return
    const payload = {
      app: 'MentaCut',
      kind: 'project-script',
      exportedAt: new Date().toISOString(),
      projectId: active.id,
      projectName: active.name,
      mode,
      intro,
      outro,
      rows,
      combinedText,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${active.name.replace(/\s+/g, '-').toLowerCase()}-script.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Guion exportado en JSON')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Script</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/text-tools" className="nav-link">Text tools</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Guion y narración del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Convierte clips en un texto corrido.</h1>
            <p className="sub">
              Esta pantalla ayuda a preparar voz en off, subtítulos o revisión de copy usando el contenido ya escrito en títulos, headlines y captions del proyecto.
            </p>
            <div className="action-row">
              <Link href="/studio/text-tools" className="btn btn-primary">Abrir text tools</Link>
              <Link href="/studio/storyboard" className="btn">Abrir storyboard</Link>
              <button className="btn" onClick={applyScriptToCaptions} disabled={!active}>Aplicar a captions</button>
            </div>
            <div className="timeline-label">{status || 'Elige modo de generación y exporta el guion si lo necesitas.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Generación del guion</h2>
                <div className="timeline-label">Fuente del texto</div>
              </div>
              <div className="form">
                <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={mode} onChange={(event) => setMode(event.target.value as ScriptMode)}>
                  <option value="headline">Usar headlines</option>
                  <option value="caption">Usar captions</option>
                  <option value="mixed">Mezclar headline + caption</option>
                </select>
                <textarea className="textarea" rows={3} value={intro} onChange={(event) => setIntro(event.target.value)} placeholder="Intro opcional del guion" />
                <textarea className="textarea" rows={3} value={outro} onChange={(event) => setOutro(event.target.value)} placeholder="Outro o CTA final opcional" />
                <div className="action-row">
                  <button className="btn btn-primary" onClick={exportScriptTxt} disabled={!active}>Exportar TXT</button>
                  <button className="btn" onClick={exportScriptJson} disabled={!active}>Exportar JSON</button>
                </div>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen del guion</h2>
                <div className="timeline-label">Estimación rápida</div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Bloques</h3><p><strong>{rows.length}</strong></p></article>
                <article className="panel card"><h3>Palabras</h3><p><strong>{estimatedWords}</strong></p></article>
                <article className="panel card"><h3>Lectura aprox.</h3><p><strong>{estimatedSpeechSeconds.toFixed(1)} s</strong></p></article>
                <article className="panel card"><h3>Modo</h3><p><strong>{mode === 'headline' ? 'Headlines' : mode === 'caption' ? 'Captions' : 'Mixto'}</strong></p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Bloques del guion</h2>
                <div className="timeline-label">Clip por clip</div>
              </div>
              <div className="project-list">
                {rows.length === 0 ? <div className="empty">No hay proyecto o clips para generar guion.</div> : null}
                {rows.map((row) => (
                  <div key={`${row.index}-${row.title}`} className="project-item">
                    <strong>#{row.index} · {row.title}</strong>
                    <div className="timeline-label">{row.start.toFixed(1)}s → {row.end.toFixed(1)}s</div>
                    <div className="timeline-label">{row.text || 'Sin texto'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Texto corrido</h2>
                <div className="timeline-label">Preview final</div>
              </div>
              <textarea className="textarea" rows={22} value={combinedText} readOnly />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
